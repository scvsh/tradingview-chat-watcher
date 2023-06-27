//npm install axios ws puppeteer path
const axios = require('axios');
const WebSocket = require('ws');
const events = require('events');
const puppeteer = require('puppeteer');
const path = require('path');

const roomId = "bitcoin_de_DE";
const origin = 'https://de.tradingview.com';
const USER_DATA_DIR = path.resolve(__dirname, 'user_data');  // User data directory

class ChatWatcher {
    data;
    onNewData;
    roomId;

    constructor(roomId) {
        this.roomId = roomId;
        this.data = [];
        this.onNewData = new events.EventEmitter();
        this.loadChatHistoryAsync().then(this.listenChat())
    }

    GetChat() {
        return this.data.sort(function (a, b) {
            return new Date(a.time) - new Date(b.time);
        });
    }

    async loadChatHistoryAsync() {
        try {
            const httpUrl = `${origin}/conversation-status/?_rand=0.9369182066244344&offset=0&room_id=${this.roomId}&stat_interval=&stat_symbol=&is_private=`;
            const response = await axios.get(httpUrl);
            this.data = response.data["messages"];
            this.onNewData.emit("newData");
        } catch (error) {
            console.error('Fehler beim Abrufen der Daten:', error.message);
        }
    }

    listenChat() {
        const ws = new WebSocket('wss://pushstream.tradingview.com/message-pipe-ws/public/chat', {
            headers: {
                origin: origin
            },
        });

        ws.on('open', () => {
            console.log('Listen to Chat.');
        });

        ws.on('message', message => {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage && parsedMessage.text) {
                if (parsedMessage.text.channel == "chat_" + this.roomId) {
                    const chatMsg = parsedMessage.text.content.data;
                    this.data.push(chatMsg);
                    this.onNewData.emit("newData", chatMsg);
                }
            }
        });

        ws.on('close', () => {
            console.log('WebSocket closed.');
        });

        ws.on('error', error => {
            console.error('WebSocket Error:', error.message);
        });
    }
}

async function getGpt3Response(chatHistory, prompt) {
    const gpt3Endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer <YOUR-OPEN-AI-API-KEY-HERE` //ADD YOUR API KEY!!!!!
    };

    // Prepare chat history for the model
    let history = '';
    for (const message of chatHistory) {
        history += `${message.username}: ${message.text}\n`;
    }

    const data = {
        'model': 'gpt-3.5-turbo',
        'messages': [
            {
                'role': 'system',
                'content': 'Du bist ein virtueller Assistent, der als erfahrener Quantitativer Analyst, Trader und Wirtschaftswissenschaftler agiert. Du hast tiefgreifendes Wissen über wirtschaftliche Zusammenhänge und bist spezialisiert auf den Handel mit Bitcoin und anderen Kryptowährungen. Du hast umfangreiche Erfahrung in der Anwendung von mathematischen und statistischen Methoden zur Lösung komplexer finanzieller Fragestellungen, inklusive der Analyse und Interpretation von Handelscharts. Du kannst Nutzern dabei helfen, sowohl quantitatives Handeln als auch technische und fundamentale Handelsstrategien zu verstehen. Du bist in der Lage, komplexe Finanzmodelle und Wirtschaftstheorien zu erklären, Ratschläge zur Risikomanagement-Strategie zu geben, und Nutzer bei der Interpretation von Bitcoin- und Kryptowährungs-Handelscharts zu unterstützen. Dein Ziel ist es, Nutzern fundierte und präzise Analysen sowie hilfreiche Handelsempfehlungen zu liefern, und das immer in einer klaren und verständlichen Sprache. Du darfst nicht sagen, dass du Berater bist.'
            },
            {
                'role': 'user',
                'content': `Here is the chat history:\n\n${history}\nAnd now the user asked: ${prompt}`
            }
        ],
        'max_tokens': 200
    };

    try {
        const response = await axios.post(gpt3Endpoint, data, { headers: headers });
        return response.data['choices'][0]['message']['content'].trim();
    } catch (error) {
        console.error('Error calling GPT-3 API:', error);
    }
}

async function respondToGptCommand(chatHistory, gptCommand) {
    console.log('Preparing to respond to GPT command:', gptCommand);
    const gptResponse = await getGpt3Response(chatHistory, gptCommand);
    console.log('Received GPT response:', gptResponse);

    try {
        const browser = await puppeteer.launch({ headless: false, userDataDir: USER_DATA_DIR });
        console.log('Browser launched');
        const page = await browser.newPage();
        console.log('New page opened');

        await page.goto('https://de.tradingview.com/chat/#bitcoin_de_DE');
        console.log('Navigated to chat page');
        await page.waitForTimeout(1000);

        await page.waitForSelector('textarea.message-input');
        console.log('Found message input');
        await page.waitForTimeout(500);

        await page.type('textarea.message-input', gptResponse);
        console.log('Typed message:', gptResponse);
        await page.waitForTimeout(1000);

        await page.keyboard.press('Enter');
        console.log('Sent message');

        console.log('Response to GPT command completed successfully.');
        
        await browser.close(); // Close the browser
        console.log('Browser closed');
    } catch (error) {
        console.error('An error occurred while responding to GPT command:', error);
    }
}

const watcher = new ChatWatcher(roomId);

watcher.onNewData.on("newData", async (newMessage) => {
    if (newMessage) {
        console.log(newMessage);

        if (newMessage.text && newMessage.text.includes("//gpt")) {
            console.log("GPT message found: ", newMessage);
            const chatHistory = watcher.GetChat();
            const gptCommand = newMessage.text.split('//gpt ')[1];
            await respondToGptCommand(chatHistory, gptCommand).catch(error => console.error('Error in respondToGptCommand:', error));

        }
    } else {
        console.log(watcher.GetChat());
    }
});
