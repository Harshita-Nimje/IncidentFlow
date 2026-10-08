# IncidentFlow

IncidentFlow is a full-stack incident management platform designed to help engineering teams manage production incidents from detection to resolution. Built with Next.js, Node.js, Express, PostgreSQL, and Socket.IO, the application provides a structured workflow for incident tracking, team collaboration, real-time updates, and analytics.



## Key Features

- **Authentication & Authorization** — JWT-based authentication with protected routes and role-based access control.
- **Role-Based Access Control** — Admin, Lead, and Member roles with different permissions.
- **Incident Management** — Create, view, update, and manage production incidents.
- **Severity Management** — Support for SEV-1, SEV-2, SEV-3, and SEV-4 incidents.
- **Incident Lifecycle** — Track incidents through INVESTIGATING, IDENTIFIED, MITIGATING, MONITORING, and RESOLVED states.
- **User Assignments** — Assign users as Leads, Responders, or Observers.
- **Real-Time Collaboration** — Live incident updates using Socket.IO.
- **Comments** — Add and delete incident comments with permission-based access.
- **Incident Timeline** — Maintain a chronological record of incident activity.
- **Notifications** — Real-time notifications for assignments, status changes, comments, and unassignments.
- **Analytics Dashboard** — View incident statistics, severity distribution, service distribution, and incident trends.
- **Search & Filtering** — Search, filter, sort, and paginate incident records.
- **Organization & Service Management** — Admin functionality for managing organizations and services.
- **Protected APIs** — Authentication middleware protects private backend routes.
- **Security** — Helmet security headers, authentication rate limiting, centralized error handling, and protected APIs.
- **Database Indexing** — PostgreSQL indexes added for frequently queried incident, comment, timeline, assignment, notification, and analytics data.
- **Performance Testing** — API performance tested using Artillery under multiple request loads.

## Preview

<table>
  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/ae4fa2e7-c983-4436-ba55-d5b8ba3bae36" width="400" alt="IncidentFlow Dashboard" />
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/47d2c0ce-d609-49b5-809e-e17fd6fb842b" width="400" alt="IncidentFlow Incident Details" />
    </td>
  </tr>

  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/3178c013-3519-4115-a02c-1270c5d5f223" width="400" alt="IncidentFlow Incident Management" />
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/d9aba28b-3d1b-4cbb-a4a3-db9ab09d64ec" width="400" alt="IncidentFlow Analytics" />
    </td>
  </tr>

  <tr>
    <td colspan="2" align="center">
      <img src="https://github.com/user-attachments/assets/0c6c7d52-601b-4e98-8e93-5285c2a34984" width="400" alt="IncidentFlow Notifications" />
    </td>
  </tr>
</table>



## Tech Stack

### Frontend

- Next.js
- React
- JavaScript
- Tailwind CSS

### Backend

- Node.js
- Express.js
- Socket.IO
- JSON Web Tokens (JWT)

### Database

- PostgreSQL

### Development & Testing

- Git
- GitHub
- Postman
- Artillery

### Installation
- Clone the repository.
  ```bash
  git clone https://github.com/Harshita-Nimje/IncidentFlow.git
  cd IncidentFlow
- Install Backend Dependencies.

  ```bash
  cd backend
  npm install
- Configure Backend Environment Variables.
 - Create a .env file inside the backend directory.

   ```bash
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   FRONTEND_URL=http://localhost:3000
- Run the Backend.
   ```bash
   npm start
- Install Frontend Dependencies.
Open another terminal and run:
  ```bash
  cd frontend
  npm install
- Configure Frontend Environment Variables.
- Create a .env.local file inside the frontend directory.
  ```bash
  NEXT_PUBLIC_API_URL=http://localhost:5000
- Run the Frontend.
  ```bash
  npm run dev

 ###  Technologies Used
- Next.js – React framework for building the frontend application.
- React – Frontend library for building reusable UI components.
- JavaScript – Programming language used across the frontend and backend.
- Tailwind CSS – Utility-first CSS framework for responsive and modern UI design.
- Node.js – JavaScript runtime used for the backend.
- Express.js – Backend framework for building REST APIs.
- PostgreSQL – Relational database for storing incidents, users, comments, assignments, notifications, and analytics data.
- Socket.IO – Real-time communication for live incident updates and collaboration.
- JWT – Authentication and authorization using JSON Web Tokens.
- Helmet – Security middleware for HTTP security headers.
- Express Rate Limit – Protects authentication endpoints from excessive requests.
- Artillery – Used for API load and performance testing.
- Git & GitHub – Version control and source code management.
