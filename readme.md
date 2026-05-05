# Secure Role‑Based Dashboard

A full‑stack web application demonstrating secure authentication, role‑based access control (RBAC), and protection against common web vulnerabilities (OWASP Top 10). Built with **React (TypeScript)** on the frontend and **Python Flask** on the backend.

---

## ✨ Features

- **User registration & login** (supports username or email)
- **Two roles**: `Admin` and `Regular user`
- **Admin dashboard**:
  - View all registered users
  - Create / delete users
  - Assign roles (Admin / Moderator / User)
  - View system audit logs (with pagination)
  - Log activity chart (last 7 days)
- **User dashboard**:
  - Edit profile (username, email)
  - Change password
  - View personal activity log
- **Security measures**:
  - CSRF protection (double‑submit cookie pattern)
  - XSS prevention (React auto‑escaping)
  - SQL injection prevention (SQLAlchemy parameterised queries)
  - Password hashing (PBKDF2 + SHA‑256)
  - Secure session cookies (`HttpOnly`, `SameSite=Lax`)
  - Rate limiting (login: 5/min, registration: 3/hour)
  - Audit logging for all sensitive actions
  - Security headers (CSP, X‑Frame‑Options, etc.)

---

## 🛠️ Technology Stack

| Layer          | Technology                                                      |
|----------------|-----------------------------------------------------------------|
| Frontend       | React, TypeScript, Tailwind CSS, Vite                           |
| Backend        | Python Flask, Flask‑Login, Flask‑WTF, Flask‑SQLAlchemy          |
| Database       | SQLite (development) – can be switched to PostgreSQL            |
| Security       | Werkzeug (password hashing), Flask‑Limiter, Flask‑Talisman      |
| Dev Tools      | Snyk (dependency scanning), Bandit (SAST for Python)            |

---

## 📁 Project Structure

```
secure-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py      # App factory, security headers
│   │   ├── auth.py          # Login, register, logout, CSRF endpoint
│   │   ├── user.py          # Profile, activity, change password
│   │   ├── admin.py         # Admin endpoints (users, logs, stats)
│   │   ├── models.py        # User and AuditLog models
│   │   ├── extensions.py    # db, login_manager, csrf, limiter
│   │   ├── utils.py         # admin_required decorator
│   │   └── config.py        # Configuration (session, CSRF, rate limits)
│   ├── run.py               # Entry point
│   ├── requirements.txt
│   └── .env                 # Secret keys (not committed)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx          # Root component, CSRF token fetch
│   │   │   ├── routes.tsx       # Routing with ProtectedRoute
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── pages/           # Login, Register, UserDashboard, AdminDashboard
│   │   │   └── hooks/           # useAuth hook
│   │   └── utils/
│   │       └── csrf.ts          # fetchWithCsrf helper
│   ├── package.json
│   └── vite.config.ts       # Proxy to backend
└── README.md
```

---

## 🔧 Setup Instructions

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git

### Backend Setup

1. **Clone the repository** and navigate to the backend folder:
   ```bash
   cd secure-dashboard/backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate      # Linux/Mac
   .\venv\Scripts\activate       # Windows
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file** inside `backend/` with:
   ```
   SECRET_KEY=your-strong-secret-key
   DATABASE_URL=sqlite:///app.db
   WTF_CSRF_SECRET_KEY=your-csrf-secret-key   # optional, falls back to SECRET_KEY
   ```

5. **Run the Flask backend**:
   ```bash
   python run.py
   ```
   The API will be available at `http://localhost:5000`.

### Frontend Setup

1. **Open a new terminal** and navigate to the frontend folder:
   ```bash
   cd secure-dashboard/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

> The frontend proxies API requests to `http://localhost:5000` via Vite proxy (configured in `vite.config.ts`).

---

## 🔐 Security Features Explained

| Attack                | Mitigation                                                                                         |
|-----------------------|----------------------------------------------------------------------------------------------------|
| **CSRF**              | Double‑submit cookie pattern: backend sets `csrf_token` cookie, frontend sends it as `X-CSRFToken` header. |
| **XSS**               | React auto‑escapes all JSX content; backend returns only JSON.                                     |
| **SQL Injection**     | SQLAlchemy ORM uses parameterised queries – no string concatenation.                               |
| **Password leakage**  | Passwords hashed with PBKDF2 + SHA‑256 (Werkzeug).                                                 |
| **Session hijacking** | Cookies set with `HttpOnly`, `Secure` (in production), `SameSite='Lax'`.                           |
| **Brute force**       | Rate limiting: 5 login attempts per minute, 3 registration attempts per hour.                      |
| **Broken access control** | Backend `@admin_required` decorator; frontend `ProtectedRoute` component.                      |
| **Information disclosure** | Generic error messages (same for wrong username or wrong password).                            |
| **Clickjacking**      | `X-Frame-Options: DENY` and CSP headers.                                                           |

---

## 🧪 Testing Security (Manual)

You can verify the protections:

- **CSRF**: Send a POST request without the `X-CSRFToken` header → 400 error.
- **XSS**: Try to set username to `<script>alert(1)</script>` → escaped, no alert.
- **SQL injection**: Login with `' OR 1=1; --` → fails with generic error.
- **Access control**: Normal user tries to access `/admin` → redirected to `/user`.
- **Rate limiting**: 6 wrong logins in one minute → 429 Too Many Requests.

---

## 🤖 AI Usage

This project used AI (ChatGPT) for:
- Generating boilerplate Flask routes and React components
- Refactoring TypeScript type definitions
- Debugging CSRF cookie and session issues
All generated code was manually reviewed and adapted for security.

---

## 📝 Future Improvements

- Two‑factor authentication (TOTP) using `pyotp`
- Password reset via email
- HTTPS with `Secure` cookie flag enabled
- Centralised session store (Redis) for rate limiting in production

---

## 📄 License

This project was created as a course assignment for **COMP.SEC.300 Secure Programming** at Tampere University.

---

## 🙏 Acknowledgements

- OWASP for security guidelines
- Flask and React communities for excellent documentation