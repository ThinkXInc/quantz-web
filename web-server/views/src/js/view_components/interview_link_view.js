class InterviewLinkView {
    constructor({
        id,
        interviewId,
        locale,
        lang
    }) {
        this.id = id;
        this.interviewId = interviewId;
        this.locale = locale;
        this.lang = lang;

        this.setupView();
    }

    setupView() {
        this.$view = document.createElement('div');
        this.$view.id = this.id;
        this.$view.classList.add('InterviewLinkView');

        const $urlViewPre = document.createElement('pre');
        $urlViewPre.classList.add('UrlViewPre');

        const $url = document.createElement('code');
        $url.id = 'InterviewUrl';
        $url.textContent = `https://quantz.thinkxinc.com/v1/en/interviews/${this.interviewId}`;
        $url.classList.add('language-javascript');

        const $copyButton = document.createElement('img');
        $copyButton.src = '/img/copy-icon.svg';
        $copyButton.classList.add('CopyButton');

        const $toolTip = document.createElement('span');
        $toolTip.classList.add('tooltip');
        $toolTip.textContent = this.locale.get("interview_create_url_copy_tooltip", this.lang);

        $copyButton.addEventListener('mouseenter', () => {
            $toolTip.classList.add('visible');
            $toolTip.classList.remove('fade-out');
        });

        $copyButton.addEventListener('mouseleave', () => {
            $toolTip.classList.add('fade-out');
        });

        $copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText($url.textContent).then(() => {
                $toolTip.textContent = this.locale.get("interview_create_url_copy_done_tooltip", this.lang);
                $toolTip.classList.add('copied');
                setTimeout(() => {
                    $toolTip.classList.add('fade-out');
                    setTimeout(() => {
                        $toolTip.classList.remove('visible', 'fade-out', 'copied');
                        $toolTip.textContent = this.locale.get("interview_create_url_copy_tooltip", this.lang);
                    }, 1000);
                }, 2000);
            }, err => {
                console.error('Failed to copy text: ', err);
            });
        });

        $urlViewPre.appendChild($url);
        $urlViewPre.appendChild($copyButton);
        $urlViewPre.appendChild($toolTip);
        this.$view.appendChild($urlViewPre);
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
