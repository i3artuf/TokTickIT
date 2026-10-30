import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";

// Ref: docs/lab-04/specification.md §10.1, BR-14, BR-16
// Ref: docs/lab-04/tests.md OCC-01
//
// Tests the atomic write predicate (WHERE updatedAt) in markTicketAppearsResolved.
//
// To reach the P2025 catch path we must bypass the soft OCC check.  The soft
// check fires only when the caller supplies expectedUpdatedAt; without it the
// function skips straight to the atomic UPDATE.  We therefore call the function
// with no expectedUpdatedAt and inject a real concurrent DB update *between*
// the service's own findUnique and update calls by temporarily replacing the
// bound `update` method with a wrapper that does the concurrent write first,
// then lets the original call proceed (and fail with P2025).
//
// Note: Prisma's internal Proxy prevents vi.spyOn from intercepting method
// calls on prisma.ticket directly.  Instead we use Object.defineProperty to
// swap in our wrapper on the live ticket-delegate object.

const MARKER = "OCC-UNIT";
let seq = 0;

describe("OCC service unit: markTicketAppearsResolved atomic predicate (BR-14, §10.1)", () => {
    let requester: any;
    let category: any;
    let relatedSystem: any;

    beforeAll(async () => {
        requester = await prisma.user.create({
            data: {
                name: `${MARKER}-Req-${Date.now()}`,
                email: `occ-req-${Date.now()}@test.local`,
                passwordHash: "x",
                role: "REQUESTER",
                isActive: true,
            },
        });

        category = await prisma.category.findFirst();
        relatedSystem = await prisma.relatedSystem.findFirst();
    });

    afterAll(async () => {
        await prisma.ticket.deleteMany({ where: { ticketNumber: { startsWith: MARKER } } });
        await prisma.user.deleteMany({ where: { name: { startsWith: MARKER } } });
    });

    async function createTicket(opts: { status?: string; appearsResolved?: boolean } = {}) {
        seq += 1;
        return prisma.ticket.create({
            data: {
                ticketNumber: `${MARKER}-${Date.now()}-${seq}`,
                requesterId: requester.id,
                categoryId: category.id,
                relatedSystemId: relatedSystem.id,
                requestedPriority: "MEDIUM",
                itPriority: "MEDIUM",
                currentStatus: (opts.status ?? "RESOLVED") as any,
                appearsResolved: opts.appearsResolved ?? false,
                summary: `${MARKER} fixture`,
                description: "OCC unit test fixture.",
            },
        });
    }

    it("OCC-01 (atomic predicate): WHERE updatedAt catches a between-read-and-write concurrent modification and returns STALE_UPDATE", async () => {
        // 1. Create ticket at T1
        const ticket = await createTicket({ status: "RESOLVED", appearsResolved: false });
        const t1 = ticket.updatedAt;

        // 2. Wrap prisma.ticket.update so that the FIRST call (the service's
        //    atomic write) triggers a concurrent Staff-Reopen (T2) before it
        //    executes, guaranteeing WHERE { updatedAt: T1 } finds no row → P2025.
        const delegate = (prisma as any).ticket;
        const originalUpdate = delegate.update.bind(delegate);

        let injected = false;
        delegate.update = async (args: any) => {
            if (!injected && args?.where?.updatedAt) {
                injected = true;
                // Concurrent write: Reopen bumps updatedAt to T2 and clears appearsResolved (BR-16)
                await originalUpdate({
                    where: { id: ticket.id },
                    data: {
                        currentStatus: "REOPENED",
                        appearsResolved: false,
                        updatedAt: new Date(t1.getTime() + 1),
                    },
                });
            }
            return originalUpdate(args);
        };

        let result: any;
        try {
            // Import after spy is set up; call without expectedUpdatedAt → soft check skipped
            const { markTicketAppearsResolved } = await import("../../src/services/commentsNotes.service");
            result = await markTicketAppearsResolved(
                ticket.id,
                requester.id,
                { appearsResolved: true }   // no expectedUpdatedAt → bypass soft check
            );
        } finally {
            // Restore original method
            delegate.update = originalUpdate;
        }

        // 3. Service must return STALE_UPDATE from the P2025 catch block
        expect((result as any).stale, "expected stale: true from P2025 catch").toBe(true);
        expect((result as any).current).toBeDefined();

        // 4. DB must reflect the Reopen state; the Requester write did NOT land
        const final = await prisma.ticket.findUnique({ where: { id: ticket.id } });
        expect(final!.appearsResolved).toBe(false);
        expect(final!.currentStatus).toBe("REOPENED");
    });

    it("OCC-01 (happy path): markTicketAppearsResolved writes successfully when no concurrent modification occurs", async () => {
        const { markTicketAppearsResolved } = await import("../../src/services/commentsNotes.service");
        const ticket = await createTicket({ status: "RESOLVED", appearsResolved: false });

        const result = await markTicketAppearsResolved(ticket.id, requester.id, { appearsResolved: true });

        expect((result as any).data).toBeDefined();
        expect((result as any).data.appearsResolved).toBe(true);

        const final = await prisma.ticket.findUnique({ where: { id: ticket.id } });
        expect(final!.appearsResolved).toBe(true);
    });
});
