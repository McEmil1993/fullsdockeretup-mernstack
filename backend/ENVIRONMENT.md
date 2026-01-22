## Environment variables (backend)

Create a local `.env` file (not committed) with these values:

### Required

- **`MONGODB_URI`**: Mongo connection string (e.g. `mongodb://localhost:27017/student_info`)
- **`CLIENT_ORIGIN`**: React app origin for CORS (e.g. `http://localhost:5173`)
- **`JWT_ACCESS_SECRET`**: secret for access tokens
- **`JWT_REFRESH_SECRET`**: secret for refresh tokens

### Recommended / optional

- **`PORT`**: server port (default `3000`)
- **`NODE_ENV`**: `development` or `production`
- **`JWT_ACCESS_EXPIRES_IN`**: e.g. `15m`
- **`JWT_REFRESH_EXPIRES_IN`**: e.g. `7d`
- **`JWT_REFRESH_DAYS`**: refresh cookie/server expiry fallback (default `7`)
- **`COOKIE_SAMESITE`**: `lax` (default), `strict`, or `none`
- **`COOKIE_SECURE`**: `true|false` (default: `true` in production)
- **`TRUST_PROXY`**: `true|false` (set `true` behind reverse proxies)
- **`ACCESS_TOKEN_COOKIE_NAME`**: default `access_token`
- **`REFRESH_TOKEN_COOKIE_NAME`**: default `refresh_token`

### Notes

- **SameSite**: `lax` is recommended when frontend and backend are on the same “site” (e.g. `app.example.com` and `api.example.com`). If you truly need cross-site cookies, you’ll likely need `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`.
- **No token in localStorage**: access/refresh tokens are stored in **HttpOnly cookies**; React never receives them in the response body.


