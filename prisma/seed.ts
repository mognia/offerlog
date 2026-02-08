import { hash } from "argon2";

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { Prisma } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const DEMO_EMAIL = "demo@offerlog.dev";
const DEMO_PASSWORD = "demo1234";

function daysAgo(now: Date, d: number) {
    return new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
}

async function main() {
    const now = new Date();

    // --- Clean previous demo user (dev-friendly, avoids duplicates)
    const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (existing) {
        // Cascade deletes handle children, but explicit order avoids surprises
        await prisma.session.deleteMany({ where: { userId: existing.id } });
        await prisma.emailVerificationToken.deleteMany({ where: { userId: existing.id } });
        await prisma.passwordResetToken.deleteMany({ where: { userId: existing.id } });

        // Delete app graph: events -> stages -> apps
        const apps = await prisma.application.findMany({
            where: { userId: existing.id },
            select: { id: true },
        });

        if (apps.length) {
            const stageIds = await prisma.interviewStage.findMany({
                where: { applicationId: { in: apps.map(a => a.id) } },
                select: { id: true },
            });

            if (stageIds.length) {
                await prisma.interviewEvent.deleteMany({
                    where: { stageId: { in: stageIds.map(s => s.id) } },
                });
            }

            await prisma.interviewStage.deleteMany({
                where: { applicationId: { in: apps.map(a => a.id) } },
            });

            await prisma.application.deleteMany({ where: { id: { in: apps.map(a => a.id) } } });
        }

        await prisma.oAuthAccount.deleteMany({ where: { userId: existing.id } });
        await prisma.user.delete({ where: { id: existing.id } });
    }

    // --- Create demo user
    const passwordHash = await hash(DEMO_PASSWORD);

    const user = await prisma.user.create({
        data: {
            email: DEMO_EMAIL,
            passwordHash,
            emailVerifiedAt: now,
        },
    });

    // --- Helpers to keep lastActivityAt consistent
    type AppCreate = Omit<Prisma.ApplicationCreateInput, "user"> & {
        userId?: never; // forbid userId entirely
    };

    const createApp = (data: AppCreate) =>
        prisma.application.create({
            data: {
                ...data,
                user: { connect: { id: user.id } },
            },
        });

    // --- Applications (8 total, covers everything)
    // 1) HIRED, full funnel
    const stripe = await createApp({
        status: "HIRED",
        companyName: "Stripe",
        roleTitle: "Frontend Engineer",
        source: "Referral",
        workMode: "REMOTE",
        appliedAt: daysAgo(now, 45),
        firstResponseAt: daysAgo(now, 40),
        lastActivityAt: daysAgo(now, 5),
        closedAt: daysAgo(now, 5),
        notes: "Happy-path funnel, used to validate speed + funnel metrics.",
    });

    // 2) REJECTED, mid funnel
    const shopify = await createApp({
        status: "REJECTED",
        companyName: "Shopify",
        roleTitle: "Senior Frontend",
        source: "LinkedIn",
        workMode: "REMOTE",
        appliedAt: daysAgo(now, 35),
        firstResponseAt: daysAgo(now, 33),
        lastActivityAt: daysAgo(now, 20),
        closedAt: daysAgo(now, 20),
    });

    // 3) GHOSTED, no inbound response ever (firstResponseAt stays null)
    const meta = await createApp({
        status: "GHOSTED",
        companyName: "Meta",
        roleTitle: "UI Engineer",
        source: "Company Website",
        workMode: "HYBRID",
        appliedAt: daysAgo(now, 50),
        firstResponseAt: null,
        lastActivityAt: daysAgo(now, 30),
        closedAt: daysAgo(now, 10),
        ghostedAt: daysAgo(now, 10),
    });

    // 4) OPEN, overdue follow-up
    const spotify = await createApp({
        status: "OPEN",
        companyName: "Spotify",
        roleTitle: "Frontend Developer",
        source: "LinkedIn Job Post",
        workMode: "REMOTE",
        appliedAt: daysAgo(now, 20),
        firstResponseAt: daysAgo(now, 18), // assume inbound exists in history
        lastActivityAt: daysAgo(now, 10),
    });

    // 5) OPEN, stale (no activity for 21+ days)
    const notion = await createApp({
        status: "OPEN",
        companyName: "Notion",
        roleTitle: "Senior Frontend",
        source: "LI", // should bucket into LinkedIn
        workMode: "REMOTE",
        appliedAt: daysAgo(now, 30),
        firstResponseAt: null, // no inbound yet
        lastActivityAt: daysAgo(now, 25),
    });

    // 6) OPEN, fast response, good hygiene
    const startupA = await createApp({
        status: "OPEN",
        companyName: "Startup A",
        roleTitle: "Frontend Contractor",
        source: "Cold Email",
        workMode: "REMOTE",
        appliedAt: daysAgo(now, 12),
        firstResponseAt: daysAgo(now, 11),
        lastActivityAt: daysAgo(now, 2),
    });

    // 7) REJECTED, early drop-off (applied -> recruiter screen -> fail)
    const agencyB = await createApp({
        status: "REJECTED",
        companyName: "Agency B",
        roleTitle: "React Developer",
        source: "Unknown Board XYZ", // should bucket to OTHER
        workMode: "REMOTE",
        appliedAt: daysAgo(now, 28),
        firstResponseAt: daysAgo(now, 27),
        lastActivityAt: daysAgo(now, 26),
        closedAt: daysAgo(now, 26),
    });

    // 8) OPEN, referral high ROI
    const referralCo = await createApp({
        status: "OPEN",
        companyName: "Referral Co",
        roleTitle: "Senior Frontend",
        source: "ref", // should bucket to Referral
        workMode: "REMOTE",
        appliedAt: daysAgo(now, 8),
        firstResponseAt: daysAgo(now, 7),
        lastActivityAt: daysAgo(now, 1),
    });

    // --- Stage + event helpers
    async function createStage(applicationId: string, title: string, stageType: any, orderIndex: number) {
        return prisma.interviewStage.create({
            data: { applicationId, title, stageType, orderIndex },
        });
    }

    type EventCreate = Omit<Prisma.InterviewEventCreateInput, "stage"> & {
        stageId?: never; // forbid stageId in checked create
    };

    const createEvent = (stageId: string, data: EventCreate) =>
        prisma.interviewEvent.create({
            data: {
                ...data,
                stage: { connect: { id: stageId } },
            },
        });

    // --- Stripe (HIRED) funnel stages/events
    const s1 = await createStage(stripe.id, "Applied", "APPLIED", 0);
    const s2 = await createStage(stripe.id, "Recruiter Screen", "RECRUITER_SCREEN", 1);
    const s3 = await createStage(stripe.id, "Tech Screen", "TECH_SCREEN", 2);
    const s4 = await createStage(stripe.id, "Onsite", "ONSITE", 3);
    const s5 = await createStage(stripe.id, "Offer", "OFFER", 4);

    await createEvent(s1.id, {
        occurredAt: daysAgo(now, 45),
        channel: "EMAIL",
        direction: "OUTBOUND",
        notes: "Applied via referral intro.",
        outcome: "PENDING",
    });

    await createEvent(s2.id, {
        occurredAt: daysAgo(now, 40),
        channel: "VIDEO",
        direction: "INBOUND",
        notes: "Recruiter screen completed.",
        outcome: "PASS",
        feedback: "Strong communication.",
    });

    await createEvent(s3.id, {
        occurredAt: daysAgo(now, 30),
        channel: "VIDEO",
        direction: "INBOUND",
        notes: "Tech screen, system design + UI architecture.",
        outcome: "PASS",
        nextTalkingPoints: "Ask about team ownership, deployment cadence.",
    });

    await createEvent(s4.id, {
        occurredAt: daysAgo(now, 18),
        channel: "ONSITE",
        direction: "INBOUND",
        notes: "Loop interviews.",
        outcome: "PASS",
    });

    await createEvent(s5.id, {
        occurredAt: daysAgo(now, 8),
        channel: "EMAIL",
        direction: "INBOUND",
        notes: "Offer received and accepted.",
        outcome: "PASS",
    });

    // --- Spotify (OPEN) overdue follow-up + mixed hygiene
    const sp1 = await createStage(spotify.id, "Applied", "APPLIED", 0);
    const sp2 = await createStage(spotify.id, "Recruiter Screen", "RECRUITER_SCREEN", 1);

    await createEvent(sp1.id, {
        occurredAt: daysAgo(now, 20),
        channel: "EMAIL",
        direction: "OUTBOUND",
        notes: "Applied via LinkedIn posting.",
        outcome: "PENDING",
    });

    await createEvent(sp2.id, {
        occurredAt: daysAgo(now, 18),
        channel: "VIDEO",
        direction: "INBOUND",
        notes: "Recruiter screen happened.",
        outcome: "PENDING",
        followUpAt: daysAgo(now, 7), // overdue
    });

    // --- Notion (OPEN) stale, no inbound response
    const n1 = await createStage(notion.id, "Applied", "APPLIED", 0);
    await createEvent(n1.id, {
        occurredAt: daysAgo(now, 30),
        channel: "EMAIL",
        direction: "OUTBOUND",
        notes: "Applied, no response yet.",
        outcome: "PENDING",
    });

    // --- Startup A (OPEN) good hygiene, follow-up done
    const a1 = await createStage(startupA.id, "Applied", "APPLIED", 0);
    const a2 = await createStage(startupA.id, "Tech Screen", "TECH_SCREEN", 1);

    await createEvent(a1.id, {
        occurredAt: daysAgo(now, 12),
        channel: "EMAIL",
        direction: "OUTBOUND",
        notes: "Cold outreach sent with portfolio + 2 min setup project.",
        outcome: "PENDING",
    });

    await createEvent(a2.id, {
        occurredAt: daysAgo(now, 11),
        channel: "CALL",
        direction: "INBOUND",
        notes: "Quick technical screen.",
        outcome: "PASS",
        followUpAt: daysAgo(now, 3),
        followUpDoneAt: daysAgo(now, 2),
        feedback: "Good fundamentals, wants deeper Next.js examples.",
    });

    // --- ReferralCo (OPEN) referral ROI booster
    const r1 = await createStage(referralCo.id, "Applied", "APPLIED", 0);
    const r2 = await createStage(referralCo.id, "Recruiter Screen", "RECRUITER_SCREEN", 1);

    await createEvent(r1.id, {
        occurredAt: daysAgo(now, 8),
        channel: "EMAIL",
        direction: "OUTBOUND",
        notes: "Referral intro made, sent CV and OfferLog demo link.",
        outcome: "PENDING",
    });

    await createEvent(r2.id, {
        occurredAt: daysAgo(now, 7),
        channel: "VIDEO",
        direction: "INBOUND",
        notes: "Recruiter screen scheduled quickly.",
        outcome: "PASS",
    });

    // --- Closed apps basic stage coverage (optional but helps funnel charts)
    async function seedClosedBasic(appId: string) {
        const st = await createStage(appId, "Applied", "APPLIED", 0);
        await createEvent(st.id, {
            occurredAt: daysAgo(now, 1), // doesn't matter for closed; still forms event history
            channel: "EMAIL",
            direction: "OUTBOUND",
            notes: "Seeded history for funnel aggregation.",
            outcome: "PENDING",
        });
    }

    await seedClosedBasic(shopify.id);
    await seedClosedBasic(meta.id);
    await seedClosedBasic(agencyB.id);

    // --- lastActivityAt sanity (optional, keeps demo consistent)
    // If your app logic recomputes lastActivityAt, this is harmless.
    // Otherwise, ensure lastActivityAt >= latest event date per app in real code.

    console.log("✅ Seed complete");
    console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });