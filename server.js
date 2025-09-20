const express = require('express');
const admin = require('firebase-admin');
const session = require('express-session');

// This check is CRITICAL for Vercel deployment.
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('FATAL ERROR: Firebase environment variables are not set.');
    // In a server environment, you should exit if the config is missing.
    if (process.env.VERCEL) {
        process.exit(1);
    }
}

const app = express();

// --- Firebase Initialization ---
// This configuration now ONLY uses environment variables.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key from the environment variable must have its escaped newlines replaced.
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// --- End Firebase Initialization ---

const db = admin.firestore();
const usersCollection = db.collection('users');
const checkinsCollection = db.collection('checkins');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: '7b1e8a8c85ff1f8a075095479a55fc3190773b372e23fd34353bcce2317fcffb',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' } // 'auto' is great for Vercel
}));

// Middleware to check authentication
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// --- Routes ---
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Google Auth Endpoint
app.post('/auth/google', async (req, res) => {
    const { idToken } = req.body;
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        const userRef = usersCollection.doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({ uid, email, name, picture, createdAt: new Date() });
        }
        
        req.session.user = { uid, email, name, picture };
        res.status(200).json({ message: "Login successful", redirectUrl: "/dashboard.html" });

    } catch (error) {
        console.error("Error verifying Google token:", error);
        res.status(401).send("Authentication failed");
    }
});

// Logout Endpoint
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard.html');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login.html');
    });
});

// Protected route
app.get('/dashboard.html', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// API to get current user data
app.get('/api/user', checkAuth, (req, res) => {
    res.json(req.session.user);
});

// Check-in Endpoint
app.post('/checkin', checkAuth, async (req, res) => {
    const { uid, name } = req.session.user;
    try {
        await checkinsCollection.add({ 
            userId: uid,
            username: name,
            timestamp: new Date() 
        });
        res.status(200).send('Check-in successful');
    } catch(error){
        console.error("Error on check-in:", error);
        res.status(500).send("Check-in failed");
    }
});

// Get Check-ins Endpoint
app.get('/checkins', checkAuth, async (req, res) => {
    const { uid } = req.session.user;
    const checkinsSnapshot = await checkinsCollection.where('userId', '==', uid).orderBy('timestamp', 'desc').get();
    const checkins = checkinsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            username: data.username,
            timestamp: data.timestamp.toDate()
        }
    });
    res.json(checkins);
});

// Export the app for Vercel
module.exports = app;