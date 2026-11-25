# creat8rlabs CRM & ERPNext Frontend Simulator

Interactive static preview of the **creat8rlabs** CRM + ERPNext platform (`Vue 3` + `frappe-ui` + `Vite`) backed by an in-browser `localStorage` simulator — no Docker, MariaDB, or Python backend required.

## Explore Included Patterns
- **CRM Pipeline:** Leads (List & Kanban), Deals pipeline, Contacts, Organizations, Notes, Tasks, Call Logs, and Dashboard KPIs/charts.
- **Lead-to-Cash & ERPNext Bridge:** Convert Leads to Deals, generate simulated ERPNext Quotations, Sales Orders, Sales Invoices, Payments, and view live `Bin` warehouse stock.
- **Architecture Patterns Modal:** Open **Architecture Patterns** from the top simulator bar to inspect multi-tenancy, ERPNext adapter deduplication, consent/opt-out checks, and Odoo cutover patterns.
- **Reset Demo Data:** Click **Reset Demo** anytime to restore the initial dataset.

## Deploy on Vercel
1. Import `https://github.com/saikrishna406/Frappe_simulator.git` in **Vercel**.
2. Keep the default root directory (`.`) — `vercel.json` handles install, Vite build, and SPA routing automatically.
3. Click **Deploy** and share the generated URL.

## Run Locally
```bash
yarn install --ignore-engines
yarn dev
```

## Build & Unit Tests
```bash
yarn test:run
yarn build
```
