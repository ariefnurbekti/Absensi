const express = require('express');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');

const app = express();
const port = 3000;
const saltRounds = 10; // for bcrypt

// Initialize Firebase
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const usersCollection = db.collection('users');
const checkinsCollection = db.collection('checkins');

app.use(express.static('.'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse JSON bodies

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userSnapshot = await usersCollection.where('username', '==', username).get();
    if (userSnapshot.empty) {
        res.send('Invalid username or password');
        return;
    }

    const user = userSnapshot.docs[0].data();
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        res.redirect('/dashboard.html');
    } else {
        res.send('Invalid username or password');
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await usersCollection.add({ username, password: hashedPassword });
    res.redirect('/login.html');
});

app.post('/checkin', async (req, res) => {
    const { username } = req.body; // Assuming username is sent in the request
    await checkinsCollection.add({ username, timestamp: new Date() });
    res.status(200).send('Check-in successful');
});

app.get('/checkins', async (req, res) => {
    const checkinsSnapshot = await checkinsCollection.orderBy('timestamp', 'desc').get();
    const checkins = checkinsSnapshot.docs.map(doc => doc.data());
    res.json(checkins);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
