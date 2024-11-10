class InterviewResultPreview {
    constructor({ id, interview, locale, lang, host_url = '' }) {
        this.id = id;
        this.interview = interview;
        this.locale = locale;
        this.lang = lang;
        this.host_url = host_url;
        this.createView();
    }

    createView() {
        // Create the main container
        this.$view = document.createElement('div');
        this.$view.id = 'InterviewResultPreview';
    
        // Extract data from interview object
        const metadata = this.interview.metadata || {};
        const userInfo = metadata.userInfo || {};
        const name = this.interview.name || userInfo.name || '';
        const email = userInfo.email || '';
        const startDatetimeStr = metadata.startDatetime || '';
        let formattedDate = '';
    
        // Parse and format date
        if (startDatetimeStr) {
            const startDate = new Date(startDatetimeStr);
            formattedDate = startDate.toLocaleDateString(this.locale, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
            });
        }
    
        // Labels (can be localized)
        const labels = {
            name: this.locale.get("interview_result_preview_label_name", this.lang),
            email: this.locale.get("interview_result_preview_label_email", this.lang),
            date: this.locale.get("interview_result_preview_label_date", this.lang),
            fullVideo: this.locale.get("interview_result_preview_label_full_video", this.lang)
        };
    
        // Header section
        const $headerDiv = document.createElement('div');
        $headerDiv.classList.add('header');
    
        // Info container
        const $infoDiv = document.createElement('div');
        $infoDiv.classList.add('info');
    
        // Name
        const $nameP = document.createElement('span');
        $nameP.classList.add('infoItem');
        const $nameLabelSpan = document.createElement('span');
        $nameLabelSpan.classList.add('label');
        $nameLabelSpan.textContent = `${labels.name}`;
        const $nameSpan = document.createElement('span');
        $nameSpan.classList.add('value');
        $nameSpan.textContent = name;
        $nameP.appendChild($nameLabelSpan);
        $nameP.appendChild($nameSpan);
        $infoDiv.appendChild($nameP);
    
        // Email
        const $emailP = document.createElement('span');
        $emailP.classList.add('infoItem');
        const $emailLabelSpan = document.createElement('span');
        $emailLabelSpan.classList.add('label');
        $emailLabelSpan.textContent = `${labels.email}`;
        const $emailSpan = document.createElement('span');
        $emailSpan.classList.add('value');
        $emailSpan.textContent = email;
        $emailP.appendChild($emailLabelSpan);
        $emailP.appendChild($emailSpan);
        $infoDiv.appendChild($emailP);
    
        // Date
        const $dateP = document.createElement('span');
        $dateP.classList.add('infoItem');
        const $dateLabelSpan = document.createElement('span');
        $dateLabelSpan.classList.add('label');
        $dateLabelSpan.textContent = `${labels.date}`;
        const $dateSpan = document.createElement('span');
        $dateSpan.classList.add('value');
        $dateSpan.textContent = formattedDate;
        $dateP.appendChild($dateLabelSpan);
        $dateP.appendChild($dateSpan);
        $infoDiv.appendChild($dateP);
    
        $headerDiv.appendChild($infoDiv);
        this.$view.appendChild($headerDiv);
    
        const $eventsWrapper = document.createElement('div');
        $eventsWrapper.classList.add('eventsWrapper');
        this.$view.appendChild($eventsWrapper);

        const $events = document.createElement('ul');
        $events.classList.add('events');
        $eventsWrapper.appendChild($events);
    
        // Events
        const events = metadata.events || [];
        events.forEach(event => {
            const $event = document.createElement('li');
            $event.classList.add('event');
    
            const $messageP = document.createElement('p');
            $messageP.classList.add('message');
    
            const $speakerSpan = document.createElement('span');
            $speakerSpan.classList.add('speaker', `${event.speaker}Speaker`);
            $speakerSpan.textContent = event.speaker;
    
            const $messageSpan = document.createElement('span');
            $messageSpan.classList.add('messageText', `${event.speaker}Message`);
            $messageSpan.textContent = event.message;
    
            $messageP.appendChild($speakerSpan);
            $messageP.appendChild($messageSpan);
            $event.appendChild($messageP);
    
            // Video for the event
            if (event.videoPath && event.speaker == "user") {
                const $eventVideoContainer = document.createElement('div');
                $eventVideoContainer.classList.add('eventVideoContainer');
            
                const $eventVideo = document.createElement('video');
                $eventVideo.src = this.host_url + event.videoPath;
                $eventVideo.controls = true;
                $eventVideo.autoplay = true;
                $eventVideo.style.width = '100%';
                $eventVideo.style.maxWidth = '600px';
                $eventVideoContainer.appendChild($eventVideo);
                $event.appendChild($eventVideoContainer);
    
                this.observeVideo($eventVideo);
            }
    
            $events.appendChild($event);
        });
    
        this.$view.appendChild($eventsWrapper);
    
        // Video Path All
        const videoPathAll = metadata.videoPathAll;
        if (videoPathAll) {
            const $videoContainer = document.createElement('div');
            $videoContainer.classList.add('videoAllContainer');

            const $videoAllWrapper = document.createElement('div');
            $videoAllWrapper.classList.add('videoAllWrapper');
            $videoContainer.appendChild($videoAllWrapper)
    
            // Full Interview Label
            const $fullVideoLabel = document.createElement('p');
            $fullVideoLabel.classList.add('fullVideoLabel');
            $fullVideoLabel.textContent = labels.fullVideo;
            $videoAllWrapper.appendChild($fullVideoLabel);
    
            const $videoAll = document.createElement('video');
            $videoAll.classList.add('videoAll');
            $videoAll.src = this.host_url + videoPathAll;
            $videoAll.controls = true;
            $videoAll.autoplay = true;
            $videoAll.style.width = '100%';
            $videoAll.style.maxWidth = '600px';
            $videoAllWrapper.appendChild($videoAll);
        
            this.$view.appendChild($videoContainer);
        
            this.observeVideo($videoAll);
        }
    }
    

    observeVideo(video) {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play();
                    video.muted = false;
                } else {
                    video.pause();
                }
            },
            {
                threshold: 0.5 // 50% of the video is visible
            }
        );
        observer.observe(video);
    }

    mount(selectorOrElement) {
        let container;

        // Check if the input is a string, implying a selector
        if (typeof selectorOrElement === 'string') {
            container = document.querySelector(selectorOrElement);
            if (!container) {
                console.error(`No element found with selector ${selectorOrElement}`);
                return;
            }
        } else if (selectorOrElement instanceof Element) {
            container = selectorOrElement;
        } else {
            console.error('Invalid input: selector must be a string or a DOM element');
            return;
        }
        container.appendChild(this.$view);
    }
}
