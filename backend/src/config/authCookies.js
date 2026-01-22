function isProd() {
  return process.env.NODE_ENV === 'production';
}

function getCookieSameSite() {
  // Recommended default: Lax (works for same-site subdomains like app.example.com <-> api.example.com)
  // If you truly need cross-site cookies, set COOKIE_SAMESITE=none and COOKIE_SECURE=true
  const raw = (process.env.COOKIE_SAMESITE || '').toLowerCase().trim();
  if (raw === 'none') return 'none';
  if (raw === 'strict') return 'strict';
  return 'lax';
}

function getCookieSecure() {
  if (typeof process.env.COOKIE_SECURE === 'string') {
    return process.env.COOKIE_SECURE.toLowerCase() === 'true';
  }
  return isProd();
}

function baseCookieOptions() {
  const sameSite = getCookieSameSite();
  const secure = getCookieSecure();

  // Modern browsers require Secure when SameSite=None
  const normalizedSecure = sameSite === 'none' ? true : secure;

  return {
    httpOnly: true,
    secure: normalizedSecure,
    sameSite,
  };
}

function accessTokenCookieOptions() {
  return {
    ...baseCookieOptions(),
    path: '/',
  };
}

function refreshTokenCookieOptions() {
  // Restrict refresh cookie to refresh endpoint only
  return {
    ...baseCookieOptions(),
    path: '/api/auth/refresh',
  };
}

module.exports = {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
};


