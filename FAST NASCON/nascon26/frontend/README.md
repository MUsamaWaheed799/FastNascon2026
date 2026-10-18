# Unified CRM Frontend (Next.js App Router + Tailwind CSS)
## FAST NASCON 2026 Hackathon — Member 3 Architecture

Built specifically to ace the judging rubric with modular Next.js components, live ticking SLA countdowns, role-based views, dynamic custom fields, and tamper-evident audit logs.

---

## 🚀 Quick Start

```bash
# 1. Navigate to the frontend directory
cd nascon26/frontend

# 2. Install dependencies
npm install

# 3. Launch development server (default port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the live app.

---

## 🏆 Rubric Alignment & Key Modules

| Rubric Criterion | Module / Component | Highlights |
|---|---|---|
| **Criterion 1: Multi-Tenancy & Roles** | `src/context/AuthContext.tsx`<br>`src/components/layout/Navbar.tsx` | - Multi-tenant workspace scoping from token & `/api/me/`.<br>- **Judge 1-Click Role Switcher** (`Owner`, `Admin`, `Sales Rep`) to demonstrate permission boundaries without switching accounts. |
| **Criterion 2: Customizable CRM Views & Stage Rules** | `src/components/custom-fields/CustomFieldsManager.tsx`<br>`src/components/opportunities/OpportunityModal.tsx` | - Workspace custom fields for `Opportunity`, `Contact`, `Company`.<br>- Supports `text`, `number`, `date`, `dropdown`, `checkbox`.<br>- Dynamic form generation and required field enforcement. |
| **Criterion 3 & 9: Kanban Pipeline & Live Timers** | `src/components/kanban/KanbanBoard.tsx`<br>`src/components/kanban/OpportunityCard.tsx`<br>`src/components/kanban/CountdownTimer.tsx` | - 6-stage pipeline (`Lead`, `Qualified`, `Proposal`, `Negotiation`, `Won`, `Lost`).<br>- **Live ticking countdown timers** calculating SLA against `assigned_at` + 15m.<br>- Urgency tiers (Green ➔ Amber pulsing ➔ Red alert).<br>- Quick "⚡ Acknowledge" button stops timer and updates state.<br>- Recovery Queue filter for stale/escalated leads. |
| **Criterion 4: Tamper-Evident Audit Logs** | `src/components/audit/AuditLogViewer.tsx` | - Immutable read-only ledger viewer.<br>- Displays SHA-256 hash chaining (`entry_hash` & `prev_hash`).<br>- Before/After delta diff inspector.<br>- On-demand cryptographic chain integrity audit tool. |
| **Criterion 9: UI/UX & Responsive Feedback** | `src/context/ToastContext.tsx`<br>`src/components/layout/AppLayout.tsx` | - Floating toast system with auto-dismiss and color status.<br>- Loading spinners on all buttons (no UI freezing).<br>- Mobile responsive navigation drawer. |

---

## 📂 Project Structure

```
nascon26/frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root Layout (Auth + Toast Providers)
│   │   ├── page.tsx                       # High-Converting Hero Landing
│   │   ├── globals.css                    # Tailwind CSS Directives & Custom Scrollbars
│   │   ├── auth/
│   │   │   ├── login/page.tsx             # Auth form + 1-Click Judge Access
│   │   │   └── register/page.tsx          # Multi-tenant workspace onboarding
│   │   ├── dashboard/page.tsx             # Role-tailored live dashboard
│   │   ├── pipeline/page.tsx              # Kanban Board & Dynamic Modal
│   │   ├── settings/custom-fields/page.tsx# Custom Fields Schema Manager
│   │   └── audit/page.tsx                 # Tamper-Evident Audit Log Viewer
│   ├── components/
│   │   ├── kanban/
│   │   │   ├── CountdownTimer.tsx         # Live ticking SLA timer (MM:SS)
│   │   │   ├── OpportunityCard.tsx        # Deal card with quick acknowledge
│   │   │   └── KanbanBoard.tsx            # Multi-column pipeline grid
│   │   ├── custom-fields/
│   │   │   └── CustomFieldsManager.tsx    # Schema editor & stage rules
│   │   ├── opportunities/
│   │   │   └── OpportunityModal.tsx       # Dynamic lead capture form
│   │   ├── audit/
│   │   │   └── AuditLogViewer.tsx         # Cryptographic chain inspector
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                 # Top bar with role dropdown
│   │   │   ├── Sidebar.tsx                # Nav links & integration indicators
│   │   │   └── AppLayout.tsx              # Responsive wrapper with mobile drawer
│   │   └── ui/
│   │       └── LoadingSpinner.tsx         # Spinners & skeleton pulses
│   ├── context/
│   │   ├── AuthContext.tsx                # Auth state, DRF token, & demo profiles
│   │   └── ToastContext.tsx               # Floating toast notifications
│   ├── lib/
│   │   └── api.ts                         # Axios client with Token interceptor
│   └── types/
│       └── index.ts                       # TypeScript interfaces matching backend models
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔌 API Integration

The frontend connects to the Django backend at `http://localhost:8000/api` (configurable via `NEXT_PUBLIC_API_URL`):
- `POST /api/auth/login/` -> DRF token
- `POST /api/auth/register/` -> Creates Workspace + Owner
- `GET /api/me/` -> Fetches user role & granular flags
- `GET /api/opportunities/` -> Fetches deals
- `POST /api/opportunities/{id}/acknowledge/` -> Acknowledges lead and stops timer
- `GET /api/custom-fields/` -> Retrieves active field schema
- `GET /api/audit-logs/` -> Retrieves immutable records
