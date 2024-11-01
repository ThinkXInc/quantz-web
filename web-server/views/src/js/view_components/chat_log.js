class Message {
    constructor(type, text, lang = 'en') {
        this.type = type;
        this.text = text;
        this.lang = lang;

        // Check if the message type is valid and set the speaker based on the provided language
        if (['system', 'user', 'announce'].includes(type)) {
            this.type = type;
            this.speaker = SpeakerLocales[lang][type];
        } else {
            console.error("Unknown speaker type:", type);
            this.type = null;
            this.speaker = null;
        }
    }
}

const SpeakerLocales = {
    en: {
        user: "User",
        system: "Operator",
        announce: "*",
    },
    ja: {
        user: "ユーザー",
        system: "オペレーター",
        announce: "*",
    },
    zh: {
        user: "用户",
        system: "操作员",
        announce: "*",
    },
    es: {
        user: "Usuario",
        system: "Operador",
        announce: "*",
    },
    fr: {
        user: "Utilisateur",
        system: "Opérateur",
        announce: "*",
    },
    ar: {
        user: "المستخدم",
        system: "المشغل",
        announce: "*",
    },
    ru: {
        user: "Пользователь",
        system: "Оператор",
        announce: "*",
    }
};

const BalloonLocales = {
    en: {
        annotation: 'This system can make mistakes and may not be suitable for important issues.'
    },
    ja: {
        annotation: '誤った回答をすることもあります。重要な問題は直接ご連絡ください。'
    },
    zh: {
        annotation: '本系统可能会出错，不适用于重要事务。'
    },
    es: {
        annotation: 'Este sistema puede cometer errores y no puede ser adecuado para asuntos importantes.'
    },
    fr: {
        annotation: 'Ce système peut faire des erreurs et peut ne pas convenir pour des questions importantes.'
    },
    ar: {
        annotation: 'قد يخطئ هذا النظام وقد لا يكون مناسبًا للمسائل المهمة.'
    },
    ru: {
        annotation: 'Эта система может совершать ошибки и может быть не подходит для важных вопросов.'
    }
};


class ChatLog {
    constructor({
        annotationText,
        defaultLang = 'en',
    }) {
        this.annotationText = annotationText || BalloonLocales[defaultLang].annotation;
        this.defaultLang = defaultLang;
        this.setupView();
    }

    setupView() {
        // Main ChatLog view
        this.$view = document.createElement('div');
        this.$view.id = 'ChatLog';
        this.$view.className = 'ChatLog';

        // ChatLogMessageList
        this.$messageList = document.createElement('ul');
        this.$messageList.className = 'ChatLogMessageList';

        // ChatLogFooter
        this.$footer = document.createElement('div');
        this.$footer.className = 'ChatLogFooter';

        // ChatLogAnnotation
        this.$annotationDiv = document.createElement('div');
        this.$annotationDiv.className = 'ChatLogAnnotation';
        this.$annotationDiv.textContent = this.annotationText;
        this.$footer.appendChild(this.$annotationDiv);

        // Assemble the components
        this.$view.appendChild(this.$messageList);
        this.$view.appendChild(this.$footer);
    }

    mount($parent) {
        if (!$parent) {
            console.error('Parent element not provided for ChatLog mount.');
            return;
        }
        $parent.appendChild(this.$view);
    }

    insertMessage({ buttonId, type, text, lang }) {
        console.warn(`[ChatLog] Insert message ${text} (${lang}|${type}) for ${buttonId}`);
    
        const messageObject = new Message(type, text, lang || this.defaultLang);
    
        // Get the last list item in the message list
        const lastListItem = this.$messageList.lastElementChild;
    
        if (lastListItem && lastListItem.dataset.type === messageObject.type) {
            // Append new message text to the existing message item
            const messageContainer = lastListItem.querySelector('.messageContainer');
            const newMessage = document.createElement('p');
            newMessage.className = 'message';
            newMessage.textContent = messageObject.text;
            messageContainer.appendChild(newMessage);
        } else {
            let $messageItem = document.createElement('li');
            $messageItem.classList.add('messageItem', type);
            $messageItem.dataset.type = messageObject.type;
    
            let $speakerSpan = document.createElement('span');
            $speakerSpan.className = 'speaker';
            $speakerSpan.textContent = `${messageObject.speaker}: `;
            $messageItem.appendChild($speakerSpan);
    
            let $messageContainer = document.createElement('span');
            $messageContainer.className = 'messageContainer';
            let $message = document.createElement('p');
            $message.className = 'message';
            $message.textContent = messageObject.text;
            $messageContainer.appendChild($message);
            $messageItem.appendChild($messageContainer);
    
            // Add the new message item to the message list
            this.$messageList.appendChild($messageItem);
        }
    
        // Scroll to the bottom of the message list
        this.$messageList.scrollTop = this.$messageList.scrollHeight;
    }
}