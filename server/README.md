# Blue Metal ERP — Backend API

Backend service for Blue Metal Quarry Management ERP built with Node.js, Express, and MongoDB (Mongoose).

---

## Phase 4 API Reference

### 1. Dashboard Analytics Summary
* **Endpoint:** `GET /api/dashboard/summary`
* **Access:** Authenticated (`admin`, `manager`, `viewer`)
* **Query Parameters:**
  * `from` *(optional)*: Start date in ISO format (e.g. `2026-11-01`). Defaults to start of current month in `Asia/Kolkata` (00:00:00.000 IST).
  * `to` *(optional)*: End date in ISO format (e.g. `2026-11-30`). Defaults to end of current month in `Asia/Kolkata` (23:59:59.999 IST).
* **Response Body (`data`):**
  * `from`: ISO string of start boundary.
  * `to`: ISO string of end boundary.
  * `totalSales`: Total sales revenue in range.
  * `totalPurchases`: Total quarry expenses and rent in range.
  * `netBalance`: Net operating margin (`totalSales - totalPurchases`).
  * `loadsCount`: Number of dispatched loads in range.
  * `passes`: `{ total, active, expiringSoon, treasuryBalance }` (reusing pass inventory service).
  * `topAgents`: Array of top 5 agents sorted by revenue with `{ _id, name, total }`.
  * `dailySeries`: Zero-filled chronological array of `{ date, revenue, expense }` for every calendar day in range.

---

### 2. Operational Backup Export
* **Endpoint:** `GET /api/backup/export`
* **Access:** Authenticated (`admin` only)
* **Response:** Downloadable JSON file (`Content-Disposition: attachment; filename="blue-metal-backup-YYYY-MM-DD.json"`).
* **Security:** Excludes user accounts, authentication tokens, and password hashes entirely.
* **Payload Structure:**
  * `meta`: `{ exportedAt, counts: { agents, subBuyers, loads, purchases, passBatches, treasuryLedger, settings } }`
  * `data`: All collections serialized cleanly.

---

### 3. Excel Spreadsheet Exports
* **Endpoints:**
  * `GET /api/export/loads.xlsx`
  * `GET /api/export/purchases.xlsx`
* **Access:** Authenticated (`admin`, `manager`, `viewer`)
* **Query Parameters:** `from` *(optional)*, `to` *(optional)*
* **Format:** OpenXML Spreadsheet (`.xlsx`) streamed with content-type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
* **Features:** Bold dark-themed headers, Indian Rupee currency format (`₹#,##0.00`), populated relations (Agent, Sub-buyer, Batch), and highlighted summary total row at the bottom.

---

### 4. Executive PDF Report Export
* **Endpoint:** `GET /api/export/report.pdf`
* **Access:** Authenticated (`admin`, `manager`, `viewer`)
* **Query Parameters:** `from` *(optional)*, `to` *(optional)*
* **Format:** Streamed PDF (`application/pdf`) via PDFKit.
* **Layout:** A4 executive layout containing:
  1. Header banner with reporting date boundaries and generation timestamp.
  2. Four key financial KPI summary cards (Sales, Purchases, Net Margin, Loads).
  3. Transit pass & Treasury inventory breakdown.
  4. Top 5 performing agents ranking table with revenue and percentage share.
