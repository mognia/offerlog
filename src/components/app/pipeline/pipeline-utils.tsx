import React from "react";
import { Mail, Phone, Video, MapPin, MessageSquare, Briefcase } from "lucide-react";

export function formatDate(s?: string | null) {
    if (!s) return "";
    const d = new Date(s);
    return Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
}

export function getChannelIcon(channel: string) {
    switch (channel) {
        case "EMAIL":
            return <Mail className="h-4 w-4" />;
        case "CALL":
            return <Phone className="h-4 w-4" />;
        case "VIDEO":
            return <Video className="h-4 w-4" />;
        case "ONSITE":
            return <MapPin className="h-4 w-4" />;
        case "CHAT":
            return <MessageSquare className="h-4 w-4" />;
        default:
            return <Briefcase className="h-4 w-4" />;
    }
}