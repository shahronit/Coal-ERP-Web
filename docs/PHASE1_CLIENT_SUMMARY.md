# VK Trading ERP — Phase 1 Delivery Summary

**Prepared for:** Client review  
**Product:** VK Trading ERP (Desktop application for coal trading operations)  
**Phase:** Phase 1 — Core trading platform, executive dashboard, and Super Admin control center

---

## Executive summary

Phase 1 delivers a **production-ready desktop ERP** tailored for coal trading businesses. The system runs entirely on the client’s computer with **local SQLite storage** — no cloud dependency required for day-to-day operations.

At the center of Phase 1 are three pillars:

1. **Purchase & Sales modules** — end-to-end trading workflows with GST, freight, adjustments, and profit tracking
2. **Executive Dashboard** — real-time KPIs, trends, and one-click access to daily operations
3. **Super Admin portal** — full control over users, branding, permissions, backups, and system configuration

Together, these give management a single place to **record trades, monitor performance, control access, and protect business data**.

---

## 1. Platform foundation

| Capability | What the client gets |
|------------|----------------------|
| **Desktop application** | Native Windows/macOS app (Electron) — install once, run offline |
| **Local data ownership** | All transactions stored on the PC; database survives app updates |
| **Secure access** | Login with JWT authentication; role-based permissions on every screen |
| **First-run setup** | Guided setup wizard for company profile and initial configuration |
| **Bilingual interface** | English and Hindi across the application |
| **Modern UI** | Professional glass-themed interface with responsive layout and animations |

---

## 2. Purchase module

A complete **coal purchase lifecycle** from draft to confirmed stock.

**Features delivered:**

- Create and edit purchase bills with multiple line items (coal quality, weight, rate, GST)
- Link purchases to **suppliers**, **locations**, and **purchase batches**
- Support for **direct and other purchase types** with truck numbers and notes
- **Freight and landed cost** handling per line or at bill level
- **Expense adjustments** tied to expense types (e.g. handling, logistics)
- **Draft → Confirm** workflow — stock is updated only on confirmation
- Live **preview totals** (subtotal, GST, grand total) before saving
- Purchase listing with filters, search, and permission-based create/edit/delete
- Inline **field-level validation** with clear error messages (English/Hindi)

**Business value:** Accurate recording of inbound coal, GST-compliant bills, and automatic stock increase on confirmation — the foundation for inventory and profit calculations.

---

## 3. Sales module

A complete **coal sales lifecycle** with **FIFO-based costing and profit preview**.

**Features delivered:**

- Create sales for **domestic and export** customers
- Multi-line sales with coal quality, weight, rate, and GST per line
- Link to **customers**, **locations**, and **sales batches**
- **Freight entries** on outbound deliveries
- **Expense and income adjustments** on sales (typed heads from master data)
- **FIFO cost preview** before posting — shows loaded purchase cost per MT and line profit
- Configurable cost basis (**ex-GST or inc-GST**) from admin settings
- Automatic **stock deduction** on sale confirmation using FIFO allocation
- Sales listing, detail view, and permission-controlled access
- Full inline validation aligned with backend rules

**Business value:** Every sale shows **real margin** based on actual purchase cost (FIFO), not manual estimates — critical for coal trading profitability.

---

## 4. Executive dashboard

A **permission-aware command center** that adapts to each user’s role.

**KPI cards (role-based visibility):**

- Current inventory (MT)
- Sales and purchase totals
- Profit & loss summary
- Outstanding receivables/payables
- Partner investment snapshot

**Charts & analytics:**

- Purchase vs sales trends over time
- Profit trend visualization
- Top customers and top suppliers
- Stock breakdown by coal quality

**Quick actions:**

- New purchase
- Profit & Loss review
- Accounting reports (P&L, aging, day book, GST)
- Reports hub
- Inventory and payments shortcuts

**Business value:** Owners and managers open one screen each morning and see **business health at a glance**, then jump directly into the task they need.

---

## 5. Super Admin portal (complete administration)

Full **system governance** for Super Admin and Admin roles.

### 5.1 User management

- Create, edit, deactivate, and delete team accounts
- Assign roles: **Super Admin, Admin, Finance, Operations, Read Only**
- Role hierarchy enforcement (e.g. Admin cannot manage Super Admin accounts)
- Password policies and secure credential handling

### 5.2 Settings & configuration

| Area | Admin capabilities |
|------|-------------------|
| **Branding** | Custom app name, company name, logo on login and sidebar |
| **FIFO / inventory** | Choose ex-GST or inc-GST cost basis for profit calculation |
| **Role module matrix** | Control which modules Finance, Operations, and Read Only can access |
| **CRM toggle** | Enable or disable CRM module organization-wide |
| **Sample data** | Load demo masters, purchases, and sales for training |
| **Database location** | Point to portable `.db` file (USB / external drive) |
| **Automated backups** | Monthly zip backups (DB + uploads), configurable folder, manual backup/restore |
| **Backup history** | View and restore from prior snapshots with safety backup before restore |

### 5.3 Account & security

- User profile page (name, contact, password change)
- Audit trail — who changed what and when
- Notifications for system alerts and reminders
- Setup wizard for first-time company onboarding

**Business value:** The client **owns the system** — no vendor lock-in for daily ops, full control over team access, branding, data location, and disaster recovery.

---

## 6. Phase 1 supporting modules (foundation)

These modules were built alongside purchases and sales to make the trading workflow complete:

| Module | Purpose |
|--------|---------|
| **Master data** | Partners, suppliers, customers, coal qualities, batches, locations, tax, expense/income/asset types |
| **Inventory & batches** | FIFO stock ledger, batch-wise tracking, stock by quality/location |
| **Payments** | Money received/paid, outstanding balances |
| **Profit & Loss** | Per-sale and batch margin analysis |
| **Accounting** | P&L statement, aging, day book, GST summary |
| **Expenses, assets, investments** | Operational costs and partner finance |
| **Reports** | Standard Excel/PDF/CSV exports, business documents, custom report templates |
| **Documents** | Upload and manage invoices, bills, contracts |
| **CRM** | Leads and activities (optional, admin-controlled) |
| **Global search** | Find transactions, parties, and batches from anywhere in the app |
| **Help center** | In-app guidance and onboarding tour |

---

## 7. Quality & reliability

- **End-to-end validation** — consistent field errors on forms (frontend + backend)
- **Permission-based UI** — users only see modules and actions they are allowed to use
- **Single-instance desktop app** — prevents database corruption from multiple windows
- **Automatic migrations** — database schema updates safely on each launch
- **Architecture documentation** — README and architecture diagrams for IT handover

---

## 8. Phase 1 deliverables checklist

| Deliverable | Status |
|-------------|--------|
| Desktop app (dev + production build path) | Delivered |
| Purchase module (create, edit, confirm, list) | Delivered |
| Sales module (FIFO preview, profit, confirm) | Delivered |
| Executive dashboard with KPIs and charts | Delivered |
| Super Admin — user management | Delivered |
| Super Admin — settings, branding, backups | Delivered |
| Super Admin — role & module access control | Delivered |
| Master data & inventory (FIFO) | Delivered |
| Reports & document exports | Delivered |
| English + Hindi UI | Delivered |

---

## 9. Recommended next steps for the client

1. **Install** the desktop application on the primary business PC
2. **Complete setup wizard** and change default Super Admin password
3. **Configure branding** (company name, logo) under Settings
4. **Create user accounts** for Finance, Operations, and Read Only staff
5. **Set module access** per role in Settings
6. **Enter master data** (suppliers, customers, coal qualities, locations)
7. **Enable automatic backups** and verify first backup
8. **Optional:** Load sample data for team training before go-live

---

## Closing note

Phase 1 establishes **VK Trading ERP** as a self-contained, professional trading platform: purchases and sales are fully operational with FIFO profit logic, leadership has a real-time dashboard, and Super Admin has complete control over users, security, branding, and data protection.

---

## Related documentation

- [README](../README.md) — installation, roles, troubleshooting
- [ARCHITECTURE.md](./ARCHITECTURE.md) — technical architecture and flow diagrams
