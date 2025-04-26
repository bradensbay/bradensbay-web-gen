const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { initializeApp } = require('firebase/app');
const admin = require('firebase-admin');
const { getDatabase, ref, set, update } = require('firebase/database');
const config = require('../config'); // Import the centralized config
const firebaseConfig = require('../firebaseConfig'); // Import the centralized Firebase config

const PORT = config.ports.startVmService;

const app = express();

// Enable CORS for all routes and origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Firebase App
initializeApp(firebaseConfig);

// Initialize Firebase Admin SDK (requires admin credentials)
admin.initializeApp({
    credential: admin.credential.cert(require(firebaseConfig.serviceAccountKeyPath)),
    databaseURL: firebaseConfig.databaseURL,
});

// Function to verify email using Firebase Admin SDK
async function isEmailVerified(uid) {
    try {
        const userRecord = await admin.auth().getUser(uid);
        return userRecord.emailVerified;
    } catch (error) {
        throw new Error(`Error verifying user: ${error.message}`);
    }
}

// Function to execute the script with a timeout
function executeScript(uid, email) {
    return new Promise((resolve, reject) => {
        console.log(`Executing script for UID: ${uid}, Email: ${email}`);
        exec(`sudo /home/christian/app/bradensbay-start-vm-api/newUserSchedular.sh ${uid} ${email}`, { timeout: 120000 }, (error, stdout, stderr) => {
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return reject(new Error(`Error executing script: ${error.message}`));
            }
            if (stderr) {
                console.error(`Script error: ${stderr}`);
                return reject(new Error(`Script error: ${stderr}`));
            }
            resolve();
        });
    });
}

// Define a POST endpoint at '/endpoint'
app.post('/endpoint', async (req, res) => {
    const { uid, email } = req.body;

    console.log('Received JSON:', { uid, email });

    try {
        // Check if the user's email is verified
        const emailVerified = await isEmailVerified(uid);
        if (!emailVerified) {
            return res.status(403).json({ message: 'User email is not verified.' });
        }

        res.status(200).json({
            message: 'Script started successfully!',
        });
        await executeScript(uid, email);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});