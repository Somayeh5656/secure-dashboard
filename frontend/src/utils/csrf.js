/**
 * CSRF Protection Utilities
 * 
 * Provides client‑side functions for double‑submit cookie CSRF protection.
 * The backend sets a `csrf_token` cookie (non‑HttpOnly, readable by JavaScript).
 * This module reads that cookie and automatically attaches its value as an
 * `X-CSRFToken` header to every fetch request that uses `fetchWithCsrf`.
 * 
 * The server then validates that the header value matches the cookie,
 * preventing cross‑site request forgery attacks.
 */

import Cookies from 'js-cookie';

/**
 * Retrieve the CSRF token from the browser's cookies.
 * The token is stored under the key `csrf_token`.
 * @returns {string|undefined} The CSRF token string, or undefined if not present.
 */
export const getCsrfToken = () => {
  const token = Cookies.get('csrf_token');
  console.log('CSRF token from cookie:', token);
  return token;
};

/**
 * Wrapper around the native `fetch` function that automatically includes the CSRF token.
 * 
 * @param {string} url - The URL to fetch.
 * @param {object} options - Standard fetch options (method, body, headers, etc.).
 * @returns {Promise<Response>} A Promise resolving to the Response object.
 * 
 * This function:
 *   1. Reads the CSRF token from the cookie.
 *   2. Adds an `X-CSRFToken` header with the token value (if token exists).
 *   3. Sets `credentials: 'include'` to send cookies (including session cookie).
 *   4. Merges any additional headers provided by the caller.
 */
export const fetchWithCsrf = (url, options = {}) => {
  const csrfToken = getCsrfToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
    console.log('Adding X-CSRFToken header:', csrfToken);
  }
  return fetch(url, {
    ...options,
    credentials: 'include',   // Required to send cookies with the request
    headers,
  });
};