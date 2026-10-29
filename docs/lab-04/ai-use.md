# Lab 4 AI Use and Reflection

## LLM Used

I used the **Antigravity** coding agent through my Google Cloud Platform account, pairing with **Claude Sonnet 4.6 (Thinking) and Claude Opus**.

---

## Key Prompts Table

The following table documents 7 selected key prompts used across the Lab 4 workflow: Specification, Backend Foundations, UI Implementation, Ticket Workflow & Resolution Gate, Dashboards, and Final Hardening.

| # | Prompt Name | Actual Prompt Text | Purpose / Outcome |
|---|---|---|---|
| 1 | **Creating Specification Documents** | "เขียนไฟล์ specification.md, api-spec.md, ui-spec.md, tests.md ตามlabsheet Lab 4 อย่างละเอียด" | Generated initial drafts of all four specification files covering Actions Taken, dashboards, status transitions, and test traceability. |
| 2 | **Database Model & Migration Strategy** | "ออกแบบ Prisma schema สำหรับ ActionTaken โดยต้องเชื่อมกับ Ticket แบบ 1-to-many ห้าม orphan ด้วย onDelete: Restrict และรองรับ audit trail" | ได้ Prisma schema migration ที่เพิ่มตาราง `ActionTaken` foreign key แบบ non-nullable restrict ดึง performedById อัตโนมัติจาก JWT token และ justification 4 ข้อใน `specification.md §9.3` |
| 3 | **Action Taken CRUD & Business Rules TDD** | "เขียน failing API integration tests สำหรับ Actions Taken ตาม BR-01 ถึง BR-10 และ BR-17" | สร้าง test suite `server/tests/lab-04/actions-taken.api.test.ts` และ `actions-taken.validation.test.ts` |
| 4 | **Responsive UI & Form State Recovery** | "สร้าง ActionsTaken panel ใน Ticket Detail ตาม ui-spec 3: รองรับทั้งตารางบน desktop และ stacked cards บน mobile 375px พร้อม client-side validation, autoset creator และ draft recovery เผื่อติด 409 STALE_UPDATE" | ได้ component `ActionsTaken.tsx` พร้อม client tests 7/7 ผ่าน มี responsive reflow และ Requester เห็นเฉพาะ read-only mode |
| 5 | **Status Transition & Resolution Gate OCC** | "Implement PATCH /api/tickets/:id/status ให้บังคับ Resolution Gate (ต้องมีมากกว่าหรือเท่ากับ 1 Action Taken + resolutionSummary) พร้อม Optimistic Concurrency Control ผ่าน expectedUpdatedAt และแยกระหว่าง external conflict กับ client self-retry" | ปรับแก้ `ticket-workflow` ที่ backend enforce resolution gate ป้องกัน bypass API และ frontend แสดง warning banner เฉพาะเมื่อเกิด concurrent edit |
| 6 | **Role Dashboard Metrics & Timezone Boundaries** | "สร้าง Requester Dashboard และ Staff Dashboard APIs" | ได้ endpoint `/api/dashboard/requester` และ `/api/dashboard/staff` รวมถึง component `StaffDashboard`, `RequesterDashboard` |
| 7 | **Hardening, Playwright E2E & Visual Artifacts** | "ตรวจ full regression ทั้งหมด รัน Playwright across Desktop (1280px), Tablet (820px), Mobile (375px) และแก้ navbar ลอย      ๆ ทับเนื้อหา" | สร้าง responsive screenshot ใหม่ `artifacts/lab-04/screenshots/` |
| 8 | **check across all labsheet & spec** | "ตรวจสอบว่าที่ทำในแลปนี้ถูกต้องครบถ้วน สมบูรณ์ ตาม labsheet 4 และ document ไหม รวมถึง screennshot และ checklist ใน document ทั้งหมด" | ได้รายงานผลว่าทำอะไรผ่าน อะไรยังต้องแก้ ขาดตกบกพร่องแล้วบ้าง |

---

## My Reflection
ผมใช้ AI ช่วยออกแบบ Spec-DD ก่อน เพื่อกำหนดขอบเขตงาน และวางแผนการทำงาน ช่วยแก้ปัญหาข้อผิดพลาดเช่น ปัญหา concurrency เช่น 409 Conflict ที่เกิดจากการแก้ไข ticket ซ้อนกัน และให้ช่วยอธิบายว่าข้อผิดพลาดเกิดจากอะไร เปรียบเสมือนเลขาคนนึง โดยรวมแล้วมีประโยชน์และช่วยให้งานเสร็จเร็วขึ้นแต่ก็ต้องคอยตรวจสอบความถูกต้องและปรับแก้เพื่อให้งานเสร็จสมบูรณ์