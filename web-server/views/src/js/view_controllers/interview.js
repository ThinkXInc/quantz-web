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

        this.setupView();
    }

    setupView(){
        const meetingView = new MeetingView({
            locale: this.locale,
            lang: this.lang,
            meta: this.interviewMeta
        });
        meetingView.setupView();
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
 
        this.createVideoViews();
        this.createChatView();

        document.body.appendChild(this.$view);
        this.loadQuantzScript();
    }

    createVideoViews() {
        const $videoContainer = document.createElement('div');
        $videoContainer.className = 'VideoContainer';

        //const $title = document.createElement('h3');
        //$title.classList.add('InterviewTitle');
        //$videoContainer.appendChild($title);

        // Another person's view
        const $otherPersonView = document.createElement('div');
        $otherPersonView.className = 'OtherPersonView';
        $otherPersonView.classList.add('VideoView');
        $videoContainer.appendChild($otherPersonView);

        const $otherPersonLabel = document.createElement('div');
        $otherPersonLabel.className = 'NameLabel';
        $otherPersonLabel.textContent = 'Interviewer';  // You might want to make this dynamic
        $otherPersonView.appendChild($otherPersonLabel);
        $videoContainer.appendChild($otherPersonView);

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
        $selfView.appendChild($selfViewLabel);

        const $quantzButtonLoader = document.createElement('div');
        $quantzButtonLoader.className = 'QBTN-button-loader';
        $quantzButtonLoader.setAttribute('data-button-key', 'QBTN-');
        $quantzButtonLoader.setAttribute('data-publisher-id', '6689ea61a69d7236505271d8');
        $quantzButtonLoader.setAttribute('data-quantz-config', JSON.stringify({
            buttonType: "B",
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

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                $selfView.srcObject = stream;
            })
            .catch(err => {
                console.error('Failed to get video stream: ', err);
            });

        this.$view.appendChild($videoContainer);
    }


    loadQuantzScript() {
        const script = document.createElement('script');
        script.src = "https://quantz.thinkxinc.com/js/dist/quantz-button-v7-dev.js";
        document.body.appendChild(script);
    }

    createChatView() {
        const $chatView = document.createElement('div');
        $chatView.className = 'ChatView';
        this.$view.appendChild($chatView);
    }
}

