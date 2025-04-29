const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios'); // Use axios for HTTP requests
const fs = require('fs');
const path = require('path');
const config = require('../config'); // Import the centralized config

const app = express();
const PORT = config.ports.promptService;

const systemMessagePath = path.join(__dirname, 'system_message.txt');
let systemMessage = fs.readFileSync(systemMessagePath, 'utf8');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

const userHistory = {};

function addUserHistory(username, command) {
    if (!userHistory[username]) {
        userHistory[username] = [];
    }
    userHistory[username].push(command);
    if (userHistory[username].length > 15) {
        userHistory[username].shift();
    }
}

app.post('/execute', async (req, res) => {
    const { uid, prompt, username, contPwd } = req.body;

    if (!uid || !prompt || !username) {
        return res.status(400).json({ error: 'Missing required fields: uid, username, and prompt are required.' });
    }

    if (prompt === 'clear') {
        userHistory[username] = [];
        return res.status(200).json({ message: `Input history cleared for ${username}.` });
    }

    try {
        const history = userHistory[username] || [];
        const messages = [
            { role: "system", content: systemMessage },
            ...history.map(command => ({ role: "user", content: command })),
            { role: "user", content: prompt },
        ];

        const completion = await openai.chat.completions.create({
            model: "chatgpt-4o-latest",
            messages,
            temperature: 1,
            max_completion_tokens: 16383,
        });

        const commands = completion.choices[0].message.content
            .replace(/someusername/g, username)
            .replace(/userpassword/g, contPwd);

        addUserHistory(username, prompt);

        const response = await axios.post(`http://localhost:${config.ports.containerService}/execute`, {
            key: process.env.CONTAINER_SERVICE_KEY,
            command: commands
        });

        res.status(200).json({ message: response.data.message });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});