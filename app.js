//npm install axios ws
const axios = require('axios');
const WebSocket = require('ws');
const events = require('events');


const roomId = "bitcoin_de_DE";
const origin = 'https://de.tradingview.com';

class ChatWatcher{
    data;
    onNewData;
    roomId;
    
    constructor(roomId){
        this.roomId = roomId;
        this.data = [];
        this.onNewData = new events.EventEmitter();
        //Load & Start Listener
        this.loadChatHistoryAsync().then(this.listenChat())
    }

    //Get ChatMessage Array sorted by Time
    GetChat(){
        return this.data.sort(function(a,b){
            return new Date(a.time) - new Date(b.time);
        });
    }

    //Load Dump of Chat
    async loadChatHistoryAsync(){
        try {
            const httpUrl = `${origin}/conversation-status/?_rand=0.9369182066244344&offset=0&room_id=${this.roomId}&stat_interval=&stat_symbol=&is_private=`;
            const response = await axios.get(httpUrl);
            this.data = response.data["messages"];
            this.onNewData.emit("newData");
        } catch (error) {
            console.error('Fehler beim Abrufen der Daten:', error.message);
        }
    }

    //Listen to the Chat-Websocket
    listenChat(){
        const ws = new WebSocket('wss://pushstream.tradingview.com/message-pipe-ws/public/chat', {
            headers: {
                origin: origin // Origin is required e.g 403
            },
        });

        ws.on('open', () => {
            console.log('Listen to Chat.');
        });
    
        ws.on('message', message => {
            //parse message
            const parsedMessage = JSON.parse(message);
            if (parsedMessage && parsedMessage.text) {
                //check if right channel
                if(parsedMessage.text.channel == "chat_" + this.roomId){
                    //Get only content to Data
                    const chatMsg = parsedMessage.text.content.data;
                    this.data.push(chatMsg);
                    //Emit new Data Event
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

const watcher = new ChatWatcher(roomId);
watcher.onNewData.on("newData", (newMessage) => {
    if(!newMessage){
        //Initial load whole Chat
        console.log(watcher.GetChat());
    }else{
        //Only new Messages
        console.log(newMessage);
    }
})