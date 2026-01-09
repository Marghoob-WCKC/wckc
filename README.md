# WCKC Tracker (Woodcraft Kitchen Cabinets)

A modern, full-stack internal ERP application designed for Woodcraft Kitchen Cabinets to streamline operations. This application centralizes the workflow from initial client intake and sales quotes to production scheduling, purchasing, installation, site management, and service/warranty orders.

## 🚀 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication:** [Clerk](https://clerk.com/)
- **Integration:** [Microsoft Graph API](https://developer.microsoft.com/en-us/graph) (Outlook) via `@azure/msal-react`
- **UI Library:** [Mantine v7](https://mantine.dev/)
- **Styling:** Tailwind CSS v4 & Mantine Styles
- **State Management:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Data Visualization:** [Recharts](https://recharts.org/) & Mantine Charts
- **Form Validation:** [Zod](https://zod.dev/) & Mantine Form
- **Document Generation:** [@react-pdf/renderer](https://react-pdf.org/) (PDF) & [SheetJS](https://sheetjs.com/) (Excel)

## ✨ Core Modules & Features

### 1. 📈 Executive & Role-Based Dashboards
- **Role-Specific Views:** Dynamic dashboards tailored for Managers, Designers, Production Schedulers, Installers, and Service Coordinators.
- **Data Visualization:** Interactive charts tracking Sales Volume, Sales Spikes (Fiscal Year), and Top Designers.
- **Operational Metrics:** Real-time counters for Active Quotes, Sold Jobs, Open Service Orders, and Upcoming Shipments.
  
### 2. 📧 Microsoft Outlook Integration
- **Inbox Management:** Full read access to Outlook inboxes directly within the application.
- **Job Association:** Seamlessly link emails to specific Jobs for centralized communication history.
- **Authentication:** Secure OAuth2 sign-in via Microsoft Azure MSAL.

### 3. 📊 Sales & Estimates
- **Detailed Specifications:** Tracking of cabinet specs (Species, Door Style, Finish, Box construction) and financials (Total, Deposit, Balance).
- **Client CRM:** Centralized client management including project history and contact details.

### 4. 🏭 Production Management
- **Scheduler:** Visual interface to set dates for key production stages (Cut, Paint, Assembly, Shipping).
- **Plant View:** specialized views for shop floor management.
- **Bulk Scheduling:** Tools to manage production schedules for multiple jobs simultaneously.
- **Live Actuals:** Real-time status updates for production milestones.

### 5. 🏗️ Field Operations (Installation & Site)
- **Installation Management:** Assign installers, schedule dates, and track completion status.
- **Site Visits:** Dedicated module for tracking pre-install and ongoing site visits with PDF report generation.
- **Inspections:** Digital sign-off workflows for final inspections.

### 6. 📦 Purchasing & Inventory
- **Material Tracking:** Status tracking (Ordered/Received) for Doors, Glass, Handles, Accessories, and Laminate.
- **Warehouse Tracking:** Monitor inventory location and movement within the warehouse.
- **Backorder Management:** Specialized workflow for tracking, editing, and resolving backordered items.

### 7. 🛠️ Service Orders
- **Warranty/Deficiency Tracking:** Generate service tickets linked to original jobs.
- **PDF Generation:** Auto-generate professional PDF service orders for technicians.
- **Parts List:** Detailed tracking of required parts for every service call.

### 8. 📑 Advanced Reporting
- **PDF & Excel Export:** Generate and export high-fidelity reports.

## 🔐 Security & Access Control
- **RBAC (Role-Based Access Control):** Permission hooks strictly controlling access to specific modules
- **Middleware Protection:** Navigation guards ensuring users cannot access unauthorized routes and Prevent unsaved changes.
