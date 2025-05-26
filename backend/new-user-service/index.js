const express = require('express');
const cors = require('cors');
const { initializeApp: initializeClientApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const admin = require('firebase-admin');
const firebaseConfig = require('./firebaseConfig');
const config = require('./config'); // Import the centralized config

const PORT = config.ports.newUserService;

// Get the service account key path from firebaseConfig
const serviceAccountKeyPath = firebaseConfig.serviceAccountKeyPath;

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountKeyPath)),
    databaseURL: firebaseConfig.databaseURL,
});


const firebaseApp = initializeClientApp(firebaseConfig);
const auth = getAuth(firebaseApp);


const app = express();
app.use(cors());
app.use(express.json());

async function signup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await sendEmailVerification(userCredential.user);

        return { message: "all good" };
    } catch (error) {
        console.error('Error during signup:', error.message);
        throw error;
    }
}


app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await signup(email, password);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message }); // Return detailed error message
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});