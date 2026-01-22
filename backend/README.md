# Student Information System - Backend API

Express.js backend with Service Layer Pattern for Student Information System.

## Features

- ✅ User Login (email, password)
- ✅ Create User (name, email, role, status, password)
- ✅ Update User (name, email, role)
- ✅ Update User Status
- ✅ Service Layer Pattern
- ✅ MongoDB Integration
- ✅ Password Hashing (bcrypt)
- ✅ Input Validation
- ✅ Error Handling
- ✅ JWT Authentication

## Project Structure

```
back-end/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── userController.js    # Request handlers
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   └── User.js              # User schema
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   └── userRoutes.js        # User management routes
│   └── services/
│       └── userService.js       # Business logic layer
├── app.js                       # Express app configuration
├── server.js                    # Server entry point
└── package.json
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (create a local `.env` file).
   See `ENVIRONMENT.md` for the full list.

3. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## Authentication

This API uses **JWT (JSON Web Tokens)** for authentication, stored in **HttpOnly cookies** (cookie-based auth).
React **never** stores or reads the token in JavaScript.

### How to Use Authentication

1. **Login** to set cookies:
   ```bash
   POST /api/auth/login
   ```
   Response sets HttpOnly cookies (no token returned in JSON).

2. **Call protected endpoints normally** (browser auto-sends cookies).
   For tools like `curl`, use a cookie jar (`-c` / `-b`).

### Refresh Token (Session Renewal)

The access token cookie is short-lived (ex: 15 minutes). When it expires, you use the refresh token cookie to get a new access token.

- **Endpoint**: `POST /api/auth/refresh`
- **Body**: none
- **Important**: You must send cookies (`credentials` / `withCredentials`). The refresh token is **HttpOnly**, so you will not see it in JS.

#### Example (curl)

```bash
# 1) Login (saves cookies)
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 2) Refresh (uses refresh cookie automatically from the cookie jar)
curl -i -b cookies.txt -X POST http://localhost:3000/api/auth/refresh
```

#### Example (React fetch)

```js
await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
});
```

#### Example (axios)

```js
await axios.post(
  'http://localhost:3000/api/auth/refresh',
  {},
  { withCredentials: true }
);
```

#### When does refresh happen?

- **Normal case**: you don't call refresh manually; you just call protected endpoints.
- **When access expires**: a protected request returns **401** (expired access token).
  - Call `POST /api/auth/refresh`
  - Then **retry** the original request
- **If refresh fails (401)**: refresh cookie is missing/expired/revoked → show login screen (session ended).

### Example Usage

```bash
# Step 1: Login and save cookies to a jar
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Step 2: Check session
curl -i -b cookies.txt http://localhost:3000/api/auth/me

# Step 3: Call protected endpoint (cookies auto-attached)
curl -i -b cookies.txt -X POST http://localhost:3000/api/users/get \
  -H "Content-Type: application/json" \
  -d '{"userId":"507f1f77bcf86cd799439012"}'
```

### Protected vs Public Endpoints

- **Public Endpoints** (No token required):
  - `POST /api/auth/login` - Login
  - `POST /api/auth/refresh` - Refresh session (uses refresh cookie)
  - `GET /health` - Health check

- **Protected Endpoints** (Token required):
  - `POST /api/auth/logout` - Logout (requires valid token/cookies)
  - `POST /api/users` - Create user
  - `POST /api/users/update` - Update user
  - `POST /api/users/status` - Update user status
  - `POST /api/users/get` - Get user by ID
  - `POST /api/users/get-all` - Get all users with pagination
  - `POST /api/app-settings/get` - Get app settings
  - `POST /api/app-settings/update` - Update app settings
  - `POST /api/app-settings/reset` - Reset app settings to default

## API Endpoints

### Authentication

#### 1. Login User
- **POST** `/api/auth/login`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "password": "admin123"
    }'
  ```
- **Request Body:**
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Administrator",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  }
  ```
- **Error Responses (401):**
  ```json
  // Email does not exist
  {
    "success": false,
    "message": "Email does not exist"
  }
  
  // Wrong password
  {
    "success": false,
    "message": "Wrong password"
  }
  
  // Account not active
  {
    "success": false,
    "message": "Account is not active. Please contact administrator."
  }
  ```

### User Management

> **Note:** All user management endpoints require authentication. With cookie-based auth, the browser automatically sends cookies when `credentials` is enabled.

#### 2. Create User
- **POST** `/api/users`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/users \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{
      "name": "John Doe",
      "email": "john@example.com",
      "password": "password123",
      "role": "student",
      "status": "active"
    }'
  ```
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student",
    "status": "active"
  }
  ```
- **Success Response (201):**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 3. Update User
- **POST** `/api/users/update`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/users/update \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{
      "userId": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "instructor"
    }'
  ```
- **Request Body:**
  ```json
  {
    "userId": "507f1f77bcf86cd799439012",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "instructor"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "User updated successfully",
    "data": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "instructor",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 4. Update User Status
- **POST** `/api/users/status`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/users/status \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{
      "userId": "507f1f77bcf86cd799439012",
      "status": "inactive"
    }'
  ```
- **Request Body:**
  ```json
  {
    "userId": "507f1f77bcf86cd799439012",
    "status": "inactive"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "User status updated successfully",
    "data": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "status": "inactive",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 5. Get User by ID
- **POST** `/api/users/get`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/users/get \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{
      "userId": "507f1f77bcf86cd799439012"
    }'
  ```
- **Request Body:**
  ```json
  {
    "userId": "507f1f77bcf86cd799439012"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Error Response (404):**
  ```json
  {
    "success": false,
    "message": "User not found"
  }
  ```
- **Error Response (401) - Missing Token:**
  ```json
  {
    "success": false,
    "message": "No token provided. Authorization header is required."
  }
  ```
- **Error Response (401) - Invalid Token:**
  ```json
  {
    "success": false,
    "message": "Invalid token."
  }
  ```
- **Error Response (401) - Expired Token:**
  ```json
  {
    "success": false,
    "message": "Token has expired."
  }
  ```

#### 6. Get All Users (with Pagination)
- **POST** `/api/users/get-all`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/users/get-all \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{
      "page": 1,
      "limit": 10
    }'
  ```
- **Request Body (Optional):**
  ```json
  {
    "page": 1,
    "limit": 10
  }
  ```
  - `page`: Page number (default: 1, minimum: 1)
  - `limit`: Number of items per page (default: 10, minimum: 1, maximum: 100)
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully",
    "data": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "student",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "instructor",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 10,
    "page": 1,
    "total_count": 50
  }
  ```
  - `data`: Array of user objects (password excluded)
  - `count`: Number of users in current page
  - `page`: Current page number
  - `total_count`: Total number of users in database

### Health Check

#### 7. Health Check
- **GET** `/health`
- **Request:**
  ```bash
  curl http://localhost:3000/health
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Server is running",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

### App Settings

#### 8. Get App Settings
- **POST** `/api/app-settings/get`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/app-settings/get \
    -H "Content-Type: application/json" \
    -b cookies.txt
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Settings retrieved successfully",
    "data": {
      "_id": "507f1f77bcf86cd799439014",
      "darkMode": false,
      "fontFamily": "Poppins",
      "fontSize": "13px",
      "activeSchoolYear": "2025-2026",
      "activeTerm": "Prelim",
      "sideNavColor": "#1e293b",
      "topNavColor": "#ffffff",
      "sideNavFontColor": "#e2e8f0",
      "sideNavHoverColor": "#ffffff",
      "sideNavActiveColor": "#ffffff",
      "topNavFontColor": "#1f2937",
      "loginBackgroundType": "color",
      "loginBackgroundColor": "#d6d6d6",
      "loginBackgroundImage": "",
      "loginFormBgColor": "#ffffff",
      "loginFormBgOpacity": 89,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 9. Update App Settings
- **POST** `/api/app-settings/update`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/app-settings/update \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{
      "darkMode": true,
      "fontFamily": "Arial",
      "fontSize": "14px",
      "activeSchoolYear": "2025-2026",
      "activeTerm": "Midterm"
    }'
  ```
- **Request Body (All fields optional):**
  ```json
  {
    "darkMode": true,
    "fontFamily": "Arial",
    "fontSize": "14px",
    "activeSchoolYear": "2025-2026",
    "activeTerm": "Midterm",
    "sideNavColor": "#1e293b",
    "topNavColor": "#ffffff",
    "sideNavFontColor": "#e2e8f0",
    "sideNavHoverColor": "#ffffff",
    "sideNavActiveColor": "#ffffff",
    "topNavFontColor": "#1f2937",
    "loginBackgroundType": "color",
    "loginBackgroundColor": "#d6d6d6",
    "loginBackgroundImage": "",
    "loginFormBgColor": "#ffffff",
    "loginFormBgOpacity": 89
  }
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Settings updated successfully",
    "data": {
      "_id": "507f1f77bcf86cd799439014",
      "darkMode": true,
      "fontFamily": "Arial",
      "fontSize": "14px",
      "activeSchoolYear": "2025-2026",
      "activeTerm": "Midterm",
      "sideNavColor": "#1e293b",
      "topNavColor": "#ffffff",
      "sideNavFontColor": "#e2e8f0",
      "sideNavHoverColor": "#ffffff",
      "sideNavActiveColor": "#ffffff",
      "topNavFontColor": "#1f2937",
      "loginBackgroundType": "color",
      "loginBackgroundColor": "#d6d6d6",
      "loginBackgroundImage": "",
      "loginFormBgColor": "#ffffff",
      "loginFormBgOpacity": 89,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 10. Reset App Settings to Default
- **POST** `/api/app-settings/reset`
- **Headers Required:**
  - `Content-Type: application/json`
- **Request:**
  ```bash
  curl -X POST http://localhost:3000/api/app-settings/reset \
    -H "Content-Type: application/json" \
    -b cookies.txt
  ```
- **Success Response (200):**
  ```json
  {
    "success": true,
    "message": "Settings reset to default successfully",
    "data": {
      "_id": "507f1f77bcf86cd799439014",
      "darkMode": false,
      "fontFamily": "Poppins",
      "fontSize": "13px",
      "activeSchoolYear": "2025-2026",
      "activeTerm": "Prelim",
      "sideNavColor": "#1e293b",
      "topNavColor": "#ffffff",
      "sideNavFontColor": "#e2e8f0",
      "sideNavHoverColor": "#ffffff",
      "sideNavActiveColor": "#ffffff",
      "topNavFontColor": "#1f2937",
      "loginBackgroundType": "color",
      "loginBackgroundColor": "#d6d6d6",
      "loginBackgroundImage": "",
      "loginFormBgColor": "#ffffff",
      "loginFormBgOpacity": 89,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

## User Roles
- `admin`
- `student`
- `instructor`
- `staff`

## User Status
- `active`
- `inactive`
- `suspended`

## Architecture

This project follows the **Service Layer Pattern**:

1. **Routes** - Define API endpoints and validation rules
2. **Controllers** - Handle HTTP requests and responses
3. **Services** - Contain business logic (separated from controllers)
4. **Models** - Define database schemas and data structure

This separation makes the code:
- ✅ **Scalable** - Easy to add new features
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Testable** - Each layer can be tested independently
- ✅ **Reusable** - Services can be used by different controllers

## Default Admin User

A default admin user is automatically created when the server starts:

- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Name:** `Administrator`
- **Role:** `admin`
- **Status:** `active`

## Security Features

- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ JWT auth with **HttpOnly cookies** (no token in `localStorage`)
- ✅ Short-lived access token + refresh token rotation (server-stored hash)
- ✅ Protected routes validate JWT from cookie (Bearer token still supported for compatibility)
- ✅ MongoDB injection protection with Mongoose
- ✅ All user operations use POST method (userId in request body, not URL)
- ✅ Sensitive data not exposed in URL parameters

