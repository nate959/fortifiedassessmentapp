# Fortified Assessment App - Project Alignment & Architecture

This document serves as the source of truth for the project's vision, goals, and architectural standards. It is intended to ensure all contributors (including AI agents) maintain alignment with the core objectives and prevent scope creep.

## 1. Project Vision & Goals

**Primary Goal:**
To provide a Fortified Assessment Questionnaire Sheet accessible via a shared link seamlessly integrated into the `goforko.com` WordPress site using a Reverse Proxy to preserve SEO. Users will have their own secure portal (login/password) where they can fill out the questionnaire for their customer base to determine if a Fortified Certificate is required (and which type). 

**Secondary Goal:**
Provide a cloud-synced backend/database solution (hosted on Railway) attached to user accounts to securely store, retrieve, and manage the history of their generated reports and documents.

## 2. Core Features (MVP Non-Negotiables)

* **PDF Generation & Export:** Results must be exportable as a printable PDF. The layout must be customizable, including the ability for users to upload and inject their own logo.
* **Persistent Document Access:** Users must be able to view, reprint, or download their historical PDFs at any time.
* **Questionnaire Duplication/Editing:** Users can duplicate an existing questionnaire, make necessary adjustments, and save it as a new version, rather than starting from scratch each time.
* **Offline Capabilities:** The application must function offline, capturing data and saving it locally, with synchronization occurring once the connection is restored.

## 3. Out of Scope

* No features have been explicitly marked as out of scope at this time, but any additions must not conflict with the offline-first or PDF generation requirements.

## 4. Architectural Standards & Constraints

### 4.1 Tech Stack
* **Frontend:** React + Vite (Deployed to Vercel via Reverse Proxy from WordPress)
* **Backend:** Node.js + Express + TypeScript (Deployed to Railway)
* **Database:** PostgreSQL (Hosted on Railway)
* **Styling:** Tailwind CSS (v4)
* **Icons:** `lucide-react`
* **Local Storage / Offline Sync:** `localforage` (IndexedDB synced to backend Postgres)
* **PDF Generation:** `jspdf` + `html2canvas`

### 4.2 Standardized Directory Structure
To maintain a clean and scalable codebase, the repository is split into frontend and backend:

**Frontend (`/` and `src/`)**
```text
src/
├── assets/        # Static assets (images, icons, etc.)
├── components/    # Reusable React components (buttons, form fields, headers)
├── hooks/         # Custom React hooks
├── pages/         # Routable view components (e.g., HomePage.jsx)
├── services/      # API integrations (axios/fetch) and offline db logic
├── utils/         # Helper functions and utilities
├── App.jsx        # Main application layout and routing
└── main.jsx       # Application entry point
```

**Backend (`backend/`)**
```text
backend/
├── src/
│   ├── controllers/   # Request handlers (e.g., auth, assessments)
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic and database operations
│   ├── config/        # Environment and DB configuration
│   └── index.ts       # Server entry point
├── package.json
└── tsconfig.json
```

### 4.3 Rules for Future Development
* **No ad-hoc files in `src/`**: All new files must be placed within one of the designated subdirectories.
* **Offline-First Mindset**: Any new data manipulation logic must first verify and write to the local `localforage` database to ensure offline reliability.
