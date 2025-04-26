const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { initializeApp } = require('firebase/app');
const admin = require('firebase-admin');
const { getDatabase, ref, set, update } = require('firebase/database');

const app = express();

// Enable CORS for all routes and origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Firebase client configuration
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

// Initialize Firebase App
initializeApp(firebaseConfig);

// Initialize Firebase Admin SDK (requires admin credentials)
const serviceAccount = require('/home/christian/bradensbay-1720893101514-firebase-adminsdk-5czfh-6849539d64.json'); // Replace with your Firebase Admin SDK JSON key
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseConfig.databaseURL
});

//Function to verify email using Firebase Admin SDK
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
            message: 'Script started successfully!'
        });
        await executeScript(uid, email);

        // Send a success response


    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});