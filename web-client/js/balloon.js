(function(ns) {
    ns.SenderType = {
        SYSTEM: 'system',
        USER: 'user',
        ANNOUNCE: 'announce'
    };

    ns.Message = class {
        constructor(type, text, lang = 'en') {
            this.type = type;
            this.text = text;
            this.lang = lang;

            // Check if the message type is valid and set the speaker based on the provided language
            if (Object.values(ns.SenderType).includes(type)) {
                this.type = type;
                this.speaker = ns.SpeakerLocales[lang][type];
            } else {
                console.error("Unknown speaker type:", type);
                this.type = null;
                this.speaker = null;
            }
        }
    }

    ns.Balloon = class {
        constructor({
            buttonId,
            containerId,
            defaultLang,
            buttonType
        }) {
            this.buttonId = buttonId;
            this.containerId = containerId;
            this.lang = defaultLang;
            this.buttonType = buttonType;
            this.initialize({buttonId: buttonId});
            this.close();
        }

        initialize({buttonId}) {
            this.container = document.getElementById(this.containerId);  // prefix already set
            this.prefix = ns.configs[buttonId].prefix;

            if (!this.container) {
                console.error(`Container with ID ${this.containerId} does not exist.`);
                return;
            }

            this.balloonElement = document.createElement('div');
            this.balloonElement.id = ns.configs[buttonId].balloonId;
            this.balloonElement.classList.add(ns.configs[buttonId].prefix + 'balloon-container');
            this.balloonElement.classList.add(`QBTN-TYPE-${this.buttonType}`)

            // Balloon rectangle
            let balloonRect = document.createElement('div');
            balloonRect.className = ns.configs[buttonId].prefix + 'balloon-rect';

            // Balloon leg
            let balloonLeg = document.createElement('img');
            balloonLeg.src = ns.configs[buttonId].balloonLegImgSrc;
            balloonLeg.srcset = ns.configs[buttonId].balloonLegImgSrcset;
            balloonLeg.className = ns.configs[buttonId].prefix + 'balloon-leg';

            // Text element
            let dialogue = document.createElement('ul');
            dialogue.id = ns.configs[buttonId].balloonDialogueId;
            dialogue.className = ns.configs[buttonId].prefix + 'dialogue';
            this.dialogue = dialogue; // Store for updating

            // Logo
            let logo = document.createElement('img');
            logo.src = ns.configs[buttonId].balloonPowerdByImageSrc;
            logo.className = ns.configs[buttonId].prefix + 'poweredby';
        
            // Annotation text
            let annotationText = document.createElement('div');
            annotationText.className = ns.configs[buttonId].prefix + 'annotation';
            annotationText.textContent = ns.BalloonLocales[this.lang]['annotation'];
            this.annotationText = annotationText;

            balloonRect.appendChild(balloonLeg);
            balloonRect.appendChild(dialogue);
            balloonRect.appendChild(logo);
            balloonRect.appendChild(annotationText);
            this.balloonElement.appendChild(balloonRect);
            this.container.appendChild(this.balloonElement);

            // Test
            //this.insertTestMessages();
        }

        insertMessage({buttonId, type, text, lang}) {
            console.log(`[Balloon] Insert message ${text} (${lang}|${type}) for ${buttonId} to dialogue`)
            const balloonDialogueId = ns.configs[buttonId].balloonDialogueId;
            const dialogue = document.getElementById(balloonDialogueId);
            if (!dialogue) {
                console.error(`[Balloon] balloon dialogue with ID '${balloonDialogueId}' not found.`);
                throw new Error(`[Balloon] balloon dialogue with ID '${balloonDialogueId}' not found.`);
            }
            
            const lastListItem = dialogue.lastElementChild;
            const messageObject = new ns.Message(type, text, lang);
            if (lastListItem && lastListItem.dataset.type === messageObject.type) {
                // Append message to lastListItem
                let messageContainer = lastListItem.querySelector(`.${ns.configs[buttonId].prefix + 'messageContainer'}`);
                const newMessage = document.createElement('p');
                newMessage.className = ns.configs[buttonId].prefix + 'message';
                newMessage.textContent = messageObject.text;
                messageContainer.appendChild(newMessage);
            } else {
                // Create the outer span for the speaker type
                let turn = document.createElement('li');
                turn.classList.add(ns.configs[buttonId].prefix + 'turn');
                turn.classList.add(ns.configs[buttonId].prefix + messageObject.type);
                turn.dataset.type = messageObject.type;

                // Create the speaker span
                let speaker = document.createElement('span');
                speaker.className = ns.configs[buttonId].prefix + 'speaker';
                speaker.textContent = `${messageObject.speaker}`;
            
                let messageContainer = document.createElement('span');
                messageContainer.className = ns.configs[buttonId].prefix + 'messageContainer';

                // Create the message paragraph
                let message = document.createElement('p');
                message.className = ns.configs[buttonId].prefix + 'message';
                message.textContent = messageObject.text;

                turn.appendChild(speaker);
                messageContainer.appendChild(message);
                turn.appendChild(messageContainer);
                dialogue.appendChild(turn);
            }

            // Scroll to the bottom of the dialogue
            dialogue.scrollTop = dialogue.scrollHeight;
        }

        insertTestMessages() {
            const testMessages = [
                new ns.Message('user', 'Hello', 'en'),
                new ns.Message('system', 'Hi, my name is James. I\'m here to assist you with your Toyota-related inquiries. How may I help you today?', 'en'),
                new ns.Message('user', 'Hi James, I\'m interested in the Pryos range and actually I don\'t know the difference between the Pryos and the Pryos Prime. Could you please clarify the difference briefly?', 'en'),
                new ns.Message('system', 'Sure thing! The Pryos and Pryos Prime are both subcompact SUVs, but the main difference is the Prime version comes with a more powerful engine and additional features like heated seats, blind-spot monitoring, and a premium audio system.', 'en'),
                new ns.Message('user', 'Okay that\'s great thanks I understand.', 'en'),
                new ns.Message('system', 'You\'re welcome! Do you have any other questions or would you like to schedule a test drive?', 'en'),
                new ns.Message('user', 'Actually, currently I have a Toyota Corolla, I guess I bought it about five years ago, and I\'m really, I\'m mostly curious to see if there\'s going to be any financial benefit to, compared to the Corolla that I have now.', 'en'),
                new ns.Message('system', 'Sure thing! The Pryos and Pryos Prime both have a great reputation for reliability and fuel efficiency. Compared to the Corolla, the Pryos has a slightly larger cargo space and better ground clearance. However, the Corolla might have a slightly lower price point.', 'en'),
                new ns.Message('user', 'Okay, that\'s great. That\'s perfect. So I\'m going to go and visit the local Toyota dealership then. Thank you very much.', 'en'),
                new ns.Message('system', 'You\'re welcome! I hope you find the perfect vehicle for your needs. Please let me know if you have any other questions or if there\'s anything else I can assist you with.', 'en'),
                new ns.Message('announce', 'Reached to limit. Close conversation.', 'en'),
            ];

            testMessages.forEach(message => this.insertMessage({buttonId: this.buttonId, type: message.type, text: message.text, lang: message.lang}));
        }

        changeLanguage(lang) {
            this.lang = lang;
            const annotationLocale = ns.BalloonLocales[this.lang]['annotation'];
            this.annotationText = annotationLocale;
        }

        show() {
            this.balloonElement.classList.remove(this.prefix + 'close');
            this.balloonElement.classList.remove(this.prefix + 'close-by-scale');
            this.balloonElement.classList.add(this.prefix + 'show');
        }

        showByScale() {
            this.balloonElement.classList.remove(this.prefix + 'close');
            this.balloonElement.classList.remove(this.prefix + 'close-by-scale');
            this.balloonElement.classList.add(this.prefix + 'show-by-scale');
        }

        close() {
            this.balloonElement.classList.remove(this.prefix + 'show');
            this.balloonElement.classList.remove(this.prefix + 'show-by-scale');
            this.balloonElement.classList.add(this.prefix + 'close');
        }
    }
})(Quantz); 