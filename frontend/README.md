# Pharmacy Management System - Frontend

This is the React frontend for the Pharmacy Management System, built with Vite and Material UI.

## Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:5173`.

## Features

-   **Authentication**: Login with JWT support.
-   **Dashboard**: Overview of sales and alerts.
-   **POS (Point of Sale)**: Interface for cashiers to process sales.
-   **Inventory**: View stock levels and batch information.

## Configuration

API URL is configured in `src/api/axios.js`. Default is `http://localhost:8000/api`.
