# AI DevOps Copilot

AI DevOps Copilot is a full-stack application that leverages the power of Google's Generative AI (Gemini API) to act as an intelligent DevOps assistant. It allows users to chat with the AI to generate infrastructure-as-code (Terraform files), manage different deployment environments, and organize cloud accounts. 

## Features

- **Conversational Infrastructure Generation:** Chat with an AI assistant to describe the infrastructure you need, and it will generate the necessary Terraform configurations (`provider.tf`, `main.tf`, `variables.tf`, `outputs.tf`).
- **Environment Management:** Track and maintain multiple environments. Chat histories and their generated Terraform resources are linked directly to specific environments.
- **Account Settings:** Manage cloud credentials and settings effectively from the application interface.
- **Modern UI:** Built with React, Tailwind CSS, and Lucide React icons for a dynamic and intuitive user experience.

## Tech Stack

**Frontend:**
- React (v19)
- Vite
- Tailwind CSS (v4)
- React Router DOM
- Axios
- Lucide React

**Backend:**
- Node.js & Express
- MySQL (via `mysql2`)
- Google Generative AI API (`@google/generative-ai`)
- dotenv & cors

## Prerequisites

Before running the project locally, ensure you have the following installed:
1. [Node.js](https://nodejs.org/en/) (v18+ recommended)
2. [MySQL](https://www.mysql.com/) database server
3. An active [Google Gemini API Key](https://aistudio.google.com/app/apikey)

## Local Setup & Installation

### 1. Database Setup

1. Open your MySQL client or terminal and run the schema script located at `backend/db/schema.sql` to initialize the database natively:

```sql
SOURCE /path/to/devops-assistant/backend/db/schema.sql;
```

*(Alternatively, ensure you manually create a database named `ai_devops` and run the queries within the `schema.sql` file.)*

### 2. Backend Setup

1. Open a new terminal instance and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example or simply create one at `backend/.env` with the following variables:
   ```env
   PORT=5001
   GEMINI_API_KEY="your-google-gemini-api-key"
   DB_HOST="localhost"
   DB_USER="root"
   DB_PASSWORD="your-mysql-password"
   DB_NAME="ai_devops"
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *(Or optionally use `npx nodemon server.js` for development if you have it installed)*

The backend server should now be running on `http://localhost:5001`.

### 3. Frontend Setup

1. Open a separate terminal instance and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Project Structure

- `backend/`: Express server, database connectivity, and Gemini API integration routes.
  - `backend/db/`: Contains the MySQL database schema and connection files.
  - `backend/routes/`: Express routers for handling chats, accounts, and environments.
- `frontend/`: Real-time interactive UI built seamlessly with React.
  - `frontend/src/pages/`: Main application screens (Chat, Environments, Settings).
- `envs/`: Directory used securely by the application for managing workspace requirements or Terraform outputs.


>>>>>>> b5a3565 (added readme file)
