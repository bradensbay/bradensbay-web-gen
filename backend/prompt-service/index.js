const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = config.ports.promptService;

const systemMessagePath = path.join(__dirname, 'system_message.txt');
let systemMessage = fs.readFileSync(systemMessagePath, 'utf8');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(cors({
    origin: 'https://prompt.bradensbay.com', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
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


        console.log(`Completion content: ${completionContent}`);

        const delimiterRegex = /\*\*Expl[ai]nation:\*\*/i;
        const splitContent = completionContent.split(delimiterRegex);

        if (!commandsPart || !explanationPart) {
            throw new Error("Invalid response format from OpenAI API. Missing 'Explanation:' delimiter.");
        }

        const [commandsPart, explanationPart] = splitContent;

        
        let commands = commandsPart
            .replace(/someusername/g, username)
            .replace(/userpassword/g, contPwd)
            .replace(/```bash\s*/gi, '')
            .replace(/```/g, '');       

        const safeCommands = commands.replace(/'/g, `'\\''`);
        commands = `lxc exec ${uid} -- bash -c '${safeCommands}'`;

        
        console.log(`Sending commands to container service: ${commands}`);

        addUserHistory(uid, prompt);

        const response = await axios.post(`http://${config.endpoint.containerService}:${config.ports.containerService}/execute`, {
            key: process.env.CONTAINER_SERVICE_KEY,
            command: commands
        });

        
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