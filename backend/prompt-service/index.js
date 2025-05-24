const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios'); // Use axios for HTTP requests
const fs = require('fs');
const path = require('path');
const config = require('./config'); // Import the centralized config

const app = express();
const PORT = config.ports.promptService;

const systemMessagePath = path.join(__dirname, 'system_message.txt');
let systemMessage = fs.readFileSync(systemMessagePath, 'utf8');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(cors({
    origin: 'https://prompt.bradensbay.com', // Allow requests from this specific origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));

const userHistory = {};

function addUserHistory(uid, command) {
    if (!userHistory[uid]) {
        userHistory[uid] = [];
    }
    userHistory[uid].push(command);
    if (userHistory[uid].length > 15) {
        userHistory[uid].shift();
    }
}

app.post('/execute', async (req, res) => {
    const { uid, prompt, username, contPwd } = req.body;

    if (!uid || !prompt || !username) {
        return res.status(400).json({ error: 'Missing required fields: uid, username, and prompt are required.' });
    }

    if (prompt === 'clear') {
        userHistory[uid] = [];
        return res.status(200).json({ message: `Input history cleared for ${username}.` });
    }

    try {
        const history = userHistory[uid] || [];
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

        let completionContent = completion.choices[0].message.content;

        // Split the content into commands and explanation

        console.log(`Completion content: ${completionContent}`); // Debugging line
        // More robust delimiter check: accept common misspellings using regex
        // Matches "**Explanation:**" or "**Explination:**" (case-insensitive)
        const delimiterRegex = /\*\*Expl[ai]nation:\*\*/i;
        const splitContent = completionContent.split(delimiterRegex);

        if (splitContent.length < 2) {
            throw new Error("Invalid response format from OpenAI API. Missing '**Explanation:**' delimiter (or common variants).");
        }

        const [commandsPart, explanationPart] = splitContent;

        let commands = commandsPart
            .replace(/someusername/g, username)
            .replace(/userpassword/g, contPwd);

        // Prepend the LXD execution command
        const safeCommands = commands.replace(/'/g, `'\\''`);
        commands = `lxc exec ${uid} -- bash -c '${safeCommands}'`;

        // Debug: Print the commands being sent to the container service
        console.log(`Sending commands to container service: ${commands}`);

        addUserHistory(uid, prompt);

        const response = await axios.post(`http://${config.endpoint.containerService}:${config.ports.containerService}/execute`, {
            key: process.env.CONTAINER_SERVICE_KEY,
            command: commands
        });

        // Debug: Print the response from the container service
        console.log('Container service response:', response.data);

        res.status(200).json({ message: explanationPart.trim() });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});