document.addEventListener('DOMContentLoaded', () => {
    const lang = window.lang;
    const locale = window.locale;

    console.log(`set up InterviewTop view.\nlang:${lang}`);

    // initialize top view
    const top = new InterviewTop({
        locale: locale,
        lang: lang
    });
});


class InterviewTop {
    constructor({
        locale,
        lang
    }) {
        this.locale = locale;
        this.lang = lang;
        this.currentStep = 1;
        this.currentKey = 'recruiting';

        // technology: chart
        this.showChart();

        // needs
        this.initNeedsSection();
        this.updateMailTexts();

        // steps
        this.stepHeads = document.querySelectorAll('#steps .step-head');
        this.stepContents = document.querySelectorAll('#steps .step');
        this.bar = document.querySelector('#steps .indicator .bar');
        this.stepsElement = document.getElementById('steps');
        this.stepThresholds = [
            0,    // Step 1 starts at 0px from stepsElement offsetTop
            500,  // Step 2 starts at 500px
            1000, // Step 3 starts at 1000px
            1500  // Step 4 starts at 1500px
        ];
        //this.initSteps();
        //this.initScrollListener();


        const defaultInterviewRecruiting = {
            "title": "Recruiting Interview",
            "introduction": "Hello, {name}. Are you ready?",
            "end": "Thank you {name}. This is the end. Goodbye.",
            "steps": [
                {
                    "question": "Could you briefly introduce yourself?",
                    "finish_condition": "Interviewee answered that they've finished.",
                    "instructions": [
                        "First, read the question.",
                        "Ask if it's okay to stop at this good point."
                    ],
                    "max_turns": 3,
                },
                //{
                //    "question": "Why are you interested in this position, and how do you think your skills align with the role?",
                //    "finish_condition": "Interviewee answered that they've finished.",
                //    "instructions": [
                //        "First, read the question.",
                //        "Ask if it's okay to stop at this good point."
                //    ],
                //    "max_turns": 3,
                //}
            ]
        }

        this.interviewCreateView = new InterviewCreateView({
            id: "InterviewCreateView",
            locale: this.locale,
            lang: this.lang,
            user: null,
            interviewId: null,
            interview: defaultInterviewRecruiting,
            $message: "CreateInterviewDemoMessage",
            onInterviewCreated: ()=> {

            },
            maxSteps: 3
        })
        console.error(this.interviewCreateView);
        console.error(document.getElementById('CreateInterviewDemo'))
        this.interviewCreateView.mount(document.getElementById('CreateInterviewDemo'))
 
        // 4. result
        this.$smartphone = document.getElementById('smartphone');
        this.$smartphone.innerHTML = this.smartphoneSvg();
        this.startSmartphoneAnimation()

        this.$laptop = document.getElementById('laptop');
        this.$laptop.innerHTML = this.laptopSvg();
        this.startLaptopAnimation();
    }

    showChart() {
        console.log(`[InterviewTop] show chart`);
        const chart = document.getElementById('chart');
        chart.classList.add('show');
    }

    initNeedsSection() {
        console.log(`[InterviewTop] init needs section`);

        const parts = document.querySelectorAll('#needs .part');
    
        parts.forEach(part => {
            part.addEventListener('click', () => {
                parts.forEach(p => p.classList.remove('highlight'));
                part.classList.add('highlight');
    
                // Get the key from the class list
                if (part.classList.contains('recruiting')) {
                    this.currentKey = 'recruiting';
                } else if (part.classList.contains('reporting')) {
                    this.currentKey = 'reporting';
                } else if (part.classList.contains('sales')) {
                    this.currentKey = 'sales';
                }
                // Update the mail texts
                this.updateMailTexts();
            });
        });
    
    }


    initSteps() {
        // Initially show the first step
        this.showStep(1);
    }

    initScrollListener() {
        window.addEventListener('scroll', () => this.onScroll());
    }

    onScroll() {
        const scrollTop = window.scrollY || window.pageYOffset;
        const stepsOffsetTop = this.stepsElement.offsetTop;
        const scrollPosition = scrollTop - stepsOffsetTop;

        // Determine current step based on scrollPosition and thresholds
        let newStep = 1;
        for (let i = 0; i < this.stepThresholds.length; i++) {
            if (scrollPosition >= this.stepThresholds[i]) {
                newStep = i + 1;
            }
        }

        if (newStep !== this.currentStep) {
            this.showStep(newStep);
        }

        // Update progress bar
        const totalThreshold = this.stepThresholds[this.stepThresholds.length - 1];
        let progress = (scrollPosition / totalThreshold) * 100;
        progress = Math.min(Math.max(progress, 0), 100);
        this.bar.style.width = `${progress}%`;
    }

    showStep(stepNumber) {
        this.currentStep = stepNumber;

        // Update step contents
        this.stepContents.forEach((stepContent, index) => {
            if (index === stepNumber - 1) {
                stepContent.classList.add('show');
            } else {
                stepContent.classList.remove('show');
            }
        });

        // Update step-head highlights
        this.stepHeads.forEach((stepHead, index) => {
            if (index === stepNumber - 1) {
                stepHead.classList.add('highlight');
            } else {
                stepHead.classList.remove('highlight');
            }
        });
    }

    updateMailTexts() {
        const key = this.currentKey;
        const lang = this.lang;
        const locale = this.locale;
    
        console.log(`[updateMailTexts] Current key: ${key}, Language: ${lang}`);

        const $mail = document.getElementById('mail');
    
        // Build the keys
        const recepientKey = `interview_top_steps_step3_mail_${key}_recepient`;
        const titleKey = `interview_top_steps_step3_mail_${key}_title`;
        const textKey = `interview_top_steps_step3_mail_${key}_text`;
        const linkKey = `interview_top_steps_step3_mail_${key}_link`;
    
        console.log(`[updateMailTexts] Generated keys:`, { recepientKey, titleKey, textKey, linkKey });
    
        // Get the texts
        const recepientText = locale.get(recepientKey, lang);
        const titleText = locale.get(titleKey, lang);
        const text = locale.get(textKey, lang);
        const link = locale.get(linkKey, lang);
    
        console.log(`[updateMailTexts] Resolved texts:`, { recepientText, titleText, text, link });
    
        if (!recepientText || !titleText || !text || !link) {
            console.error(`[updateMailTexts] Missing text data. Please check locale keys.`);
            return;
        }
    
        // Get the elements
        const mailRecepientElement = $mail.querySelector('.mail-recepient');
        const mailTitleElement = $mail.querySelector('.mail-title');
        const mailTextElement = $mail.querySelector('.mail-text');
    
        if (!mailRecepientElement || !mailTitleElement || !mailTextElement) {
            console.error(`[updateMailTexts] Missing DOM elements.`);
            return;
        }
    
        console.log(`[updateMailTexts] Cleared existing text in elements.`);
        // Clear existing text
        mailRecepientElement.textContent = '';
        mailTitleElement.textContent = '';
        mailTextElement.innerHTML = ''; // Clear mail-text content
    
        // Animate recipient
        console.log(`[updateMailTexts] Starting recipient animation.`);
        flashText(mailRecepientElement, 'textContent', recepientText, 15, 0, '\u258C', true, () => {
            console.log(`[updateMailTexts] Recipient animation completed. Starting title animation.`);
            // Animate title
            flashText(mailTitleElement, 'textContent', titleText, 15, 0, '\u258C', true, () => {
                console.log(`[updateMailTexts] Title animation completed. Starting mail text animation.`);
                // Animate mail text
                this.animateMailText(text + ' ', link);
            });
        });
    }

    animateMailText(text, link) {
        const mailTextElement = document.querySelector('.mail-text');
        mailTextElement.innerHTML = ''; // Clear existing content
    
        console.log(`[animateMailText] Starting text animation.`);
        let currentText = '';
        let index = 0;
    
        // Function to update text
        const updateText = () => {
            if (index < text.length) {
                currentText += text[index];
                mailTextElement.innerHTML = currentText + '\u258C'; // Add cursor
                console.log(`[animateMailText] Updating text: ${currentText}`);
                index++;
            } else {
                console.log(`[animateMailText] Text animation completed. Starting link animation.`);
                // Text is fully displayed, now animate the link
                mailTextElement.innerHTML = currentText; // Remove cursor
                clearInterval(textIntervalId);
    
                const linkSpan = document.createElement('span');
                linkSpan.className = 'url';
                mailTextElement.appendChild(linkSpan);
    
                flashText(linkSpan, 'textContent', link, 15, 0, '\u258C', true, () => {
                    console.log(`[animateMailText] Link animation completed.`);
                });
            }
        };
    
        const textIntervalId = setInterval(updateText, 15);
    }

    smartphoneSvg() {
        return `
            <svg
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 206.7 385.1"
                style="enable-background:new 0 0 206.7 385.1;"
                xml:space="preserve"
            >
                <style type="text/css">
                    .st0 {
                        fill: none;
                        stroke: #00FFFF;
                        stroke-miterlimit: 10;
                        stroke-dasharray: 1000;
                        stroke-dashoffset: 1000;
                        transition: stroke-dashoffset 2s linear;
                    }

                    /* Animation when the .animate class is added */
                    .animate .st0 {
                        stroke-dashoffset: 0;
                    }
                </style>
                <g>
                    <path
                        class="st0"
                        d="M47.2,33.2l124.6-20.5c0,0,6,1.2,6,7.7s-20,345.7-20,345.7s-0.8,7.3-6,7.3c-5.3,0-125.4-6.6-125.4-6.6
            		s-6,0-5.3-8.5S35.5,46.3,35.5,46.3S37,34.3,47.2,33.2z"
                    />
                    <path
                        class="st0"
                        d="M95.9,30.2c0,0-1.5,0.2-1.5,2s1.8,2,1.8,2s2.1-0.1,2.1-2C98.3,30.2,96.4,30.1,95.9,30.2z"
                    />
                    <line class="st0" x1="35.1" y1="56.7" x2="176.9" y2="36.8" />
                    <line class="st0" x1="22" y1="344.7" x2="158.5" y2="350" />
                    <polygon
                        class="st0"
                        points="33.1,351.1 32.9,362 45.9,362.4 47,350.6"
                    />
                    <polygon
                        class="st0"
                        points="75.3,351.6 75.3,365.1 91.1,365.5 91.8,352.3"
                    />
                    <polygon
                        class="st0"
                        points="121.5,353.2 121.1,367.3 137.5,368.2 138.2,353.2"
                    />
                    <path
                        class="st0"
                        d="M45.1,31.1L170.7,8.8c0,0,10.7,0.6,10.7,10.2s-19.2,348.4-19.2,348.4s-2.3,13-9.6,11.9
            		c-7.3-1.1-128.2-9-128.2-9s-6.5-1.3-6.2-9.5c0.3-8.2,15.2-314.9,15.2-314.9S35.9,32.6,45.1,31.1"
                    />
                    <path
                        class="st0"
                        d="M171.2,8.8c0,0,21.6-1.2,21,15.2c-0.6,16.4-17.5,345-17.5,345s-2.4,10-10.7,10.4s-10.3,0-10.3,0"
                    />
                    <line class="st0" x1="180.7" y1="33.2" x2="191.5" y2="33.8" />
                    <path
                        class="st0"
                        d="M181.1,81.1c0,0,0.6-2.1,1.5-1.9c0.9,0.2,3-0.9,3,1.9s-2.6,42.7-2.6,42.7s-0.9,0.6-1.9,0.4
            		c-0.9-0.2-2.3-1.5-2.3-2.8S181.1,81.1,181.1,81.1z"
                    />
                    <polygon
                        class="st0"
                        points="41.4,62.2 165.7,44.1 148.2,340.6 27.3,336.1"
                    />
                    <line class="st0" x1="162.2" y1="368.3" x2="174.4" y2="369" />
                </g>
            </svg>

        `;
    }

    laptopSvg() {

    }

    startSmartphoneAnimation() {
        setTimeout(() => {
            this.$smartphone.querySelector('svg').classList.add('animate');
        }, 50); // Delay to ensure proper rendering
    }

    laptopSvg() {
        return `
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 721.7 439.3" style="enable-background:new 0 0 721.7 439.3;" xml:space="preserve">
                <style type="text/css">
                    .st0 {
                        fill: none;
                        stroke: #00FFFF;
                        stroke-miterlimit: 10;
                        stroke-dasharray: 2000;
                        stroke-dashoffset: 2000;
                        transition: stroke-dashoffset 2s linear;
                    }
                
                    /* Animation when the .animate class is added */
                    .animate .st0 {
                        stroke-dashoffset: 0;
                    }
                </style>
                <g>
                    <path class="st0" d="M273.1,353.8l32.8-258.6c0,0,2.8-19.2,14.7-20.9c11.9-1.7,376.1-60.4,376.1-60.4s16.9-2.8,17.5,10.7
                        s-19.8,350.7-19.8,350.7s-4,9-7.3,9"/>
                    <path class="st0" d="M322.2,78.2c0,0-11.3,1.7-13.6,15.2s-31.1,250.7-31.1,250.7s1.1,5.1,5.1,5.1S682,369.1,682,369.1
                        s6.8,1.1,7.9-5.6s20.3-338.8,20.3-338.8s-0.6-7.3-7.3-7.3C696.1,17.3,322.2,78.2,322.2,78.2z"/>
                    <polygon class="st0" points="317.2,92.9 316.2,100.2 316.2,100.4 286.7,338 672.9,354.9 695.5,37"/>
                    <path class="st0" d="M339.1,297.7L360,119.3c0,0,1.2-4.2,5.7-4.5c4.5-0.3,241-30.3,241-30.3s4.6,1.3,4.4,5.5
                        c-0.2,4.1-19.5,210.6-19.5,210.6L339.1,297.7z"/>
                    <line class="st0" x1="359.9" y1="122.5" x2="610.5" y2="93.5"/>
                    <path class="st0" d="M364.6,116.6c0,0-1.5,0.2-1.5,2s1.8,2,1.8,2s2.1-0.1,2.1-2S365.1,116.5,364.6,116.6z"/>
                    <path class="st0" d="M369.8,115.8c0,0-1.5,0.5-1.5,2.2s1.7,1.9,1.7,1.9s2.4-0.2,2.3-2.1C372.3,115.7,370.7,115.6,369.8,115.8z"/>
                    <path class="st0" d="M375.5,115.2c0,0-2,0.4-2,2.2s1.9,1.9,1.9,1.9s2.3-0.1,2.2-1.9S376,115.1,375.5,115.2z"/>
                    <line class="st0" x1="357.8" y1="138.1" x2="608.6" y2="112.9"/>
                    <line class="st0" x1="399.1" y1="134.2" x2="382.3" y2="298.3"/>
                    <line class="st0" x1="316.5" y1="100.1" x2="694.4" y2="46"/>
                    <polyline class="st0" points="372.9,341.5 374.4,324.4 560.2,330.2 559.4,349.7"/>
                    <polygon class="st0" points="616.2,50.1 615.9,56.1 650.9,50.6 650.8,44.8"/>
                    <polygon class="st0" points="594,53.8 594.1,59.3 601.2,58.4 601.2,52.4"/>
                    <polygon class="st0" points="604,51.9 604.2,57.9 612.7,56.7 612.6,50.6"/>
                    <path class="st0" d="M581.2,60.5l-0.4-4c0,0,0.3-1.3,1.5-1.4c1.2-0.1,2.7-0.2,2.7-0.2s2.1,0.7,2,2.1s0.1,2.9,0.1,2.9L581.2,60.5z"/>
                    <path class="st0" d="M274.5,354.3L13.2,374.5v11l433.1,48.3c0,0,19.2,2.3,34.4,0s195.4-39,195.4-39s11.3-3.1,9.4-13.8l-385.1-22.5
                        l2.3-3L274.5,354.3z"/>
                    <path class="st0" d="M301.3,357.9l5.1-6.5L632.1,369c0,0,1.8,0.6,1.8,1.5c0,0.9-1,7.2-1,7.2l-6.8-0.4l7.1-7.6"/>
                    <path class="st0" d="M13.5,374.8l433,43.3c0,0,23,2.6,38.4,0c15.4-2.6,199-37.1,199-37.1"/>
                    <path class="st0" d="M627.4,395.7c0,0-0.8,0.8-0.4,2.2s1.4,1.9,2.1,1.8s12-2.7,12-2.7s1.9-1,1.4-2.5c-0.5-1.5-0.9-1.9-1.8-1.8
                        C639.9,392.7,627.4,395.7,627.4,395.7z"/>
                    <path class="st0" d="M649.9,391.1c0,0-1.6,0.7-1.2,2.3s1.3,1.5,2.4,1.5s12.7-2.8,12.7-2.8s1.2-0.9,0.8-2.5c-0.5-1.6-1.5-1-1.5-1
                        L649.9,391.1z"/>
                    <path class="st0" d="M671.8,387.2c0,0-0.8,3.1,1.2,3.9c2.1,0.8,3-0.5,3-0.5s0.8-2.3-0.2-3.3C674.8,386.2,673.5,385.4,671.8,387.2z"/>
                    <path class="st0" d="M157.5,389.1c0,0,0.9,9.8,5.8,10.2c4.9,0.4,51.8,4.1,51.8,4.1s4.7,0.2,5.3-7.7l-63-6.2"/>
                    <path class="st0" d="M162.6,389.9c0,0-0.8,5.1-0.1,8.8"/>
                    <polygon class="st0" points="178.5,368 274.5,359.2 570.5,379.4 495.3,392.4"/>
                    <polygon class="st0" points="157.1,385.3 237.8,377.4 366,385.9 296,399.7"/>
                    <polygon class="st0" points="641.1,72.2 638.9,94.8 660.7,92.9 662.2,69.9"/>
                </g>
            </svg>
        `;
    }

    startLaptopAnimation() {
        setTimeout(() => {
            this.$laptop.querySelector('svg').classList.add('animate');
        }, 50); // Delay to ensure proper rendering
    }

}