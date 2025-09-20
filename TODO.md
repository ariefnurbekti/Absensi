# Todo List for Deployment

### High Priority:

- [x] Create and upload `firebase-service-account.json`.
- [x] In `server.js`, change the session secret key to a strong, unique value.
- [x] In `public/login.html`, replace `"YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"` with your actual Google Client ID.

### Recommended:

- [x] In `server.js`, set `cookie.secure` to `true` for production (HTTPS).
- [x] In `package.json`, remove unused dependencies: `bcrypt` and `mongoose`.
- [x] In `package.json`, consider changing the `express` version to a stable release (e.g., `^4.17.1`).
