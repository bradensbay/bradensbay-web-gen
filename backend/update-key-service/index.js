const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('../config'); // Import the centralized config

const app = express();
const PORT = config.ports.updateKeyService;

app.use(cors());
app.use(bodyParser.json());

app.post('/addkey', (req, res) => {
    const { uid, key } = req.body;

    if (!uid || !key) {
        return res.status(400).json({ error: 'USER_ID and PUBLIC_KEY are required.' });
    }

    const sanitizedUid = uid.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedKey = key.replace(/[^a-zA-Z0-9@:.+\/= -]/g, '').replace(/"/g, '\\"');

    
    const command = `
    USER_ID="${sanitizedUid}"
    lxc exec "$USER_ID" -- bash -c '
        NON_ROOT_USER=$(ls /home | head -n 1) &&
        mkdir -p /home/$NON_ROOT_USER/.ssh &&
        echo "${sanitizedKey}" > /home/$NON_ROOT_USER/.ssh/authorized_keys &&
        chmod 600 /home/$NON_ROOT_USER/.ssh/authorized_keys &&
        chmod 700 /home/$NON_ROOT_USER/.ssh &&
        chown -R $NON_ROOT_USER:$NON_ROOT_USER /home/$NON_ROOT_USER/.ssh
    '
    `;
    
    
    console.log(`Executing command: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'Failed to add key to the container.' });
        }
        console.log(`stdout: ${stdout}`);
        return res.status(200).json({ message: `Public key added to container ${sanitizedUid}.` });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});