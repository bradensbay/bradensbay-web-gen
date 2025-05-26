const express = require('express');
const cors = require('cors');
const { initializeApp: initializeClientApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const admin = require('firebase-admin');
const config = require('./config'); // Import the centralized config
const firebaseConfig = require('./firebaseConfig'); // Import the centralized Firebase config

const PORT = config.ports.authService;


admin.initializeApp({
    credential: admin.credential.cert(require(firebaseConfig.serviceAccountKeyPath)),
    databaseURL: firebaseConfig.databaseURL,
});


const firebaseApp = initializeClientApp(firebaseConfig);
const auth = getAuth(firebaseApp);

const app = express();
app.use(cors());
app.use(express.json());

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { uid: userCredential.user.uid };
    } catch (error) {
        console.error('Error during login:', error.message);
        throw error;
    }
}

app.post('/sign-in', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await loginUser(email, password);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message }); // Return detailed error message
    }
});

app.post('/verify-token', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return res.status(200).json({ uid: decodedToken.uid });
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

app.get('/user/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        const userRecord = await admin.auth().getUser(uid);
        return res.status(200).json(userRecord);
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});