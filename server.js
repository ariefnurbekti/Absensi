const express = require('express');
const admin = require('firebase-admin');
const session = require('express-session');

const app = express();
const port = 3000;

// Initialize Firebase
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const usersCollection = db.collection('users');
const checkinsCollection = db.collection('checkins');

// Middleware
app.use(express.static('public')); // Serve static files from 'public' directory
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: '7b1e8a8c85ff1f8a075095479a55fc3190773b372e23fd34353bcce2317fcffb', // Ganti dengan secret key yang kuat
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Atur ke true jika menggunakan HTTPS
}));

// Middleware untuk memeriksa otentikasi
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
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
            // Pengguna baru, simpan ke Firestore
            await userRef.set({
                uid,
                email,
                name,
                picture,
                createdAt: new Date()
            });
        }
        
        // Buat sesi untuk pengguna
        req.session.user = {
            uid,
            email,
            name,
            picture
        };
        
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

// Protected route example
app.get('/dashboard.html', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// Endpoint untuk mendapatkan data pengguna saat ini
app.get('/api/user', checkAuth, (req, res) => {
    res.json(req.session.user);
});


app.post('/checkin', checkAuth, async (req, res) => {
    const { uid, name } = req.session.user;
    try {
        await checkinsCollection.add({ 
            userId: uid,
            username: name, // Simpan nama pengguna untuk kemudahan
            timestamp: new Date() 
        });
        res.status(200).send('Check-in successful');
    } catch(error){
        console.error("Error on check-in:", error);
        res.status(500).send("Check-in failed");
    }
});


app.get('/checkins', checkAuth, async (req, res) => {
    // Hanya ambil check-in milik pengguna yang sedang login
    const { uid } = req.session.user;
    const checkinsSnapshot = await checkinsCollection.where('userId', '==', uid).orderBy('timestamp', 'desc').get();
    const checkins = checkinsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            username: data.username,
            timestamp: data.timestamp.toDate() // Konversi Firestore Timestamp ke Date
        }
    });
    res.json(checkins);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
