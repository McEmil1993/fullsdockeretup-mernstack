# API Requests Documentation (Student Information System - Backend)

## Base URL

- **Local**: `http://localhost:3000`
- **Health**: `GET /health`

## Common Headers (Important)

### `Content-Type: application/json`

- **Kailan kailangan?** 
  - Kapag ang request mo ay may **JSON body** (usually `POST` na may `-d '{...}'`).
  - Examples: `POST /api/auth/login`, `POST /api/users/get-all`, `POST /api/users/create`
- **Kailan hindi kailangan?** 
  - Kapag **walang body** (hal. `GET /api/auth/me`, `POST /api/auth/refresh`, `POST /api/auth/logout`)
  - Plain request lang na walang data na ipapasa

**Example:**
```bash
# Kailangan (may JSON body)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Hindi kailangan (walang body)
curl -b cookies.txt http://localhost:3000/api/auth/me
```

### Cookies (the “real auth” after login)

- **Browser/React**: make sure `credentials: "include"` (fetch) or `withCredentials: true` (axios).
- **curl**:
  - `-c cookies.txt` to **save** cookies after login
  - `-b cookies.txt` to **send** cookies on next requests

## Authentication (Cookie-based JWT)

This backend uses **HttpOnly cookies** for auth:
- React **does not** store tokens in `localStorage`
- Browser automatically sends cookies on requests **only if** `credentials` / `withCredentials` is enabled
- For `curl`, use a **cookie jar** (`-c` to save, `-b` to send)

### Cookie jar tip (curl)

- `-c cookies.txt` = save cookies from response
- `-b cookies.txt` = send cookies on request

---

## 1) Health Check

### GET `/health`

- **Purpose**: quick “server is running” check

```bash
curl http://localhost:3000/health
```

---

## 2) Auth Endpoints

### 2.1 Login

### POST `/api/auth/login`

- **Purpose**: validates credentials and sets **HttpOnly cookies**:
  - access token cookie (short-lived)
  - refresh token cookie (long-lived)
- **Body**: `{ email, password }`

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Success (200)**: returns user info (no token in JSON)

---

### 2.2 Who am I (session check)

### GET `/api/auth/me`

- **Purpose**: check if you are logged in (protected)
- **Needs cookies**: yes

```bash
curl -i -b cookies.txt http://localhost:3000/api/auth/me
```

**If not logged in**: `401`

---

### 2.3 Refresh session

### POST `/api/auth/refresh`

- **Purpose**: when access token expires, this endpoint uses the **refresh cookie** to mint:
  - a new access token cookie
  - a rotated refresh token cookie
- **Body**: none
- **Needs cookies**: yes

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/auth/refresh
```

#### When does refresh happen?

- Normal usage: you call protected endpoints
- If a protected endpoint returns **401** because access token expired:
  - call `POST /api/auth/refresh`
  - then **retry** the original request
- If refresh also returns **401**:
  - refresh cookie is missing/expired/revoked → user must log in again

---

### 2.4 Logout

### POST `/api/auth/logout`

- **Purpose**:
  - clears auth cookies
  - revokes refresh token server-side
  - invalidates access tokens immediately (token revocation)
- **Body**: none
- **Needs authentication**: **YES** (requires valid access token/cookies)
- **Note**: Kailangan mo muna mag-login bago makapag-logout

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

**Success (200):**
```json
{
  "success": true,
  "message": "Logged out"
}
```

After logout, protected endpoints should return **401**.

---

## 3) User Management (Protected)

All `/api/users/*` endpoints require being logged in (cookies).

### 3.1 Create user

### POST `/api/users`

- **Purpose**: create a new user
- **Needs cookies**: yes
- **Body**:
  - required: `name`, `email`, `password`
  - optional: `role` (`admin|student|instructor|staff`), `status` (`active|inactive|suspended`)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"student","status":"active"}'
```

---

### 3.2 Update user

### POST `/api/users/update`

- **Purpose**: update basic fields
- **Needs cookies**: yes
- **Body**:
  - required: `userId`
  - optional: `name`, `email`, `role`

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/users/update \
  -H "Content-Type: application/json" \
  -d '{"userId":"<mongo_id>","name":"Jane Doe","role":"instructor"}'
```

---

### 3.3 Update user status

### POST `/api/users/status`

- **Purpose**: set status
- **Needs cookies**: yes
- **Body**: `userId`, `status`

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/users/status \
  -H "Content-Type: application/json" \
  -d '{"userId":"<mongo_id>","status":"inactive"}'
```

---

### 3.4 Get user by ID

### POST `/api/users/get`

- **Purpose**: fetch a specific user
- **Needs cookies**: yes
- **Body**: `userId`

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/users/get \
  -H "Content-Type: application/json" \
  -d '{"userId":"<mongo_id>"}'
```

---

### 3.5 Get all users (pagination)

### POST `/api/users/get-all`

- **Purpose**: list users with pagination
- **Needs cookies**: yes
- **Body** (optional): `page`, `limit`

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/users/get-all \
  -H "Content-Type: application/json" \
  -d '{"page":1,"limit":10}'
```

---

### 3.6 Change Password

### POST `/api/users/change-password`

- **Purpose**: change user password (no confirm password needed)
- **Needs cookies**: yes
- **Body**:
  - required: `userId`, `newPassword` (min 6 characters)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/users/change-password \
  -H "Content-Type: application/json" \
  -d '{"userId":"<mongo_id>","newPassword":"newpassword123"}'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "_id": "<mongo_id>",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "New password must be at least 6 characters"
}
```

---

### 3.7 Verify Current Password

### POST `/api/users/verify-password`

- **Purpose**: verify if the current password is correct
- **Needs cookies**: yes
- **Body**:
  - required: `userId`, `currentPassword`

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/users/verify-password \
  -H "Content-Type: application/json" \
  -d '{"userId":"<mongo_id>","currentPassword":"oldpassword123"}'
```

**Success (200) - Password is correct:**
```json
{
  "success": true,
  "message": "Password is correct"
}
```

**Error (401) - Wrong password:**
```json
{
  "success": false,
  "message": "Wrong password"
}
```

**Error (404) - User not found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 4) App Settings (Protected)

All `/api/app-settings/*` endpoints require being logged in (cookies).

### 4.1 Get settings

### POST `/api/app-settings/get`

- **Purpose**: fetch system UI settings
- **Needs cookies**: yes
- **Body**: none

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/app-settings/get
```

---

### 4.2 Update settings

### POST `/api/app-settings/update`

- **Purpose**: update one or more app settings
- **Needs cookies**: yes
- **Body**: any subset of settings fields (examples below)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/app-settings/update \
  -H "Content-Type: application/json" \
  -d '{"darkMode":true,"fontFamily":"Poppins","fontSize":"13px"}'
```

---

### 4.3 Reset settings

### POST `/api/app-settings/reset`

- **Purpose**: reset settings to defaults
- **Needs cookies**: yes
- **Body**: none

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/app-settings/reset
```

---

## 5) Schedule Management (Protected)

All `/api/schedules/*` endpoints require being logged in (cookies).

### 5.1 Create Schedule

### POST `/api/schedules`

- **Purpose**: create a new schedule
- **Needs cookies**: yes
- **Body**: schedule object (see example below)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "subject_code": "IT 210",
    "description": "Discrete Math",
    "semester": "1st Semester",
    "academic_year": "2025-2026",
    "units": 3,
    "days": "TTH",
    "time": "10:00 AM - 11:30 AM",
    "room": "M 108",
    "students": ["24-019536", "24-021241"],
    "status": "active"
  }'
```

**Success (201):**
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "_id": "<mongo_id>",
    "subject_code": "IT 210",
    "description": "Discrete Math",
    "semester": "1st Semester",
    "academic_year": "2025-2026",
    "units": 3,
    "days": "TTH",
    "time": "10:00 AM - 11:30 AM",
    "room": "M 108",
    "students": ["24-019536", "24-021241"],
    "student_count": 2,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note**: `student_count` is automatically calculated from the `students` array length.

---

### 5.2 Update Schedule

### POST `/api/schedules/update`

- **Purpose**: update schedule fields
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId`
  - optional: any schedule fields (flat structure, not nested)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/schedules/update \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "<mongo_id>",
    "description": "Discrete Mathematics",
    "room": "M 109",
    "students": ["24-019536", "24-021241", "24-018918"]
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": { ...updated schedule... }
}
```

---

### 5.3 Update Schedule Status

### POST `/api/schedules/status`

- **Purpose**: update schedule status only
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId`, `status` (`active|inactive|cancelled`)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/schedules/status \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "<mongo_id>",
    "status": "inactive"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Schedule status updated successfully",
  "data": { ...schedule with updated status... }
}
```

---

### 5.4 Get Schedule by ID

### POST `/api/schedules/get`

- **Purpose**: fetch a single schedule by ID
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId`

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/schedules/get \
  -H "Content-Type: application/json" \
  -d '{"scheduleId":"<mongo_id>"}'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Schedule retrieved successfully",
  "data": { ...schedule object... }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Schedule not found"
}
```

---

### 5.5 Get All Schedules

### POST `/api/schedules/get-all`

- **Purpose**: list schedules with pagination and optional filters
- **Needs cookies**: yes
- **Body** (all optional):
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `semester` (filter)
  - `academic_year` (filter)
  - `status` (filter: `active|inactive|cancelled`)
  - `subject_code` (filter: partial match)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/schedules/get-all \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "limit": 10,
    "semester": "1st Semester",
    "academic_year": "2025-2026",
    "status": "active"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Schedules retrieved successfully",
  "data": [
    {
      "_id": "<mongo_id>",
      "subject_code": "IT 210",
      "description": "Discrete Math",
      "semester": "1st Semester",
      "academic_year": "2025-2026",
      "units": 3,
      "days": "TTH",
      "time": "10:00 AM - 11:30 AM",
      "room": "M 108",
      "students": ["24-019536", "24-021241"],
      "student_count": 2,
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

---

## 6) Student Management (Protected)

All `/api/students/*` endpoints require being logged in (cookies).

### Quick Reference

- **Create**: `POST /api/students` - Body: `{ student_id, last_name, first_name, middle_initial, gender, course_year, status }`
- **Update**: `POST /api/students/update` - Body: `{ studentId, ...fields }`
- **Update Status**: `POST /api/students/status` - Body: `{ studentId, status }`
- **Get by MongoDB ID**: `POST /api/students/get` - Body: `{ "studentId": "<mongo_id>" }`
- **Get by Student ID**: `POST /api/students/get-by-student-id` - Body: `{ "student_id": "24-019536" }`
- **Get All**: `POST /api/students/get-all` - Body: `{ page, limit, filters }`

---

### 6.1 Create Student

### POST `/api/students`

- **Purpose**: create a new student
- **Needs cookies**: yes
- **Body**: student object (see example below)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "24-019536",
    "last_name": "ALVIZ",
    "first_name": "BRELIAN JAY",
    "middle_initial": "D",
    "gender": "MALE",
    "course_year": "BSIT - 2",
    "status": "active"
  }'
```

**Success (201):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "_id": "<mongo_id>",
    "student_id": "24-019536",
    "last_name": "ALVIZ",
    "first_name": "BRELIAN JAY",
    "middle_initial": "D",
    "gender": "MALE",
    "course_year": "BSIT - 2",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (400) - Duplicate student_id:**
```json
{
  "success": false,
  "message": "Student with this student ID already exists"
}
```

---

### 6.2 Update Student

### POST `/api/students/update`

- **Purpose**: update student fields
- **Needs cookies**: yes
- **Body**:
  - required: `studentId` (MongoDB ID)
  - optional: any student fields (flat structure, not nested)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/students/update \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "<mongo_id>",
    "last_name": "ALVIZ JR",
    "middle_initial": "D."
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": { ...updated student... }
}
```

---

### 6.3 Update Student Status

### POST `/api/students/status`

- **Purpose**: update student status only
- **Needs cookies**: yes
- **Body**:
  - required: `studentId` (MongoDB ID), `status` (`active|inactive|graduated|dropped`)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/students/status \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "<mongo_id>",
    "status": "graduated"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Student status updated successfully",
  "data": { ...student with updated status... }
}
```

---

### 6.4 Get Student by MongoDB ID

### POST `/api/students/get`

- **Purpose**: fetch a single student by MongoDB ID
- **Needs cookies**: yes
- **Body**:
  - required: `studentId` (MongoDB ID)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/students/get \
  -H "Content-Type: application/json" \
  -d '{"studentId":"<mongo_id>"}'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Student retrieved successfully",
  "data": {
    "_id": "<mongo_id>",
    "student_id": "24-019536",
    "last_name": "ALVIZ",
    "first_name": "BRELIAN JAY",
    "middle_initial": "D",
    "gender": "MALE",
    "course_year": "BSIT - 2",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 6.5 Get Student by Student ID

### POST `/api/students/get-by-student-id`

- **Purpose**: fetch a single student by student_id (e.g., "24-019536")
- **Needs cookies**: yes
- **Body**:
  - required: `student_id` (e.g., "24-019536")

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/students/get-by-student-id \
  -H "Content-Type: application/json" \
  -d '{"student_id":"24-019536"}'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Student retrieved successfully",
  "data": {
    "_id": "<mongo_id>",
    "student_id": "24-019536",
    "last_name": "ALVIZ",
    "first_name": "BRELIAN JAY",
    "middle_initial": "D",
    "gender": "MALE",
    "course_year": "BSIT - 2",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 6.6 Get All Students

### POST `/api/students/get-all`

- **Purpose**: list students with pagination and optional filters
- **Needs cookies**: yes
- **Body** (all optional):
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
  - `status` (filter: `active|inactive|graduated|dropped`)
  - `gender` (filter: `MALE|FEMALE|OTHER`)
  - `student_id` (filter: partial match)
  - `last_name` (filter: partial match)
  - `first_name` (filter: partial match)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/students/get-all \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "limit": 10,
    "status": "active",
    "gender": "MALE"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    {
      "_id": "<mongo_id>",
      "student_id": "24-019536",
      "last_name": "ALVIZ",
      "first_name": "BRELIAN JAY",
      "middle_initial": "D",
      "gender": "MALE",
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

---

## 7) Assessment API (Protected)

All `/api/assessments/*` endpoints require being logged in (cookies).

### Quick Reference

- **Create/Update Highest Scores**: `POST /api/assessments/highest-scores` - Body: `{ scheduleId, school_year, term, highest_scores }`
- **Create/Update Assessment**: `POST /api/assessments` - Body: `{ scheduleId, student_id, school_year, term, scores }` (one score at a time)
- **Get Highest Scores**: `POST /api/assessments/highest-scores/get` - Body: `{ scheduleId, school_year, term? }`
- **Get Assessment**: `POST /api/assessments/get` - Body: `{ scheduleId, student_id, school_year, term? }`
- **Get All Assessments**: `POST /api/assessments/get-all` - Body: `{ scheduleId, school_year, term?, student_id?, page?, limit? }`
- **Get by Filters**: `POST /api/assessments/get-by-filters` - Body: `{ scheduleId?, school_year?, term?, student_id?, page?, limit? }`

---

### 7.1 Create or Update Highest Scores

### POST `/api/assessments/highest-scores`

- **Purpose**: save or update maximum scores for a schedule+school_year+term
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `school_year` (string), `term` (prelim|midterm|semi-final|final), `highest_scores` (object)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/assessments/highest-scores \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "<mongo_id>",
    "school_year": "2025-2026",
    "term": "prelim",
    "highest_scores": {
      "quizzes": {
        "quiz_1": 10,
        "quiz_2": 10,
        "quiz_3": 10,
        "quiz_4": 10,
        "quiz_5": 10,
        "quiz_6": 10,
        "quiz_7": 10,
        "quiz_8": 10,
        "quiz_9": 10,
        "quiz_10": 10
      },
      "activities": {
        "activity_1": 20,
        "activity_2": 20,
        "activity_3": 20,
        "activity_4": 20,
        "activity_5": 20,
        "activity_6": 20,
        "activity_7": 20,
        "activity_8": 20,
        "activity_9": 20,
        "activity_10": 20
      },
      "oral": {
        "oral_1": 20,
        "oral_2": 20,
        "oral_3": 20,
        "oral_4": 20,
        "oral_5": 20
      },
      "projects": {
        "project_1": 20,
        "project_2": 20,
        "project_3": 20,
        "project_4": 20,
        "project_5": 20
      },
      "attendance": 10,
      "exam_score": 50
    }
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Highest scores saved successfully",
  "data": {
    "_id": "<mongo_id>",
    "scheduleId": "<mongo_id>",
    "school_year": "2025-2026",
    "term": "prelim",
    "highest_scores": {
      "quizzes": {
        "quiz_1": 10,
        "quiz_2": 10,
        "quiz_3": 10,
        "quiz_4": 10,
        "quiz_5": 10,
        "quiz_6": 10,
        "quiz_7": 10,
        "quiz_8": 10,
        "quiz_9": 10,
        "quiz_10": 10
      },
      "activities": {
        "activity_1": 20,
        "activity_2": 20,
        "activity_3": 20,
        "activity_4": 20,
        "activity_5": 20,
        "activity_6": 20,
        "activity_7": 20,
        "activity_8": 20,
        "activity_9": 20,
        "activity_10": 20
      },
      "oral": {
        "oral_1": 20,
        "oral_2": 20,
        "oral_3": 20,
        "oral_4": 20,
        "oral_5": 20
      },
      "projects": {
        "project_1": 20,
        "project_2": 20,
        "project_3": 20,
        "project_4": 20,
        "project_5": 20
      },
      "attendance": 10,
      "exam_score": 50
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 7.2 Create or Update Assessment (One Score at a Time)

### POST `/api/assessments`

- **Purpose**: save or update individual student assessment score (one score at a time, for frontend inputs)
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `student_id` (string), `school_year` (string), `term` (prelim|midterm|semi-final|final)
  - optional: `scores` (object - partial update allowed)

**Note**: This endpoint supports partial updates. You can send only the fields you want to update (e.g., just `quiz_1` score).

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "<mongo_id>",
    "student_id": "24-019536",
    "school_year": "2025-2026",
    "term": "prelim",
    "scores": {
      "quizzes": {
        "quiz_1": 10,
        "quiz_2": 10
      },
      "activities": {
        "activity_1": 18
      },
      "attendance": 10,
      "exam_score": 36
    }
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Assessment saved successfully",
  "data": {
    "_id": "<mongo_id>",
    "scheduleId": "<mongo_id>",
    "student_id": "24-019536",
    "school_year": "2025-2026",
    "term": "prelim",
    "scores": {
      "quizzes": {
        "quiz_1": 10,
        "quiz_2": 10,
        "quiz_3": 0,
        "quiz_4": 0,
        "quiz_5": 0,
        "quiz_6": 0,
        "quiz_7": 0,
        "quiz_8": 0,
        "quiz_9": 0,
        "quiz_10": 0
      },
      "activities": {
        "activity_1": 18,
        "activity_2": 0,
        "activity_3": 0,
        "activity_4": 0,
        "activity_5": 0,
        "activity_6": 0,
        "activity_7": 0,
        "activity_8": 0,
        "activity_9": 0,
        "activity_10": 0
      },
      "oral": {
        "oral_1": 0,
        "oral_2": 0,
        "oral_3": 0,
        "oral_4": 0,
        "oral_5": 0
      },
      "projects": {
        "project_1": 0,
        "project_2": 0,
        "project_3": 0,
        "project_4": 0,
        "project_5": 0
      },
      "attendance": 10,
      "exam_score": 36
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (400) - Student not in schedule:**
```json
{
  "success": false,
  "message": "Student is not enrolled in this schedule"
}
```

---

### 7.3 Get Highest Scores

### POST `/api/assessments/highest-scores/get`

- **Purpose**: get maximum scores for a schedule+school_year+term
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `school_year` (string)
  - optional: `term` (prelim|midterm|semi-final|final)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/assessments/highest-scores/get \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "<mongo_id>",
    "school_year": "2025-2026",
    "term": "prelim"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<mongo_id>",
    "scheduleId": {
      "_id": "<mongo_id>",
      "subject_code": "IT 210",
      "description": "Discrete Math"
    },
    "school_year": "2025-2026",
    "term": "prelim",
    "highest_scores": {
      "quizzes": {
        "quiz_1": 10,
        "quiz_2": 10,
        "quiz_3": 10,
        "quiz_4": 10,
        "quiz_5": 10,
        "quiz_6": 10,
        "quiz_7": 10,
        "quiz_8": 10,
        "quiz_9": 10,
        "quiz_10": 10
      },
      "activities": {
        "activity_1": 20,
        "activity_2": 20,
        "activity_3": 20,
        "activity_4": 20,
        "activity_5": 20,
        "activity_6": 20,
        "activity_7": 20,
        "activity_8": 20,
        "activity_9": 20,
        "activity_10": 20
      },
      "oral": {
        "oral_1": 20,
        "oral_2": 20,
        "oral_3": 20,
        "oral_4": 20,
        "oral_5": 20
      },
      "projects": {
        "project_1": 20,
        "project_2": 20,
        "project_3": 20,
        "project_4": 20,
        "project_5": 20
      },
      "attendance": 10,
      "exam_score": 50
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 7.4 Get Assessment for a Specific Student

### POST `/api/assessments/get`

- **Purpose**: get assessment scores for a specific student
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `student_id` (string), `school_year` (string)
  - optional: `term` (prelim|midterm|semi-final|final)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/assessments/get \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "<mongo_id>",
    "student_id": "24-019536",
    "school_year": "2025-2026",
    "term": "prelim"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "<mongo_id>",
    "scheduleId": {
      "_id": "<mongo_id>",
      "subject_code": "IT 210",
      "description": "Discrete Math"
    },
    "student_id": "24-019536",
    "school_year": "2025-2026",
    "term": "prelim",
    "scores": {
      "quizzes": {
        "quiz_1": 10,
        "quiz_2": 10,
        "quiz_3": 10,
        "quiz_4": 10,
        "quiz_5": 10,
        "quiz_6": 10,
        "quiz_7": 10,
        "quiz_8": 10,
        "quiz_9": 10,
        "quiz_10": 10
      },
      "activities": {
        "activity_1": 18,
        "activity_2": 18,
        "activity_3": 18,
        "activity_4": 18,
        "activity_5": 18,
        "activity_6": 18,
        "activity_7": 18,
        "activity_8": 18,
        "activity_9": 18,
        "activity_10": 18
      },
      "oral": {
        "oral_1": 18,
        "oral_2": 18,
        "oral_3": 18,
        "oral_4": 18,
        "oral_5": 18
      },
      "projects": {
        "project_1": 18,
        "project_2": 18,
        "project_3": 18,
        "project_4": 18,
        "project_5": 18
      },
      "attendance": 10,
      "exam_score": 36
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 7.5 Get All Assessments for a Schedule

### POST `/api/assessments/get-all`

- **Purpose**: get all student assessments for a schedule (filtered by school_year and optionally by term)
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `school_year` (string)
  - optional: `term` (prelim|midterm|semi-final|final), `student_id` (string), `page` (number), `limit` (number)
  
**Note**: If `page` and `limit` are not provided, all results will be returned without pagination.

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/assessments/get-all \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "<mongo_id>",
    "school_year": "2025-2026",
    "term": "prelim",
    "page": 1,
    "limit": 100
  }'
```

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<mongo_id>",
      "scheduleId": {
        "_id": "<mongo_id>",
        "subject_code": "IT 210",
        "description": "Discrete Math"
      },
      "student_id": "24-019536",
      "school_year": "2025-2026",
      "term": "prelim",
      "scores": {
        "quizzes": {
          "quiz_1": 10,
          "quiz_2": 10,
          "quiz_3": 10,
          "quiz_4": 10,
          "quiz_5": 10,
          "quiz_6": 10,
          "quiz_7": 10,
          "quiz_8": 10,
          "quiz_9": 10,
          "quiz_10": 10
        },
        "activities": {
          "activity_1": 18,
          "activity_2": 18,
          "activity_3": 18,
          "activity_4": 18,
          "activity_5": 18,
          "activity_6": 18,
          "activity_7": 18,
          "activity_8": 18,
          "activity_9": 18,
          "activity_10": 18
        },
        "oral": {
          "oral_1": 18,
          "oral_2": 18,
          "oral_3": 18,
          "oral_4": 18,
          "oral_5": 18
        },
        "projects": {
          "project_1": 18,
          "project_2": 18,
          "project_3": 18,
          "project_4": 18,
          "project_5": 18
        },
        "attendance": 10,
        "exam_score": 36
      },
      "student_info": {
        "student_id": "24-019536",
        "last_name": "ALVIZ",
        "first_name": "BRELIAN JAY",
        "middle_initial": "D",
        "full_name": "ALVIZ, BRELIAN JAY D."
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1,
    "pages": 1
  }
}
```

---

### 7.6 Get Assessments by Filters

### POST `/api/assessments/get-by-filters`

- **Purpose**: get assessments with flexible filtering (all fields optional)
- **Needs cookies**: yes
- **Body**:
  - optional: `scheduleId` (MongoDB ID), `school_year` (string), `term` (prelim|midterm|semi-final|final), `student_id` (string), `page` (number), `limit` (number)
  
**Note**: If `page` and `limit` are not provided, all results will be returned without pagination.

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/assessments/get-by-filters \
  -H "Content-Type: application/json" \
  -d '{
    "school_year": "2025-2026",
    "term": "prelim",
    "page": 1,
    "limit": 100
  }'
```

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<mongo_id>",
      "scheduleId": {
        "_id": "<mongo_id>",
        "subject_code": "IT 210",
        "description": "Discrete Math",
        "semester": "1st Semester",
        "academic_year": "2025-2026"
      },
      "student_id": "24-019536",
      "school_year": "2025-2026",
      "term": "prelim",
      "scores": {
        "quizzes": {
          "quiz_1": 10,
          "quiz_2": 10,
          "quiz_3": 10,
          "quiz_4": 10,
          "quiz_5": 10,
          "quiz_6": 10,
          "quiz_7": 10,
          "quiz_8": 10,
          "quiz_9": 10,
          "quiz_10": 10
        },
        "activities": {
          "activity_1": 18,
          "activity_2": 18,
          "activity_3": 18,
          "activity_4": 18,
          "activity_5": 18,
          "activity_6": 18,
          "activity_7": 18,
          "activity_8": 18,
          "activity_9": 18,
          "activity_10": 18
        },
        "oral": {
          "oral_1": 18,
          "oral_2": 18,
          "oral_3": 18,
          "oral_4": 18,
          "oral_5": 18
        },
        "projects": {
          "project_1": 18,
          "project_2": 18,
          "project_3": 18,
          "project_4": 18,
          "project_5": 18
        },
        "attendance": 10,
        "exam_score": 36
      },
      "student_info": {
        "student_id": "24-019536",
        "last_name": "ALVIZ",
        "first_name": "BRELIAN JAY",
        "middle_initial": "D",
        "full_name": "ALVIZ, BRELIAN JAY D."
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1,
    "pages": 1
  }
}
```

---

## 8) Attendance API (Protected)

All `/api/attendance/*` endpoints require being logged in (cookies).

### Quick Reference

- **Create/Update Attendance**: `POST /api/attendance` - Body: `{ scheduleId, student_id, date, attendance, school_year, term }`
- **Get Attendance**: `POST /api/attendance/get` - Body: `{ scheduleId, date, school_year, term, student_id?, page?, limit? }`
- **Get Summary**: `POST /api/attendance/get-summary` - Body: `{ scheduleId, school_year, term }`

**Note**: After creating/updating attendance, the system automatically updates the Assessment attendance score by counting how many times the student was "present".

---

### 8.1 Create or Update Attendance

### POST `/api/attendance`

- **Purpose**: save or update attendance record for a student
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `student_id` (string), `date` (YYYY-MM-DD), `attendance` (present|absent|late|excused), `school_year` (string), `term` (prelim|midterm|semi-final|final)

**Note**: After saving, automatically updates the Assessment attendance score by counting "present" records.

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "69475ced102a71852e9ffabc",
    "student_id": "24-019536",
    "date": "2025-12-20",
    "attendance": "present",
    "school_year": "2025-2026",
    "term": "prelim"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Attendance saved successfully",
  "data": {
    "_id": "<mongo_id>",
    "scheduleId": "69475ced102a71852e9ffabc",
    "student_id": "24-019536",
    "date": "2025-12-20T00:00:00.000Z",
    "attendance": "present",
    "school_year": "2025-2026",
    "term": "prelim",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (400) - Student not in schedule:**
```json
{
  "success": false,
  "message": "Student is not enrolled in this schedule"
}
```

---

### 8.2 Get Attendance Records

### POST `/api/attendance/get`

- **Purpose**: get attendance records for a specific date
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `date` (YYYY-MM-DD), `school_year` (string), `term` (prelim|midterm|semi-final|final)
  - optional: `student_id` (string), `page` (number), `limit` (number)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/attendance/get \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "69475ced102a71852e9ffabc",
    "date": "2025-12-20",
    "school_year": "2025-2026",
    "term": "prelim",
    "page": 1,
    "limit": 100
  }'
```

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "<mongo_id>",
      "scheduleId": {
        "_id": "69475ced102a71852e9ffabc",
        "subject_code": "IT 210",
        "description": "Discrete Math"
      },
      "student_id": "24-019536",
      "date": "2025-12-20T00:00:00.000Z",
      "attendance": "present",
      "school_year": "2025-2026",
      "term": "prelim",
      "student_info": {
        "student_id": "24-019536",
        "last_name": "ALVIZ",
        "first_name": "BRELIAN JAY",
        "middle_initial": "D",
        "full_name": "ALVIZ, BRELIAN JAY D."
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1,
    "pages": 1
  }
}
```

---

### 8.3 Get Attendance Summary

### POST `/api/attendance/get-summary`

- **Purpose**: get attendance summary (count of present/absent/late/excused per student)
- **Needs cookies**: yes
- **Body**:
  - required: `scheduleId` (MongoDB ID), `school_year` (string), `term` (prelim|midterm|semi-final|final)

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/attendance/get-summary \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "69475ced102a71852e9ffabc",
    "school_year": "2025-2026",
    "term": "prelim"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "student_id": "24-019536",
      "present": 5,
      "absent": 2,
      "late": 1,
      "excused": 0,
      "total": 8
    },
    {
      "student_id": "24-021241",
      "present": 7,
      "absent": 1,
      "late": 0,
      "excused": 0,
      "total": 8
    }
  ]
}
```

---

## 9) Frontend integration notes (React)

### Include cookies on requests

- **fetch**

```js
await fetch('http://localhost:3000/api/auth/me', {
  credentials: 'include',
});
```

- **axios**

```js
axios.defaults.withCredentials = true;
```

### Handling expired access token (recommended)

If a protected request returns **401**:
1) call `POST /api/auth/refresh` (with credentials)
2) retry the original request
3) if refresh fails → show login screen

