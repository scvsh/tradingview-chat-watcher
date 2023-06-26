# TradingView Chat Watcher

TradingView Chat Watcher is a Node.js application that monitors and retrieves chat messages from a specific TradingView chatroom in real-time. It fetches the historical chat data and then listens to the chatroom's WebSocket for any new incoming messages.

## Table of Contents

- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Usage](#usage)
- [Code Explanation](#code-explanation)
- [License](#license)

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed on your system. If not, you can download Node.js and npm from here: [https://nodejs.org/](https://nodejs.org/)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/tradingview-chat-watcher.git
```

2. Navigate into the project directory
```bash
cd tradingview-chat-watcher
```

This application has three dependencies:

1. **axios**: A promise-based HTTP client that works both in the browser and in a node.js environment. It provides a single API for dealing with XMLHttpRequests and node's HTTP interface. You can install it with the command `npm install axios`.

2. **ws**: A simple to use, blazing fast, and thoroughly tested WebSocket client, server, and console for node.js, up-to-date against RFC-6455. You can install it with the command `npm install ws`.

3. **events**: This module is installed by default with Node.js, so you don't need to install it separately. It provides a mechanism to emit and handle events, which is used in the code to create an event emitter to notify when new data arrives.

You can install these dependencies individually using the `npm install {dependency-name}` command.

## Usage

The main script file is `app.js`. You can run it with the command `node app.js`. This will start the application and it will begin listening for messages in the specified TradingView chat room.




## Code Explanation

Here's a breakdown of what the script does:

### Import Required Modules

```javascript
const axios = require('axios');
const WebSocket = require('ws');
const events = require('events');
```

- `axios`: A promise-based HTTP client for making requests.
- `ws`: A WebSocket client and server for Node.js.
- `events`: An inbuilt module in Node.js to handle events.

### Set Room and Origin

```javascript
const roomId = "bitcoin_de_DE";
const origin = 'https://de.tradingview.com';
```

- `roomId`: The ID of the chatroom you want to monitor.
- `origin`: The website where the chatroom is hosted.

### Define ChatWatcher Class

```javascript
class ChatWatcher {
    // ...
}
```

This class encapsulates all the logic related to monitoring the chatroom.

### Initialize Class Variables

```javascript
constructor(roomId){
    this.roomId = roomId;
    this.data = [];
    this.onNewData = new events.EventEmitter();
    //Load & Start Listener
    this.loadChatHistoryAsync().then(this.listenChat())
}
```

- `roomId`: The ID of the chatroom to monitor.
- `data`: An array to store chat messages.
- `onNewData`: An event emitter that fires whenever a new chat message is received.

### Load Chat History

The `loadChatHistoryAsync` method sends a GET request to the TradingView API to fetch the historical chat data.

```javascript
async loadChatHistoryAsync(){
    //...
}
```

### Listen to the Chat WebSocket

The `listenChat` method creates a WebSocket connection to the TradingView server and listens for any new incoming chat messages.

```javascript
listenChat(){
    //...
}
```

### Create a ChatWatcher Instance

Finally, we create an instance of the `ChatWatcher` class and pass the ID of the chatroom we want to monitor.

```javascript
const watcher = new ChatWatcher(roomId);
watcher.onNewData.on("newData", (newMessage) => {
    if(!newMessage){
        //Initial load whole Chat
        console.log(watcher.GetChat());
    }else{
        //Only new Messages
        console.log(newMessage);
    }
});
```







