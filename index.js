'''
This file sets up a complete Express.js server for the employee attendance application.

Key functionalities:
1.  **Express Server Setup**: Initializes an Express app and sets up necessary middleware like `express.json` for parsing JSON bodies and `express.static` to serve frontend files from the 'public' directory.

2.  **Session Management**: Uses `express-session` to manage user sessions. Sessions are stored in memory, which is suitable for development but should be replaced with a persistent store for production.

3.  **Google OAuth 2.0 Integration**: 
    - Includes an endpoint `/auth/google` to handle sign-ins. It receives an ID token from the frontend.
    - Uses `google-auth-library` to verify the token.
    - On successful verification, it extracts the user's profile information (name, email, picture), stores it in an in-memory `users` database, and establishes a session for the user.

4.  **Authentication Middleware**: 
    - A middleware function `ensureAuthenticated` checks if a user is logged into a session.
    - It protects sensitive routes (like `/api/user`, `/dashboard.html`, etc.), redirecting unauthenticated users to the login page.

5.  **In-Memory Data Storage**: 
    - `users`: Stores user profiles, keyed by user ID.
    - `checkins`: An array storing all check-in records. Each record includes a `userId`, `username`, and `timestamp`.
    - `tasks`: An array storing all task items. Each task has an `id`, `userId`, `title`, and `completed` status.

6.  **API Endpoints**:
    - `/api/user`: Returns the currently logged-in user's data.
    - `/checkin`: Allows a logged-in user to check in. It prevents duplicate check-ins on the same day.
    - `/checkins`: Returns all check-in records for the logged-in user.
    - `/api/tasks`: 
        - `GET`: Returns all tasks for the logged-in user.
        - `POST`: Creates a new task for the logged-in user.
    - `/api/tasks/:id`:
        - `DELETE`: Deletes a specific task by its ID.

7.  **Logout**: 
    - The `/logout` route clears the user's session and redirects them to the login page.

8.  **Server Initialization**: The server starts listening on a specified port (defaults to 3000).
'''

const express = require('express');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = '288114894958-a922hgobtrnm1pp8ln8gmcur1sa17rcr.apps.googleusercontent.com';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- In-Memory Data Stores ---
const users = {}; // Store user data { userId: { name, email, picture } }
const checkins = []; // Store check-in data { userId, username, timestamp }
const tasks = []; // Store tasks { id, userId, title, completed }

// --- Middleware ---
app.use(express.json());
app.use(session({
    secret: 'super-secret-key-change-it',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use `true` in production with HTTPS
}));

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    // If it's an API call, send a 401 Unauthorized
    if (req.path.startsWith('/api/') || req.path.startsWith('/checkin')) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    // For page loads, redirect to login
    res.redirect('/login.html');
}

// Serve static files from 'public' directory
// Unprotected files (login page and its assets)
app.use(express.static('public'));

// --- Authentication Routes ---

app.post('/auth/google', async (req, res) => {
    const { idToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: userId, name, email, picture } = payload;

        // Store user in our "database"
        if (!users[userId]) {
            users[userId] = { name, email, picture };
        }

        // Create a session
        req.session.userId = userId;
        res.status(200).json({ redirectUrl: '/dashboard.html' });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard.html');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login.html');
    });
});

// --- Protected API Routes & Pages ---

// The following routes and static assets require authentication
app.use([
    '/dashboard.html',
    '/planner.html',
    '/settings.html',
    '/manage-project.html',
    '/api', 
    '/checkin',
    '/checkins'
], ensureAuthenticated);

app.get('/api/user', (req, res) => {
    const user = users[req.session.userId];
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.post('/checkin', (req, res) => {
    const userId = req.session.userId;
    const user = users[userId];
    const today = new Date().toISOString().split('T')[0];

    const hasCheckedInToday = checkins.some(
        c => c.userId === userId && new Date(c.timestamp).toISOString().split('T')[0] === today
    );

    if (hasCheckedInToday) {
        return res.status(409).json({ message: 'User has already checked in today' });
    }

    checkins.push({ userId, username: user.name, timestamp: new Date() });
    res.status(201).json({ message: 'Check-in successful' });
});

app.get('/checkins', (req, res) => {
    const userCheckins = checkins.filter(c => c.userId === req.session.userId);
    res.json(userCheckins.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

// --- Task Planner API ---

app.get('/api/tasks', (req, res) => {
    const userTasks = tasks.filter(t => t.userId === req.session.userId);
    res.json(userTasks);
});

app.post('/api/tasks', (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
    }
    const newTask = {
        id: crypto.randomBytes(16).toString('hex'),
        userId: req.session.userId,
        title,
        completed: false
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === id && t.userId === req.session.userId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found or user not authorized' });
    }

    tasks.splice(taskIndex, 1);
    res.status(204).send(); // No Content
});

// --- Server Start ---

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
