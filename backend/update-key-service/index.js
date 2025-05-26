const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios'); 
const config = require('./config');

const app = express();
const PORT = config.ports.updateKeyService;

app.use(cors());
app.use(bodyParser.json());

app.post('/addkey', async (req, res) => {
    const { uid, key } = req.body;

    if (!uid || !key) {
        return res.status(400).json({ error: 'USER_ID and PUBLIC_KEY are required.' });
    }

    try {
        const response = await axios.post(`http://localhost:${config.ports.containerService}/execute`, {
            key: process.env.CONTAINER_SERVICE_KEY,
            command: `
                USER_ID="${uid.replace(/[^a-zA-Z0-9_-]/g, '')}"
                lxc exec "$USER_ID" -- bash -c '
                    NON_ROOT_USER=$(ls /home | head -n 1) &&
                    mkdir -p /home/$NON_ROOT_USER/.ssh &&
                    echo "${key.replace(/[^a-zA-Z0-9@:.+\/= -]/g, '').replace(/"/g, '\\"')}" > /home/$NON_ROOT_USER/.ssh/authorized_keys &&
                    chmod 600 /home/$NON_ROOT_USER/.ssh/authorized_keys &&
                    chmod 700 /home/$NON_ROOT_USER/.ssh &&
                    chown -R $NON_ROOT_USER:$NON_ROOT_USER /home/$NON_ROOT_USER/.ssh
                '
            `
        });

        res.status(200).json({ message: response.data.message });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: 'Failed to add key to the container.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});