require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const ShortUniqueId = require('short-unique-id');

const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: [], boards: [] });

const uid = new ShortUniqueId({ length: 10 });

// Initialize the database with a default structure if it's empty
async function initializeDatabase() {
    await db.read();
    db.data = db.data || {};
    db.data.users = db.data.users || [];
    if (!db.data.boards || db.data.boards.length === 0) {
        db.data.boards = [
            {
                id: 'board-main',
                title: 'Project Alpha',
                columns: [
                    {
                        id: 'col-1',
                        title: 'Backlog',
                        cards: [
                            { id: uid.rnd(), text: 'Design the login page', description: '' },
                            { id: uid.rnd(), text: 'Set up the database schema', description: 'Create the initial schema for users, projects, and tasks.' }
                        ]
                    },
                    {
                        id: 'col-2',
                        title: 'In Progress',
                        cards: [
                            { id: uid.rnd(), text: 'Develop the main dashboard UI', description: 'Build the main dashboard using Tailwind CSS.' }
                        ]
                    },
                    {
                        id: 'col-3',
                        title: 'Done',
                        cards: []
                    }
                ]
            }
        ];
    }
    await db.write();
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    await db.read();
    let user = db.data.users.find(u => u.id === profile.id);
    if (!user) {
        user = {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            picture: profile.photos[0].value,
            checkIns: [],
        };
        db.data.users.push(user);
        await db.write();
    }
    done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    await db.read();
    const user = db.data.users.find(u => u.id === id);
    done(null, user);
});

// --- Routes ---

// Auth Routes
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/dashboard.html',
    failureRedirect: '/login.html'
}));
app.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        res.redirect('/login.html');
    });
});

app.post('/auth/anonymous', async (req, res, next) => {
    const anonymousId = `anon_${uid.rnd()}`;
    const user = {
        id: anonymousId,
        name: 'Anonymous User',
        isAnonymous: true,
        picture: '', // No picture for anonymous users
        checkIns: [],
    };

    await db.read();
    db.data.users.push(user);
    await db.write();

    req.login(user, (err) => {
        if (err) {
            return next(err);
        }
        res.json({ redirectUrl: '/dashboard.html' });
    });
});


// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.status(401).redirect('/login.html');
}

// API Routes
app.get('/api/user', ensureAuthenticated, (req, res) => {
    res.json(req.user);
});

app.post('/api/checkin', ensureAuthenticated, async (req, res) => {
    await db.read();
    const user = db.data.users.find(u => u.id === req.user.id);
    const today = new Date().toLocaleDateString();
    if (user && !user.checkIns.some(c => c.date === today)) {
        user.checkIns.push({ date: today, time: new Date().toLocaleTimeString() });
        await db.write();
        res.status(200).json({ message: 'Checked in successfully' });
    } else {
        res.status(400).json({ message: 'Already checked in today' });
    }
});

// --- Kanban Board API Endpoints ---

app.get('/api/board', ensureAuthenticated, async (req, res) => {
    await db.read();
    res.json(db.data.boards[0]);
});

app.post('/api/cards', ensureAuthenticated, async (req, res) => {
    const { columnId, text } = req.body;
    if (!columnId || !text) {
        return res.status(400).json({ message: 'Column ID and text are required' });
    }
    await db.read();
    const board = db.data.boards[0];
    const column = board.columns.find(c => c.id === columnId);
    if (column) {
        const newCard = { id: uid.rnd(), text, description: '' };
        column.cards.push(newCard);
        await db.write();
        res.status(201).json(newCard);
    } else {
        res.status(404).json({ message: 'Column not found' });
    }
});

app.put('/api/cards/move', ensureAuthenticated, async (req, res) => {
    const { cardId, newColumnId, newIndex } = req.body;
    await db.read();
    const board = db.data.boards[0];
    let cardToMove = null;
    let sourceColumn = null;

    board.columns.forEach(column => {
        const cardIndex = column.cards.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            sourceColumn = column;
            cardToMove = column.cards.splice(cardIndex, 1)[0];
        }
    });

    if (cardToMove) {
        const destinationColumn = board.columns.find(c => c.id === newColumnId);
        if (destinationColumn) {
            destinationColumn.cards.splice(newIndex, 0, cardToMove);
            await db.write();
            res.status(200).json({ message: 'Card moved successfully' });
        } else {
            res.status(404).json({ message: 'Destination column not found' });
        }
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

// --- Card Details API Endpoints ---

app.get('/api/cards/:cardId', ensureAuthenticated, async (req, res) => {
    await db.read();
    const cardId = req.params.cardId;
    let card = null;
    db.data.boards[0].columns.forEach(column => {
        const foundCard = column.cards.find(c => c.id === cardId);
        if (foundCard) card = foundCard;
    });
    if (card) {
        res.json(card);
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

app.put('/api/cards/:cardId', ensureAuthenticated, async (req, res) => {
    await db.read();
    const cardId = req.params.cardId;
    const { text, description } = req.body;
    let cardToUpdate = null;
    db.data.boards[0].columns.forEach(column => {
        const foundCard = column.cards.find(c => c.id === cardId);
        if (foundCard) cardToUpdate = foundCard;
    });

    if (cardToUpdate) {
        if (text !== undefined) cardToUpdate.text = text;
        if (description !== undefined) cardToUpdate.description = description;
        await db.write();
        res.json(cardToUpdate);
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

app.delete('/api/cards/:cardId', ensureAuthenticated, async (req, res) => {
    await db.read();
    const cardId = req.params.cardId;
    let cardFound = false;
    db.data.boards[0].columns.forEach(column => {
        const cardIndex = column.cards.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            column.cards.splice(cardIndex, 1);
            cardFound = true;
        }
    });

    if (cardFound) {
        await db.write();
        res.status(200).json({ message: 'Card deleted successfully' });
    } else {
        res.status(404).json({ message: 'Card not found' });
    }
});

// Start the server after initializing the database
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});
