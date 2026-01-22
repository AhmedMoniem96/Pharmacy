# Pharmacy Management System - Frontend

This is the React frontend for the Pharmacy Management System, built with Vite, TypeScript, Tailwind CSS, and shadcn/ui components.

## Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## Features

- **Authentication**: Login with JWT support.
- **Dashboard**: Overview of sales and alerts.
- **POS (Point of Sale)**: Interface for cashiers to process sales.
- **Inventory**: View stock levels and batch information.
- **Purchasing**: Tabs for suppliers, purchase orders, goods receipts, and supplier invoices.

## Configuration

- API URL is configured via `VITE_API_BASE_URL` in your environment (see `src/api/axios.ts` for defaults).
- UI components live under `src/components/ui` and use Tailwind/shadcn patterns.

## Assumptions

- Legacy Material UI/Emotion/stylis usage was removed in favor of the shadcn + Tailwind stack.
- Directionality is controlled by `document.documentElement.dir` based on the active i18n language.
