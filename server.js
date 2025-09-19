const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const saltRounds = 10; // for bcrypt

// Connect to MongoDB
mongoose.connect('mongodb://localhost/absensi_db', { useNewUrlParser: true, useUnifiedTopology: true });

const User = mongoose.model('User', {
    username: String,
    password: String // This will now store the hashed password
});

const Checkin = mongoose.model('Checkin', {
    username: String,
    timestamp: { type: Date, default: Date.now }
});

app.use(express.static('.'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse JSON bodies

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.redirect('/dashboard.html');
        } else {
            res.send('Invalid username or password');
        }
    } else {
        res.send('Invalid username or password');
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.redirect('/login.html');
});

app.post('/checkin', async (req, res) => {
    const { username } = req.body; // Assuming username is sent in the request
    const newCheckin = new Checkin({ username });
    await newCheckin.save();
    res.status(200).send('Check-in successful');
});

app.get('/checkins', async (req, res) => {
    const checkins = await Checkin.find().sort({ timestamp: -1 });
    res.json(checkins);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
