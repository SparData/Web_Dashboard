📊 Web-Based Dashboard

A full-stack web-based dashboard designed to provide interactive data visualization, KPI monitoring, and role-based access to business data.
The project connects a web frontend with a PostgreSQL database and provides authenticated users with access to dashboard information based on their assigned roles.

🚀 Features

*  Interactive web-based dashboard
*  JWT-based authentication
*  Role-based access control
*  PostgreSQL database integration
*  KPI and business performance metrics
*  Data filtering and analysis
*  Responsive dashboard interface
*  Backend API integration
*  Protected routes and authenticated API requests


🏗️ Project Architecture
User
  │
  ▼
Frontend
  │
  │ HTTP / API Requests
  ▼
Backend
  │
  ├── Authentication
  ├── JWT Authorization
  ├── Business Logic
  └── API Endpoints
  │
  ▼
PostgreSQL Database
  │
  └── Dashboard / Business Data



🛠️ Technology Stack
Frontend
* HTML / CSS / JavaScript
* React.js
* Responsive UI components
* API integration

Backend
* Node.js
* Express.js
* REST APIs
* JWT Authentication

Database
* PostgreSQL

Development Tools
* Git
* GitHub
* VS Code
* Postman


🔐 Authentication & Authorization
The application uses **JWT (JSON Web Token)** authentication.
The authentication system is designed to:

1. Authenticate users during login.
2. Generate a secure JWT token.
3. Use the token for protected API requests.
4. Verify the token on the backend.
5. Restrict access to dashboard functionality based on user roles.

Example:
Login
  ↓
Validate Credentials
  ↓
Generate JWT
  ↓
Authenticated User
  ↓
Access Protected Dashboard



⚙️ Installation & Setup
1. Clone the Repository
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git

Navigate to the project directory:
cd Web_Dashboard

2. Install Dependencies
For the frontend:
cd frontend
npm install

For the backend:
cd ../backend
npm install

3. Configure Environment Variables
Create a `.env` file inside the backend directory.
Example:
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password

Note: **Important:** Never commit `.env` files or database credentials to GitHub.
Make sure `.env` is included in `.gitignore`:

gitignore
.env
.env.*
node_modules/

4. Setup PostgreSQL
Create a PostgreSQL database and configure the database credentials in the backend `.env` file.
Example:
CREATE DATABASE AnalyticsDB;

Run the required database schema/scripts before starting the application.

5. Start the Backend

cd Web_Dashboard
npm run dev --prefix server

The backend will run on the configured port, for example:
http://localhost:5000


6. Start the Frontend
Open another terminal:

cd Web_Dashboard
npm run dev

The frontend will then be available through the local development server.


🔌 API Structure
The backend exposes REST API endpoints for communication between the frontend and database.
Example structure:
/api/auth
/api/users
/api/dashboard
/api/products
/api/advertisements

Protected endpoints require a valid JWT token.



🔒 Security
The project follows basic security practices including:
* JWT-based authentication
* Protected API routes
* Role-based authorization
* Environment variables for sensitive configuration
* `.gitignore` for secret files
* Password hashing
* Server-side validation

> Never upload database passwords, JWT secrets, API keys, or other credentials to the repository.



👩‍💻 Author
Tanya Singh
Data Analyst (Spar Krognos)

Data Analyst | SQL | Python | PostgreSQL | Power BI | Web-Based Dashboard Development

