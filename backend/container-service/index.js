const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const config = require('./config'); // Import the centralized config

const PORT = config.ports.containerService;
const AUTH_KEY = process.env.CONTAINER_SERVICE_KEY; // RSA-style key from environment variable
const SSH_PASSWORD = process.env.SSH_PASSWORD; // SSH password from environment variable
console.log('Container key:', AUTH_KEY);
const app = express();

app.use(cors());

app.use(express.json());

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        if (command.includes('sudo')) {
            command = `echo ${SSH_PASSWORD} | sudo -S ${command.replace('sudo', '').trim()}`;
        }

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return reject({ error: error.message, stderr });
            }
            resolve({ stdout, stderr });
        });
    });
}

app.post('/execute', async (req, res) => {
    const { key, command } = req.body;

    if (key !== AUTH_KEY) {
        return res.status(403).json({ error: 'Unauthorized: Invalid key' });
    }

    if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: 'Invalid command' });
    }

    try {
        console.log(`Executing command: ${command}`);
        const result = await executeCommand(command);
        res.status(200).json({ message: 'Command executed successfully', result });
    } catch (error) {
        res.status(500).json({ error: 'Command execution failed', details: error });
    }
});


app.listen(PORT, () => {
    console.log(`Container Service running on port ${PORT}`);
});