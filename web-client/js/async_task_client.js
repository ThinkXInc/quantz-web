// Global constants
const END_OF_MESSAGE = '\\END';
const endOfMessageBytes = new TextEncoder().encode(END_OF_MESSAGE);
const HOST = 'quantz.thinkxinc.com:8001'

const MessageType = Object.freeze({
    HEALTH_CHECK: 0,
    TEXT_MESSAGE: 1,
    WAV_STREAM: 2
});

class RequestData {
    constructor(task, message, materialId, session, lang) {
        this.task = task;
        this.message = message;
        this.materialId = materialId;
        this.session = session;
        this.lang = lang;
    }

    toJson() {
        return JSON.stringify({
            task: this.task,
            message: this.message,
            materialId: materialId,
            session: this.session,
            lang: this.lang
        });
    }
}

function removeEndDelimiter(text) {
    if (text.includes(END_OF_MESSAGE)) {
        console.log('\\END delimiter received.');
        return text.replace(END_OF_MESSAGE, '');
    }
    return text;
}

const taskHandlers = {
    'title_keywords': (messageObject) => {
        console.log('Handling title_keywords:', messageObject);
        let title = removeEndDelimiter(messageObject["title"]);
        let keywords = removeEndDelimiter(messageObject["keywords"]);
        document.getElementById('title').textContent = title;
        document.getElementById('keywords').textContent = keywords;
    },
    'sample_answer': (messageObject) => {
        console.log('Handling sample_answer:', messageObject);
        let sampleAnswer = removeEndDelimiter(messageObject["sample_answer"]);
        document.getElementById('sampleAnswer').textContent = sampleAnswer;
    },
    'review': (messageObject) => {
        console.log('Handling review:', messageObject);
        let review = removeEndDelimiter(messageObject["review"]);
        document.getElementById('review').textContent = review;
    },
};


class Selector {
    constructor(elementId, selectorData, defaultValue) {
        this.elementId = elementId;
        this.selectorData = selectorData;
        this.value = defaultValue;

        // Check element exist
        const element = document.getElementById(this.elementId);
        if (!element) {
            throw new Error(`Element with id '${this.elementId}' does not exist.`);
        }

        // Check selector data
        if (typeof this.selectorData !== 'object' || this.selectorData === null) {
            throw new Error('selectorData must be an object');
        }

        for (const [code, names] of Object.entries(this.selectorData)) {
            if (!Array.isArray(names) || names.length === 0) {
                throw new Error(`Invalid format for selectorData entry '${code}': Each entry should be an array of strings.`);
            }
        }

        this.setupSelector()
    }


    setupSelector() {
        const select = document.getElementById(this.elementId);
        select.innerHTML = '';  // Clear existing options if any.
        for (const [code, names] of Object.entries(this.selectorData)) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = names[0];
            if (this.value === code) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        select.addEventListener('change', (event) => {
            this.value = event.target.value;
            console.log("Selected value updated to:", this.value);
        });
    }

    getValue() {
        console.log("Current value:", this.value);
        return this.value;
    }
}


class AsyncTaskClient {
    constructor() {
        this.socket = null; // WebSocket instance
        this.lang = "en"; // Default language
    }

     async initialize() {
        await this.obtainToken();
        this.initializeWebSocket();
    }

    async obtainToken() {
        try {
            let origin = window.location.origin;
            let response = await fetch(`https://${HOST}/stream/api/request-token`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ origin })
            });

            if (!response.ok) {
                throw new Error('Token request was denied. Status: ' + response.status);
            }

            return await response.text();
        } catch (error) {
            console.error('Error obtaining token:', error);
            return null;
        }
    }

    initializeWebSocket() {
        this.obtainToken().then((token) => {
            if (!token) return;

            const serverUrl = `wss://${HOST}/stream/ws?token=${encodeURIComponent(token)}`;
            this.socket = new WebSocket(serverUrl);
            this.socket.onopen = () => console.log("Connection to server opened.");
            this.socket.onerror = (e) => console.error("[Error] An error occurred with the WebSocket:", e);
            this.socket.onmessage = (e) => this.handleWebSocketMessage(e);
            this.socket.onclose = (e) => {
                if (e.wasClean) {
                    console.log(`Connection closed cleanly, code=${e.code}, reason=${e.reason}`);
                } else {
                    console.log('Connection died', `Close event code: ${e.code}, reason: ${e.reason}`);
                }
            };
        }).catch((e) => {
            console.error("Error initializing WebSocket:", e);
        });
    }

    submit(message) {
        // serialized JSON string using the WebSocket,
        // the server will recognize it as a text message (websocket.TextMessage).  
        if (typeof message !== 'string') {
            message = JSON.stringify(message);  // Serialize if the message is not a string.
        }
    
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);  // Send a text message.
            console.log("Text message sent to server.");
            console.log(message);
        } else {
            console.error("WebSocket is not open. ReadyState:", this.socket.readyState);
        }
    }

    handleWebSocketMessage(e) {
        if (e.data instanceof Blob) {
            e.data.arrayBuffer().then(arrayBuffer => {
                let uint8Array = new Uint8Array(arrayBuffer);
                let messageString = new TextDecoder().decode(uint8Array);
                console.log(`received: ${messageString}`)

                // Try to parse the message as JSON
                try {
                    let messageObject = JSON.parse(messageString);

                    // Use the taskHandlers map to process the message
                    if (messageObject.task && taskHandlers[messageObject.task]) {
                        taskHandlers[messageObject.task](messageObject);
                    } else {
                        console.error(`No handler found for task: ${messageObject.task}`);
                    }
                } catch (error) {
                    // If JSON.parse() fails, assume it's a different message format
                    if (messageString === END_OF_MESSAGE || messageString === '\\NEXT') {
                        console.log(`Marker received: ${messageString}`);
                    } else {
                        console.error(`Unknown message type: ${messageString}`);
                    }
                }
            });
        }
    }
}