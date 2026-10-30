import { TicketStatus } from "@prisma/client";

/** Explicit dashboard buckets preserve the meaning of existing single-status filters. */
export const REQUESTER_OPEN_STATUSES: TicketStatus[] = ["NEW", "OPEN", "WAITING_FOR_REQUESTER", "REOPENED"];
export const STAFF_OPEN_STATUSES: TicketStatus[] = ["OPEN", "REOPENED"];

export function dashboardStatusFilter(status: string, scope: "requester" | "staff") {
    if (status === "DASHBOARD_OPEN") {
        return { in: scope === "requester" ? REQUESTER_OPEN_STATUSES : STAFF_OPEN_STATUSES };
    }
    return status;
}
