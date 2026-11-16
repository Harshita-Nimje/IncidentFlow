
## IncidentFlow

IncidentFlow is a full-stack incident management platform designed to help organizations monitor services, manage incidents, coordinate teams, and respond to operational issues efficiently.

The platform provides a centralized workspace for incident tracking, organization management, team collaboration, access control, real-time notifications, and analytics.

It supports multiple organizations with role-based permissions, allowing platform administrators to oversee the platform while organization administrators manage their own teams and operational workflows.

## Features

### 1. Incident Management
- Create, view, update, and manage incidents.
- Classify incidents by severity:
  - SEV-1 — Critical
  - SEV-2 — High
  - SEV-3 — Medium
  - SEV-4 — Low
- Track incidents through a structured lifecycle:
  - Investigating
  - Identified
  - Mitigating
  - Monitoring
  - Resolved
- Assign incidents to team members.
- Add comments and collaborate on incident resolution.
- Search and filter incidents by title, severity, and status.
- View detailed incident information and updates.
- Associate incidents with relevant services and organizations.

### 2. Organization Management
- Support multiple organizations.
- Create and manage organization workspaces.
- Maintain organization-specific members and services.
- Switch between active organizations.
- Keep organization data and access scoped appropriately.
- Provide platform administrators with organization-wide oversight.

### 3. Members & Access Management
- Invite users to join organizations.
- Allow users to request access to an organization.
- Approve or reject organization join requests.
- Manage organization members and their roles.
- View invitation tokens and their status.
- Support invitation expiration, usage limits, and revocation.
- Manage organization access from a centralized interface.

### 4. Role-Based Access Control

IncidentFlow supports platform-level and organization-level permissions.

| Role | Permissions |
|---|---|
| Platform Admin | Platform oversight, organization management, and administrative visibility. |
| Organization Admin | Manage organization members, invitations, access requests, and operational resources. |
| Member | View and participate in incidents and collaborate through comments. |

Authorization is enforced through backend authentication and middleware.

### 5. Service Management
- Create and manage organization services.
- View services associated with the active organization.
- Associate incidents with services.
- Provide broader service visibility to platform administrators.
- Maintain organization-aware service management.

### 6. Incident Collaboration
- Assign incidents to responsible team members.
- Add comments to incident discussions.
- Coordinate incident response.
- Keep collaboration connected to incident and organization context.

### 7. Real-Time Notifications
- Real-time communication using Socket.IO.
- Notifications for relevant incident activities.
- Organization-related notifications for administrative events.
- Read and unread notification tracking.
- Clear read notifications.
- Organization-aware notification visibility.

### 8. Analytics & Reporting
- Incident statistics and operational summaries.
- Incidents grouped by severity.
- Incident trends over time.
- Incidents grouped by service.
- Organization-level analytics.
- Platform-level statistics.
- Organization comparison and overview.

### 9. Dashboard & User Experience
- Dedicated platform administrator dashboard.
- Organization-aware user dashboard.
- Responsive interface for desktop and mobile.
- Centralized navigation and organization context.
- Dedicated pages for incidents, services, analytics, and access management.

---

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, JavaScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Real-Time Communication | Socket.IO |
| Authentication | JSON Web Tokens (JWT) |
| Data Visualization | Nivo |
| Deployment | Vercel, Render, Neon |

---

### Architecture Components

- **Frontend:** Provides the user interface and communicates with backend APIs.
- **Backend:** Handles business logic, authentication, authorization, and API requests.
- **Database:** Stores users, organizations, incidents, services, invitations, and related records.
- **Socket.IO:** Enables real-time communication and application notifications.
---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- PostgreSQL database or Neon PostgreSQL account

### 1. Clone the Repository

```bash
git clone https://github.com/Harshita-Nimje/IncidentFlow.git

cd IncidentFlow
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the application:

```text
http://localhost:3000
```

**Note:** The commands above assume the respective `package.json` files contain the `dev` scripts. Use the actual scripts configured in your project.

---

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| PORT | Backend server port |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | JWT signing secret |
| FRONTEND_URL | Frontend application URL |

### Frontend

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Backend API base URL |

Never commit `.env` or `.env.local` files containing actual credentials.

---

## Deployment

IncidentFlow uses the following deployment services:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |

### Deployment Configuration

**Vercel**
- Configure the frontend project.
- Set the root directory to `frontend`.
- Configure `NEXT_PUBLIC_API_URL` with the deployed backend URL.

**Render**
- Configure the backend service.
- Set the root directory to `backend`.
- Configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and other required environment variables.

**Neon**
- Provides the hosted PostgreSQL database.
- Keep the existing database and connection configuration when updating application deployments.

---

## Security

- JWT-based authentication.
- Protected API routes.
- Role-based authorization.
- Organization-scoped access control.
- Backend middleware for permission enforcement.
- Environment-based configuration for sensitive credentials.

For production, use HTTPS, strong secrets, secure database credentials, and appropriately configured allowed origins.

---

## Future Enhancements

Potential improvements include:

- Advanced incident timelines and audit logs.
- Expanded reporting and export functionality.
- Monitoring and alerting integrations.
- Configurable escalation workflows.
- Additional service health metrics.
- Enhanced incident automation.

---

## Author

**Harshita Nimje**

GitHub: [@Harshita-Nimje](https://github.com/Harshita-Nimje)

Project Repository: [IncidentFlow](https://github.com/Harshita-Nimje/IncidentFlow)

