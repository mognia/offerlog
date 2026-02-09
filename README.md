# 🚀 OfferLog
### The Personal CRM for Serious Job Hunters

**OfferLog** is a production-grade job application tracker designed to behave like a real product, not a demo CRUD app.  
It eliminates job-hunt data chaos by enforcing a strict interview pipeline, automatic data hygiene, and analytics that show *exactly* where your funnel is leaking.

- Demo User Email for Login = demo@offerlog.dev.
- Demo User Pass for Login = demo1234.
 
---

## ✨ Key Features

### 🛠️ The Pipeline Engine
Manage applications through a **structured, opinionated lifecycle**.

- **Immutable History**  
  Once an application is `HIRED`, `REJECTED`, or `GHOSTED`, it is locked. No retroactive edits, no corrupted analytics.

- **Event-Driven Timeline**  
  Every interaction (email, call, tech screen, onsite) is logged as a first-class event with outcomes and follow-up logic.

- **Automatic Benchmarking**  
  `firstResponseAt` is computed automatically from inbound activity. No manual timestamps, no human error.

---

### 🎯 Action Center
Stop guessing who to follow up with.

- **Overdue Follow-ups**  
  Flagged automatically based on `followUpAt` rules.

- **Stale Applications**  
  Highlights open roles with no activity for 7, 14, or 21 days.

- **Response Risk Detection**  
  Surfaces applications that exceeded your expected response window.

---

### 📊 Professional Dashboards
Insights usually reserved for recruiting teams, computed directly from your own data.

- **Funnel Analytics**  
  Conversion rates from `Applied → Screen → Offer → Hire`.

- **Speed Metrics**  
  Median and p75 *Time-to-First-Response* and *Time-to-Hire*.

- **ROI Analysis**  
  See which sources (LinkedIn, referrals, cold outreach) actually convert.

- **Hygiene Scores**  
  Measure how consistently you log feedback and set follow-ups.

---

## 🏗️ The Engine Room (Tech Stack)

| Layer | Technology |
|-----|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI | shadcn/ui (Radix UI), Lucide Icons |
| Forms & Validation | React Hook Form, Zod |
| Data Layer | Custom `useApiQuery` / `useApiAction` hooks |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | Custom DB-backed sessions, Argon2 hashing, HttpOnly cookies |
| Email | Resend (verification + transactional) |

---

## 🧠 Architecture & Core Logic

### 🔐 Secure Authentication
OfferLog uses **custom session management**, not third-party auth black boxes.

- **Hashed Sessions**  
  Session tokens are stored as one-way hashes in the database.

- **HttpOnly Cookies**  
  Tokens are delivered via secure, `SameSite=Lax` cookies.

- **Full Revocation**  
  Logging out or resetting your password instantly invalidates all active sessions.

---

### 🧩 The Product Brain (Domain Rules)

- **State Protection**  
  Closed applications cannot be modified. Metrics stay honest.

- **Deterministic Source Bucketing**  
  Free-text sources like `"LinkedIn Job Post"` or `"LI"` are normalized into clean reporting buckets.  
  Unknown or empty sources automatically fall back to `OTHER`, no broken charts.

- **Timezone-Aware Metrics**  
  Data is stored in UTC but all analytics are calculated in the user’s local timezone.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/offerlog.git
cd offerlog
npm install
```
### 1) Install dependencies

```bash

npm install



# or: pnpm install / yarn

```



### 2) Configure environment variables



- Configure environment variables (change .env.example to .env ) and add real values



### 3) Prisma Setup



```bash

pnpm prisma generate



pnpm prisma migrate dev

```

### 4) Run The App

```bash

npm run dev

```
