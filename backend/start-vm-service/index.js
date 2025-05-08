const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Use axios for HTTP requests
const admin = require('firebase-admin');
const config = require('./config'); // Import the centralized config
const firebaseConfig = require('./firebaseConfig'); // Import the centralized Firebase config

const PORT = config.ports.startVmService;

const app = express();

app.use(cors());
app.use(express.json());

admin.initializeApp({
    credential: admin.credential.cert(require(firebaseConfig.serviceAccountKeyPath)),
    databaseURL: firebaseConfig.databaseURL,
});

async function isEmailVerified(uid) {
    try {
        const userRecord = await admin.auth().getUser(uid);
        return userRecord.emailVerified;
    } catch (error) {
        throw new Error(`Error verifying user: ${error.message}`);
    }
}

app.post('/endpoint', async (req, res) => {
    const { uid, email } = req.body;

    try {
        const emailVerified = await isEmailVerified(uid);
        if (!emailVerified) {
            return res.status(403).json({ message: 'User email is not verified.' });
        }

        const response = await axios.post(`http://${config.endpoint.containerService}:${config.ports.containerService}/execute`, {
            key: process.env.CONTAINER_SERVICE_KEY,
            command: `sudo /home/christian/app/bradensbay-start-vm-api/newUserSchedular.sh ${uid} ${email}`
        });

        res.status(200).json({ message: response.data.message });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});