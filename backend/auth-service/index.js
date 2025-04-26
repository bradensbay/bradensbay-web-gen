const express = require('express');
const cors = require('cors');
const { initializeApp: initializeClientApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const admin = require('firebase-admin');

const PORT = 3005;

const firebaseConfig = {
    apiKey: "AIzaSyDmdf8NhoFAzXKGuBWYq5XoDrM5eNClgOg",
    authDomain: "bradensbay-1720893101514.firebaseapp.com",
    databaseURL: "https://bradensbay-1720893101514-default-rtdb.firebaseio.com/",
    projectId: "bradensbay-1720893101514",
    storageBucket: "bradensbay-1720893101514.appspot.com",
    messagingSenderId: "280971564912",
    appId: "1:280971564912:web:989fff5191d0512c1b21b5",
    measurementId: "G-DNJS8CVKWD"
};

const serviceAccountKeyPath = '/home/christian/bradensbay-1720893101514-firebase-adminsdk-5czfh-6849539d64.json';

admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountKeyPath)),
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