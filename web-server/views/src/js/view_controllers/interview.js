class Interview {
    constructor({
        id,
        locale,
        lang,
        interviewId,
        interviewTitle
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        //this.user = user;
        this.interviewId = interviewId;
        this.interviewTitle = interviewTitle;

        this.isInterviewEnd = false;

        this.setupView();
        this.setupSignalMonitor();
        this.setupEventListeners();
    }

    setupView(){
        const $interviewView = document.getElementById('Interview');
        this.meetingView = new MeetingView({
            locale: this.locale,
            lang: this.lang,
            meta: this.interviewMeta
        });
        this.meetingView.setupView();
        this.meetingView.mount($interviewView);
        this.meetingView.createConvexView();
    }

    setupSignalMonitor() {
        const monitorFrequencyMs = 50

        const $signalMonitor = document.getElementById('SignalMonitor')
        if($signalMonitor){
            this.signalMonitor = new SignalMonitor({ frequencyMs: monitorFrequencyMs, defaultLang: this.lang})
            this.signalMonitor.mount(document.getElementById('SignalMonitor'));
        } else {
            console.warn(`no DOM with id=SignalMonitor found.`)
        }
    }

    setupEventListeners() {
        // Start clicked
        document.addEventListener('quantz-didClickStart', (event) => {
            console.warn('start click')

            // Open ChatView
            if (!this.meetingView.isChatViewOpen()) {
                this.meetingView.openChatView();
            }

            // Show convex
            this.meetingView.showConvex();
        }) 

        // Restart clicked
        document.addEventListener('quantz-didClickRestart', (event) => {
            console.warn('restart click')
        }) 

        // Signal updated
        document.addEventListener('quantz-signalDataUpdated', (event) => {
            const { humanDecibels, humanFundamentalFrequencies, assistantDecibels } = event.detail;
            //if (!this.isInterviewEnd) {
                this.signalMonitor.update(humanDecibels, humanFundamentalFrequencies, assistantDecibels);
            //}
        })

        // Assistant Audio Signal
        document.addEventListener('quantz-assistantAudioSignal', (event) => {
            const { buttonId, spectrum, volume } = event.detail;

            this.meetingView.updateConvexScale(volume);
            this.meetingView.updateInterviewerViewTalkingEffect(volume);
        })

        // Human Audio Signal 
        document.addEventListener('quantz-humanAudioSignal', (event) => {
            const { buttonId, spectrum, volume, fundamentalFreq } = event.detail;

            this.meetingView.updateSelfViewTalkingEffect(volume);
        })

        // System/User/Annouce message received
        document.addEventListener('quantz-messageReceived', (event) => {
            const { buttonId, senderType, message } = event.detail; // senderType 'system' 'user' 'announce'
            console.log(`[Interview] new message received from ${buttonId}: [${senderType}] `, message);

            // Insert message into ChatLog
            this.meetingView.chatLog.insertMessage({
                buttonId,
                type: senderType,
                text: message,
                lang: this.lang
            });

        })

        // \CLOSE received
        document.addEventListener('quantz-closeMessageReceived', (event) => {
            console.log(`[Interview] \\CLOSE received`);
            this.isInterviewEnd = true;
        })

    }
}

class MeetingView {
    constructor({ locale, lang, meta }) {
        this.locale = locale;
        this.lang = lang;
        this.meta = meta;
    }

    setupView() {
        this.$view = document.createElement('div');
        this.$view.className = 'MeetingView';
        this.$view.id = 'MeetingView';
 
        this.createLeftView();
        this.createChatView();

        this.loadQuantzScript();
    }

    mount($parent) {
        if (!$parent) {
            console.error('Parent element not provided for Convex mount.');
            return;
        }
        $parent.appendChild(this.$view);
    }

    createMonitorView($parent) {
        const $signalMonitor = document.createElement('div');
        $signalMonitor.id = 'SignalMonitor';
        $signalMonitor.classList.add('SignalMonitor');
        $parent.appendChild($signalMonitor);
    }

    createConvexView() {
        this.convex = new Convex({id: 'convex'});
        this.convex.mount(this.$otherPersonView)
        //this.convex.startAnimating()
        //const int = setTimeout(() => {
        //    this.convex.show();
        //}, 2000)
    }

    showConvex() {
        this.convex.show();
    }

    updateConvexScale(volume) {
        //const value =  volume > -35 ? volume + 35 : 1;
        const value =  Math.max(0, volume + 35);
        this.convex.updateScale(value);
    }

    createLeftView() {
        const $leftContainer = document.createElement('div');
        $leftContainer.className = 'LeftContainer';

        const $videoContainer = document.createElement('div');
        $videoContainer.className = 'VideoContainer';
        $leftContainer.appendChild($videoContainer);

        //const $title = document.createElement('h3');
        //$title.classList.add('InterviewTitle');
        //$leftContainer.appendChild($title);

        // Another person's view
        const $otherPersonView = document.createElement('div');
        $otherPersonView.className = 'InterviewerView';
        $otherPersonView.classList.add('VideoView');
        $leftContainer.appendChild($otherPersonView);

        const $otherPersonLabel = document.createElement('div');
        $otherPersonLabel.className = 'NameLabel';
        $otherPersonLabel.textContent = 'Interviewer';  // You might want to make this dynamic
        $otherPersonView.appendChild($otherPersonLabel);
        $videoContainer.appendChild($otherPersonView);
        this.$otherPersonView = $otherPersonView;

        // Self view
        const $selfViewContainer = document.createElement('div');
        $selfViewContainer.className = 'SelfViewContainer';
        $videoContainer.appendChild($selfViewContainer);

        const $selfView = document.createElement('video');
        $selfView.className = 'SelfView VideoView';
        $selfView.autoplay = true;
        $selfView.muted = true;
        $selfViewContainer.appendChild($selfView);

        const $selfViewLabel = document.createElement('div');
        $selfViewLabel.className = 'NameLabel';
        $selfViewLabel.textContent = 'Self';  // Dynamic name possible
        $selfViewContainer.appendChild($selfViewLabel);

        this.$selfViewContainer = $selfViewContainer;
        this.$selfView = $selfView;
        this.createMonitorView($leftContainer);

        const $quantzButtonLoader = document.createElement('div');
        $quantzButtonLoader.className = 'QBTN-button-loader';
        $quantzButtonLoader.setAttribute('data-button-key', 'QBTN-');
        $quantzButtonLoader.setAttribute('data-publisher-id', '6689ea61a69d7236505271d8');
        $quantzButtonLoader.setAttribute('data-quantz-config', JSON.stringify({
            buttonType: "C",
            iconSize: 30,
            fontSize: 13,
            buttonWidth: 260,
            buttonHeight: 50,
            buttonColor: "#2b2b2b",
            borderRadius: 20,
            displayLocale: true,
            balloonRectWidth: "17vw",
            balloonRectHeight: "30vh",
            defaultLang: "en"
        }));
        $selfViewContainer.appendChild($quantzButtonLoader);

                // Add event listener to Quantz button loader to play sound on click
                //let lock = false;
                //const audio = new Audio('https://quantz.thinkxinc.com/js/areyouready.wav');
                //$quantzButtonLoader.addEventListener('click', () => {
                //    if (!lock) {
                //        audio.play();
                //        lock = true;
                //    }
                //});

        navigator.mediaDevices.getUserMedia({ video: false})//true })
            .then(stream => {
                $selfView.srcObject = stream;
            })
            .catch(err => {
                console.error('Failed to get video stream: ', err);
            });

        this.$view.appendChild($leftContainer);
    }


    loadQuantzScript() {
        const script = document.createElement('script');
        script.src = "https://quantz.thinkxinc.com/js/dist/quantz-button-v7-dev.js";
        document.body.appendChild(script);
    }

    createChatView() {
        const $chatView = document.createElement('div');
        $chatView.className = 'ChatView';
        $chatView.id = 'ChatView';
        this.$view.appendChild($chatView);

        // Initialize ChatLog and mount it to the ChatView
        this.chatLog = new ChatLog({
            defaultLang: this.lang
        });
        this.chatLog.mount($chatView);
    }

    openChatView() {
        this.$view.classList.add('openChatView');
    }

    isChatViewOpen() {
        return this.$view.classList.contains('openChatView');
    }

    updateSelfViewTalkingEffect(volume) {
        this.updateTalkingEffect(this.$selfView, volume);
    }

    updateInterviewerViewTalkingEffect(volume) {
        this.updateTalkingEffect(this.$otherPersonView, volume);
    }

    updateTalkingEffect($elem, volume) {
        // Calculate shadow
        const normalizedVolume = volume + 35;
        const positiveVolume = Math.max(0, normalizedVolume);
        const scaleFactor = 2; // More aggressive scaling
        const volumeRatio = (positiveVolume / 35) / scaleFactor;
        const maxShadowOpacity = 1;  // Full opacity
        const maxShadowSize = 50;    // Larger shadow size

        const shadowOpacity = Math.min(maxShadowOpacity, volumeRatio);
        const shadowSize = Math.min(maxShadowSize, volumeRatio);
        $elem.style.boxShadow = `0 0 10px ${shadowSize}px rgba(255, 255, 255, ${shadowOpacity})`;
        console.warn(`Volume: ${volume}, Normalized Volume: ${normalizedVolume}, Volume Ratio: ${volumeRatio}, Shadow Size: ${shadowSize}px, Opacity: ${shadowOpacity}`);
    }
}

