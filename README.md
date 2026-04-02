# Finance Dashboard Backend

A RESTful backend API for a finance dashboard system with user management, role-based access control, financial records CRUD, and analytics/summary endpoints.

## Tech Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Runtime        | Node.js (v18+)                |
| Framework      | Express.js                    |
| Database       | MongoDB (via Mongoose ODM)    |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| Validation     | express-validator             |
| Middleware     | cors, express.json()          |
| Dev Tooling    | nodemon, dotenv               |

> **Note on TypeScript:** This project uses JavaScript (ES6+) for rapid development. TypeScript can be adopted for stricter type checking, better IDE support, and improved maintainability using `ts-node`, `@types/*` packages, and a `tsconfig.json` configuration.

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally or a cloud instance (e.g., MongoDB Atlas)
- **npm** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd z_assessment

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### Environment Variables

| Variable         | Default                                       | Description                                        |
| ---------------- | --------------------------------------------- | -------------------------------------------------- |
| `PORT`           | `5000`                                        | Server port                                        |
| `MONGODB_URI`    | `mongodb://localhost:27017/finance_dashboard` | MongoDB connection string                          |
| `JWT_SECRET`     | —                                             | Secret key for JWT signing (change in production!) |
| `JWT_EXPIRES_IN` | `7d`                                          | JWT token expiration duration                      |

### Running the Application

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## Project Structure

```
z_assessment/
├── src/
│   ├── config/
│   │   └── db.js                     # MongoDB connection
│   ├── models/
│   │   ├── User.js                   # User schema with password hashing
│   │   └── FinancialRecord.js        # Financial record schema with soft delete
│   ├── controllers/
│   │   ├── auth.controller.js        # Register, Login, Profile
│   │   ├── user.controller.js        # User management (Admin)
│   │   ├── record.controller.js      # Financial records CRUD
│   │   └── dashboard.controller.js   # Summary & analytics
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── record.routes.js
│   │   └── dashboard.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT verification
│   │   ├── role.middleware.js         # Role-based access guard
│   │   └── validate.middleware.js     # Input validation handler
│   ├── utils/
│   │   ├── ApiError.js               # Custom error class
│   │   └── ApiResponse.js            # Standardized response helper
│   ├── scripts/
│   │   └── seed.js                   # Database seeder
│   └── app.js                        # Express app setup
├── server.js                         # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## API Endpoints

### Authentication

| Method | Endpoint             | Access        | Description              |
| ------ | -------------------- | ------------- | ------------------------ |
| POST   | `/api/auth/register` | Public        | Register a new user      |
| POST   | `/api/auth/login`    | Public        | Login and get JWT token  |
| GET    | `/api/auth/me`       | Authenticated | Get current user profile |

### User Management

| Method | Endpoint         | Access | Description                   |
| ------ | ---------------- | ------ | ----------------------------- |
| GET    | `/api/users`     | Admin  | List all users (paginated)    |
| GET    | `/api/users/:id` | Admin  | Get user by ID                |
| PATCH  | `/api/users/:id` | Admin  | Update user role/status/name  |
| DELETE | `/api/users/:id` | Admin  | Deactivate user (soft delete) |

**Query Parameters for `GET /api/users`:**

- `page` (default: 1), `limit` (default: 10)
- `role` — filter by role (viewer, analyst, admin)
- `isActive` — filter by active status (true/false)

### Financial Records

| Method | Endpoint           | Access         | Description                        |
| ------ | ------------------ | -------------- | ---------------------------------- |
| POST   | `/api/records`     | Admin          | Create a financial record          |
| GET    | `/api/records`     | Analyst, Admin | List records (filtered, paginated) |
| GET    | `/api/records/:id` | Analyst, Admin | Get record by ID                   |
| PATCH  | `/api/records/:id` | Admin          | Update a record                    |
| DELETE | `/api/records/:id` | Admin          | Soft-delete a record               |

**Query Parameters for `GET /api/records`:**

- `page` (default: 1), `limit` (default: 10)
- `type` — filter by income or expense
- `category` — filter by category name
- `startDate`, `endDate` — date range filter (ISO 8601)
- `search` — text search in description
- `sortBy` (default: date), `sortOrder` (default: desc)

### Dashboard & Analytics

| Method | Endpoint                          | Access         | Description                         |
| ------ | --------------------------------- | -------------- | ----------------------------------- |
| GET    | `/api/dashboard/summary`          | Analyst, Admin | Total income, expenses, net balance |
| GET    | `/api/dashboard/category-summary` | Analyst, Admin | Category-wise totals                |
| GET    | `/api/dashboard/trends`           | Analyst, Admin | Monthly income/expense trends       |
| GET    | `/api/dashboard/recent`           | Analyst, Admin | Recent transactions (last 10)       |

**Query Parameters:**

- `/summary` and `/category-summary`: `startDate`, `endDate`, `type`
- `/trends`: `months` (default: 12, max: 24)
- `/recent`: `limit` (default: 10, max: 50)

### Health Check

| Method | Endpoint      | Description       |
| ------ | ------------- | ----------------- |
| GET    | `/api/health` | API health status |

---

## Role Permissions Matrix

| Action                           | Viewer | Analyst | Admin |
| -------------------------------- | ------ | ------- | ----- |
| Register / Login                 | ✅     | ✅      | ✅    |
| View own profile                 | ✅     | ✅      | ✅    |
| View financial records           | ❌     | ✅      | ✅    |
| Create / Update / Delete records | ❌     | ❌      | ✅    |
| View dashboard & analytics       | ❌     | ✅      | ✅    |
| Manage users                     | ❌     | ❌      | ✅    |

---

## Data Models

### User

| Field     | Type    | Details                                        |
| --------- | ------- | ---------------------------------------------- |
| name      | String  | Required, max 100 chars                        |
| email     | String  | Required, unique, lowercase                    |
| password  | String  | Required, min 6 chars, hashed with bcrypt      |
| role      | String  | Enum: viewer, analyst, admin (default: viewer) |
| isActive  | Boolean | Default: true                                  |
| createdAt | Date    | Auto-generated                                 |
| updatedAt | Date    | Auto-generated                                 |

### Financial Record

| Field       | Type     | Details                      |
| ----------- | -------- | ---------------------------- |
| amount      | Number   | Required, positive           |
| type        | String   | Enum: income, expense        |
| category    | String   | Required, max 50 chars       |
| date        | Date     | Default: current date        |
| description | String   | Optional, max 500 chars      |
| createdBy   | ObjectId | Ref to User                  |
| isDeleted   | Boolean  | Default: false (soft delete) |
| createdAt   | Date     | Auto-generated               |
| updatedAt   | Date     | Auto-generated               |

---

## Features Implemented

### Core

- ✅ **JWT Authentication** — Secure token-based auth with configurable expiration
- ✅ **Role-Based Access Control (RBAC)** — Three-tier role system (viewer, analyst, admin) enforced via middleware
- ✅ **Financial Records CRUD** — Full create, read, update, delete operations
- ✅ **Dashboard Analytics** — Aggregation-based summary, category breakdown, monthly trends, recent activity

### Data Management

- ✅ **Soft Delete** — Records and users are deactivated rather than permanently deleted
- ✅ **Pagination** — All list endpoints support page/limit with metadata
- ✅ **Filtering** — Records filterable by type, category, date range, and text search
- ✅ **Sorting** — Configurable sort field and order

### Reliability

- ✅ **Input Validation** — express-validator on all mutating endpoints
- ✅ **Structured Error Handling** — Consistent error responses with appropriate HTTP status codes
- ✅ **Self-Protection Guards** — Admin cannot deactivate or demote themselves
- ✅ **Password Security** — bcrypt hashing, passwords excluded from queries by default

---

## Design Decisions & Tradeoffs

1. **Soft Delete over Hard Delete**: Financial records use `isDeleted` flag instead of actual deletion. This preserves audit trail and allows recovery, which is critical for financial data.

2. **MongoDB Aggregation Pipelines**: Dashboard endpoints use native MongoDB aggregation rather than fetching all records and computing in-app. This is significantly more performant for large datasets.

3. **Password Exclusion by Default**: The User model uses `select: false` on the password field, so it's never accidentally leaked in API responses.

4. **Role-Level Middleware**: Access control is enforced at the route level using composable middleware (`authenticate` → `authorize`), making it declarative and easy to audit.

5. **Standardized Response Format**: All API responses follow a consistent shape (`{ success, statusCode, message, data }`), making frontend integration predictable.

6. **Compound Indexes**: Strategic database indexes on common query patterns (createdBy + isDeleted + date) ensure efficient query performance.

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email"
    }
  ]
}
```

**HTTP Status Codes Used:**

- `200` — Success
- `201` — Created
- `400` — Bad Request / Validation Error
- `401` — Unauthorized (invalid/missing token)
- `403` — Forbidden (insufficient role)
- `404` — Not Found
- `409` — Conflict (duplicate resource)
- `500` — Internal Server Error

---

## Future Improvements

- **TypeScript Migration** — Adopt TypeScript for stricter type safety and better developer experience
- **Unit & Integration Tests** — Add Jest/Mocha test suites for controllers and middleware
- **Rate Limiting** — Implement express-rate-limit to prevent abuse
- **API Documentation** — Generate Swagger/OpenAPI spec for interactive docs
- **Search Indexing** — Add MongoDB text indexes for full-text search capability
- **Refresh Tokens** — Implement token refresh flow for better security
- **Audit Logging** — Track who modified what and when
- **Data Export** — CSV/PDF export for financial reports

---

## Assumptions

1. A single admin can be created through either the seed script or by manually updating a user's role in the database after registration.
2. All monetary amounts are stored as numbers without currency denomination.
3. The system is designed for a single-tenant use case (all admin users manage the same data).
4. Soft-deleted records are excluded from all queries and analytics by default.
5. Registration creates users with the `viewer` role by default for security.

---

## License

ISC
