# DPDP Grievance Redressal System

This repository contains a full-stack application designed to manage and resolve Data Digital Personal Data Protection (DPDP) grievances. It features a robust ticket management workflow, an admin dashboard, a user portal, and AI-powered tools for compliance scanning and form generation.

## Project Structure & File Usage

### Root Directory
- **`package.json` & `package-lock.json`**: Defines frontend dependencies and scripts for running, building, and linting the React application.
- **`vite.config.js`**: Configuration file for Vite, the frontend build tool.
- **`eslint.config.js`**: ESLint configuration to maintain code quality and styling consistency.
- **`index.html`**: The main HTML entry point for the Vite React app.
- **`README.md`**: Central documentation file for the project.
- **`*.docx` & `*.doc`**: System documentation, workflow diagrams, and specifications (e.g., `ticket_system_workflow.docx`, `ack_flow.docx`, `scanner.docx`).

### Frontend (`/src`)
The `src` directory contains all the React client-side code.
- **`assets/`**: Contains static assets such as images and icons used throughout the app.
- **`components/`**: Reusable UI components.
  - `Layout/`: Structural components like `Navbar.jsx` and `Sidebar.jsx`.
  - `ui/`: Core UI components like `Badge.jsx`.
  - `AdminRoute.jsx`: Higher-Order Component for protecting admin-only routes.
- **`contexts/`**: React Context providers for global state.
  - `AuthContext.jsx`: Manages user authentication state.
  - `ThemeContext.jsx`: Manages the application's visual theme (light/dark mode).
- **`pages/`**: Top-level page components mapped to application routes.
  - `Dashboard.jsx`, `Login.jsx`, `SubmitGrievance.jsx`, `TicketDetail.jsx`: Core pages for users.
  - `admin/`: Pages dedicated to administrators (`AdminDashboard.jsx`, `AdminTicketDetail.jsx`).
  - `ai/`: Pages housing AI features (`ComplianceScanner.jsx`, `FormGenerator.jsx`, `TicketTester.jsx`).
- **`utils/`**: Helper files and utility functions.
  - `auditLogger.js`: Functions for handling audit trails.
  - `firestoreHelpers.js`: Legacy/current helpers for Firebase interactions.
- **`api/`**: Axios instances and API call functions to interface with the backend.
- **`App.jsx`**: The root component where all frontend routes and main layouts are defined.
- **`main.jsx`**: The bootstrapping file that renders the React application into `index.html`.
- **`index.css` & `App.css`**: Global stylesheets, including Tailwind CSS directives.
- **`firebase.js`**: Configuration and initialization for Firebase services.

### Backend (`/server`)
The `server` directory contains the Node.js / Express backend REST API.
- **`index.js`**: The main entry point for the Express server. It configures middleware, sets up routes, and starts the server.
- **`db.js`**: Handles the connection and initialization of the PostgreSQL database.
- **`middleware/`**: Contains Express middleware for request processing (e.g., authentication checks, error handling).
- **`package.json` & `package-lock.json`**: Backend-specific npm dependencies.
- **`.env.example`**: Template for necessary environment variables (like Database URI, JWT Secret, etc.).

## Setup & Running the Project

### Prerequisites
- Node.js (v18+)
- PostgreSQL (for backend database)

### Backend Setup
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and fill in your PostgreSQL connection string and JWT secret.
4. Start the server: `npm run dev` or `node index.js`

### Frontend Setup
1. Navigate to the root directory: `cd ..`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The application will be accessible at the address provided by Vite (usually `http://localhost:5173`).

## Feature Workflows

### 1. User Grievance Submission
- **Submission:** Users can submit DPDP-related grievances through the user portal. They provide necessary details, such as the nature of the data breach or the specific right they are exercising (e.g., Right to Erasure, Right to Information).
- **Tracking:** Upon submission, a unique ticket is created and tracked within the system. Users can view their active tickets on their dashboard.

### 2. Ticket Resolution & Acknowledgment Workflow
- **Assignment:** Admins review incoming tickets on the Admin Dashboard and assign them to specific staff members for investigation.
- **Resolution:** The assigned staff member investigates and provides a resolution, updating the ticket status.
- **Awaiting User Confirmation:** Once staff marks the ticket as resolved, the ticket enters an 'Awaiting User Confirmation' state.
- **Closure:** The user is prompted to review the resolution. If accepted, the ticket is formally 'Closed'. If rejected, the ticket may be reopened for further investigation.
- **Audit Logging:** Every state change, assignment, and resolution is permanently logged to ensure compliance and accountability.

### 3. AI Compliance Scanner
- **Functionality:** This tool allows administrators or legal teams to scan a provided URL or website content.
- **Analysis:** The AI analyzes the content specifically against the rules and requirements of the DPDP Act (e.g., checking for proper consent mechanisms, privacy policy clarity, and data usage declarations).
- **Reporting:** It generates a comprehensive compliance report, highlighting potential violations and suggesting remediations.

### 4. AI Form Generator
- **Purpose:** Helps organizations easily create DPDP-compliant data collection and consent forms.
- **Usage:** Users input their specific data collection requirements, and the AI generates a customized, legally sound form structure with appropriate consent checkboxes and disclaimers.

---
*Note: Any deployment-specific configuration files (like Vercel or Render) have been intentionally removed from this repository as it is configured to run agnostically or locally at this time.*
