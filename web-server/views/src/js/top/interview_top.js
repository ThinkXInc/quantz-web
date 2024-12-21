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
        this.currentKey = 'recruiting';
        this.currentStep = 1;
        this.currentStepKey = null;

        // key elements
        this.$interviewTop = document.getElementById('InterviewTop');
        this.$headerTop = document.getElementById('header-top');
        this.$headerMain = document.getElementById('header-main');
        this.$headerWithLogo = document.getElementById('header-with-logo');
        this.$stepsWrapper = document.getElementById('steps-wrapper'); // Added
        this.$steps = document.getElementById('steps');
        this.STEPS_TOP_Y = this.$steps.getBoundingClientRect().top + window.scrollY;
        this.STEPS_WRAPPER_TOP_Y = this.$stepsWrapper.getBoundingClientRect().top + window.scrollY; // Updated

        // scroll event listener
        window.addEventListener('scroll', (event) => {
            this.layoutHeaderOnScrollPosition();
            this.layoutTecnhologyOnScrollPosition();
            this.layoutStepsOnScrollPosition();
        })

        // needs
        this.initNeedsSection();

        // Create meeting demo
        const defaultInterviewRecruiting = {
            "title": "Recruiting Interview",
            "openingRemark": "Hello, {name}. Are you ready?",
            //"end": "Thank you {name}. This is the end. If you have any question, feel free to contact us. Goodbye.",
            "end": "Thank you {name}. Quantz Interview conducts interviews on your behalf, just like this. If you're interested in using this service, try the free trial available on our homepage. See you soon!",
            "steps": [
                {
                    "remark": "Thank you for trying out the Quantz Interview Demo. Have you ever had to take time out of your day for things like job interviews, staff meetings, or answering inquiries?",
                    "goal": "When you've received a detailed answer.",
                    "guidelines": [
                        "First, read the remark.",
                        "Next, respond positively to the interviewee and ask for more details.",
                        "Your final goal is to determine if the interviewee is spending time on clerical meetings."
                    ],
                    "response_mode": 0,
                    "max_turns": 3,
                },
                //{
                //    "remark": "Why are you interested in this position, and how do you think your skills align with the role?",
                //    "goal": "Interviewee answered that they've finished.",
                //    "guidelines": [
                //        "First, read the remark.",
                //        "Ask if it's okay to stop at this good point."
                //    ],
                //    "max_turns": 3,
                //}
            ]
            //"end": "Thank you {name}. This is the end. If you have any remarks, feel free to reach out to our sales support team for assistance. Goodbye.",
            //"steps": [
            //    {
            //        "remark": "Could you briefly introduce yourself?",
            //        "goal": "Interviewee answered that they've finished.",
            //        "guidelines": [
            //            "First, read the remark.",
            //            "Ask if it's okay to stop at this good point."
            //        ],
            //        "max_turns": 3,
            //    },
            //    //{
            //    //    "remark": "Why are you interested in this position, and how do you think your skills align with the role?",
            //    //    "goal": "Interviewee answered that they've finished.",
            //    //    "guidelines": [
            //    //        "First, read the remark.",
            //    //        "Ask if it's okay to stop at this good point."
            //    //    ],
            //    //    "max_turns": 3,
            //    //}
            //]
        }

        this.$createInterviewDemo = document.getElementById('CreateInterviewDemo')

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
        this.interviewCreateView.mount(this.$createInterviewDemo)

        this.$createInterviewDemoMessage = document.createElement('p');
        this.$createInterviewDemoMessage.id = "CreateInterviewDemoMessage";
        this.$createInterviewDemo.appendChild(this.$createInterviewDemoMessage);


        this.$runMeetingButton = document.getElementById('run-meeting-button')
        this.$runMeetingButton.addEventListener('click', ()=> {
            this.startDemoMeetinng()
        })
 
        // 4. result
        this.$smartphone = document.getElementById('smartphone');
        this.svgAnimationSmartphone = new SVGAnimation({svg: "smartphone"});
        this.svgAnimationSmartphone.mount(this.$smartphone);

        this.$laptop = document.getElementById('laptop');
        this.svgAnimationLaptop = new SVGAnimation({svg: "laptop"});
        this.svgAnimationLaptop.mount(this.$laptop);
    }

    scrollToCreateInterview() {
        const targetY = this.STEPS_TOP_Y;
        const duration = 500; // Smooth scroll duration in milliseconds
        const startY = window.scrollY;
        const startTime = performance.now();
    
        const smoothScroll = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = progress * (2 - progress); // Ease-in-out
    
            window.scrollTo(0, startY + (targetY - startY) * easedProgress);
    
            if (progress < 1) {
                window.requestAnimationFrame(smoothScroll);
            }
        };
    
        window.requestAnimationFrame(smoothScroll);
    }


    startDemoMeetinng() {
        console.log(`[InterviewTop] clicked demo meeting button.`);
        
        if (this.$createInterviewDemoMessage) {
            this.$createInterviewDemoMessage.classList.remove('alert', 'success');
            this.$createInterviewDemoMessage.textContent = '';
        } else {
            console.error(`$createInterviewDemoMessage not exist.`);
        }

        const interviewJSON = this.interviewCreateView.interviewObjectFromFormData();
        if (interviewJSON.steps.length < 1) {
            interviewJSON.steps.push(
                {
                    "remark": "Why are you interested in this position, and how do you think your skills align with the role?",
                    "goal": "Interviewee answered that they've finished.",
                    "guidelines": [
                        "First, read the question.",
                        "Ask if it's okay to stop at this good point."
                    ],
                    "max_turns": 3,
                }
            )
        }
        if (!interviewJSON || interviewJSON.steps.length < 1) {
            console.warn('No interviewJSON');
            const message = this.locale.get("interview_top_create_demo_please_input", this.lang);
            this.$createInterviewDemoMessage.textContent = message;
            this.$createInterviewDemoMessage.classList.add('alert');
            this.scrollToCreateInterview();
            setTimeout(()=>{
                const $stepCreate = document.getElementById('step-create');
                const remark0Input = $stepCreate.querySelector('input.remark_0form');
                remark0Input.focus()
            }, 1000)
            return;
        }

        // Convert interviewJSON into URL query parameters
        const queryParams = new URLSearchParams({
            title: interviewJSON.title,
            //openingRemark: interviewJSON.introduction,
            end: interviewJSON.end,
            steps: JSON.stringify(interviewJSON.steps) // Serialize the steps array
        }).toString();

        const url = `/${this.lang}/interview/demo?${queryParams}`;
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.interview.id) {
                    // open demo
                    const demoUrl = `/v1/${this.lang}/interviews/${data.interview.id}`;
                    console.log(`[InterviewTop] Redirecting to demo page: ${demoUrl}`);
                    window.open(demoUrl, '_blank');
                } else if(data.message) {
                    this.$createInterviewDemoMessage.textContent = data.message;
                    this.$createInterviewDemoMessage.classList.add('success');
                } else {
                    console.warn('No message in response');
                }
            })
            .catch(error => {
                console.error('Error fetching the demo interview page:', error);
                if (error.message) {
                    this.$createInterviewDemoMessage.textContent = message;
                    this.$createInterviewDemoMessage.classList.add('alert');
                    this.scrollToCreateInterview();
                } else {
                    this.$createInterviewDemoMessage.textContent = "unknown error";
                    this.$createInterviewDemoMessage.classList.add('alert');
                    this.scrollToCreateInterview();
                }
            });
    }

    layoutHeaderOnScrollPosition() {
        const smartphoneWidth = 480;
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        if (window.innerWidth / devicePixelRatio <= smartphoneWidth) {
            return; // Exit if the effective screen width is <= 480px
        }
        //console.warn(window.scrollY);
        // Key position components
        const HEADER_TOP_HEIGHT = this.$headerTop.offsetHeight;
        const HEADER_WITH_LOGO_INITIAL_HEIGHT = this.$headerWithLogo.offsetHeight;
        const HEADER_MAIN_HEIGHT = this.$headerMain.offsetHeight;
        const Y_RANGE = HEADER_MAIN_HEIGHT - 40; // Define the range over which the transition occurs
        const scrollStart = HEADER_TOP_HEIGHT;
        const scrollEnd = HEADER_TOP_HEIGHT + Y_RANGE;
    
        const $centerContainer = this.$headerWithLogo.querySelector('.center-container');
        const $logo = this.$headerWithLogo.querySelector('.logo');
        const $topCopy = this.$headerWithLogo.querySelector('.top-copy');
    
        // Helper function to interpolate values
        const interpolate = (start, goal, progress) => start + (goal - start) * progress;
    
        // Calculate the progress based on scroll position
        const scrollValue = Math.max(0, Math.min(Y_RANGE, window.scrollY - scrollStart));
        const progress = scrollValue / Y_RANGE;
    
        if (window.scrollY >= HEADER_TOP_HEIGHT) {
            // Append the alternative header if not already appended
            if (!document.getElementById('header-with-logo-alternative')) {
                const $headerWithLogoAlternative = document.createElement('div');
                $headerWithLogoAlternative.id = 'header-with-logo-alternative';
                $headerWithLogoAlternative.style.height = `${HEADER_WITH_LOGO_INITIAL_HEIGHT}px`;
                $headerWithLogoAlternative.style.background = '#1a1a1a';
                this.$headerMain.insertBefore($headerWithLogoAlternative, this.$headerMain.firstChild);
            }

            //this.$headerTop.style.marginBottom = `${HEADER_WITH_LOGO_INITIAL_HEIGHT}px`;
            this.$headerWithLogo.style.position = 'fixed';
            this.$headerWithLogo.style.top = '0';
            this.$headerWithLogo.style.zIndex = '99';
            this.$headerWithLogo.style.background = '#000';//'#0d1114';//'#000';
            this.$headerWithLogo.style.width = '100%';

            // Gradually update styles
            this.$headerWithLogo.style.height = `${interpolate(100, 42, progress)}px`;
            this.$headerWithLogo.style.opacity = `${interpolate(0, 0.8, progress)}`;
    
            $centerContainer.style.height = `${interpolate(100, 42, progress)}px`;
            $centerContainer.style.width = `${interpolate(80, 100, progress)}%`; // Assuming original width is 80%
    
            $topCopy.style.position = 'absolute';
            $topCopy.style.fontSize = `${interpolate(15, 12, progress)}px`;
            $topCopy.style.left = `${interpolate(39, 64, progress)}vw`; // Assuming original left is 5px
            $topCopy.style.top = `${interpolate(20, 15, progress)}px`; // Assuming original top is 20px

            $logo.style.position = 'absolute';
            $logo.style.height = `${interpolate(71, 29, progress)}px`;
            $logo.style.top = `${interpolate(20, 8, progress)}px`; // Assuming original top is 20px
            $logo.style.left = `${interpolate(34, 84, progress)}vw`; // Assuming original left is 70vw
        } else {
            // Remove the alternative header if it exists
            const $headerWithLogoAlternative = document.getElementById('header-with-logo-alternative');
            if ($headerWithLogoAlternative) {
                $headerWithLogoAlternative.remove();
            }

            this.$headerTop.style.marginBottom = ``;
            this.$headerWithLogo.style.position = 'relative';
            this.$headerWithLogo.style.background = '';
            this.$headerWithLogo.style.opacity = '';
            this.$headerWithLogo.style.width = '';


            // Reset styles to original state
            this.$headerWithLogo.style.top = '';
            this.$headerWithLogo.style.height = '100px';
    
            $centerContainer.style.height = '100px';
            $centerContainer.style.width = '80%';
    
            $logo.style.position = '';
            $logo.style.height = '71px';
            $logo.style.top = '20px';
            $logo.style.left = '70vw';
    
            $topCopy.style.position = '';
            $topCopy.style.fontSize = '15px';
            $topCopy.style.left = '5px';
            $topCopy.style.top = '20px';
        }
    }

    layoutTecnhologyOnScrollPosition() {

        // Key position components
        this.$technology = document.getElementById('technology');
        const TECHNOLOGY_TOP_Y = this.$technology.getBoundingClientRect().top + window.scrollY;
        const ADJUST = -200;
 
        if (window.scrollY >= TECHNOLOGY_TOP_Y + ADJUST) {
            this.showChart();
        } else {
        }
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


    layoutStepsOnScrollPosition() {
        const scrollTop = window.scrollY;
    
        // Key elements
        const $steps = document.getElementById('steps');
        const $stepsHeader = document.getElementById('steps-header');
        const $stepsIndicator = document.getElementById('steps-indicator');
        const $stepsIndicatorBar = document.getElementById('steps-indicator-bar');
    
        const $stepCreate = document.getElementById('step-create');
        const $stepTest = document.getElementById('step-test');
        const $stepSend = document.getElementById('step-send'); // Updated to 'send'
        const $stepResult = document.getElementById('step-result');
    
        // Initial setup
        const SCROLL_START = this.STEPS_TOP_Y;
    
        // Y-ranges for each step
        const Y_RANGE_CREATE = 4000;
        const Y_RANGE_TEST = 6000;
        const Y_RANGE_SEND = 5000;
        const Y_RANGE_RESULT = 12000;
    
        // Start and end positions of each step
        const Y_CREATE_START = SCROLL_START;
        const Y_CREATE_END = Y_CREATE_START + Y_RANGE_CREATE;
        const Y_TEST_START = Y_CREATE_END;
        const Y_TEST_END = Y_TEST_START + Y_RANGE_TEST;
        const Y_SEND_START = Y_TEST_END;
        const Y_SEND_END = Y_SEND_START + Y_RANGE_SEND;
        const Y_RESULT_START = Y_SEND_END;
        const Y_RESULT_END = Y_RESULT_START + Y_RANGE_RESULT;
    
        // Helper function to calculate progress
        const calculateProgress = (scrollStart, range, currentScroll) => {
            const scrollValue = Math.max(0, Math.min(range, currentScroll - scrollStart));
            return scrollValue / range;
        };
    
        // Calculate overall progress
        const TOTAL_RANGE = Y_RANGE_CREATE + Y_RANGE_TEST + Y_RANGE_SEND + Y_RANGE_RESULT;
        const overallProgress = calculateProgress(SCROLL_START, TOTAL_RANGE, scrollTop);

        this.$stepsWrapper.style.height = `${TOTAL_RANGE + 400}px`;
    
        // Calculate progress for each step
        const progressCreate = calculateProgress(Y_CREATE_START, Y_RANGE_CREATE, scrollTop);
        const progressTest = calculateProgress(Y_TEST_START, Y_RANGE_TEST, scrollTop);
        const progressSend = calculateProgress(Y_SEND_START, Y_RANGE_SEND, scrollTop); // Updated to 'send'
        const progressResult = calculateProgress(Y_RESULT_START, Y_RANGE_RESULT, scrollTop);
    
        // Update indicator bar width
        if ($stepsIndicatorBar) {
            $stepsIndicatorBar.style.width = `${overallProgress * 100}%`;
        }
    
        // Implement position fixing for $steps
        if (scrollTop >= SCROLL_START && scrollTop <= SCROLL_START + TOTAL_RANGE) {
            this.$headerWithLogo.style.display = 'none';

            this.$steps.style.position = 'fixed';
            this.$steps.style.top = '0';

        } else {
            if (scrollTop < SCROLL_START) {
                this.$headerWithLogo.style.display = 'flex';
            }
            this.$steps.style.position = '';
            this.$steps.style.top = '';
        }

        // Helper functions
        const getCurrentStep = (scrollTop) => {
            if (scrollTop >= Y_CREATE_START && scrollTop < Y_CREATE_END) {
                return 'create';
            } else if (scrollTop >= Y_TEST_START && scrollTop < Y_TEST_END) {
                return 'test';
            } else if (scrollTop >= Y_SEND_START && scrollTop < Y_SEND_END) {
                return 'send';
            } else if (scrollTop >= Y_RESULT_START && scrollTop <= Y_RESULT_END) {
                return 'result';
            } else {
                return null;
            }
        }
    
        const didStepSwitch = (newStepKey) => {
            // Remove .highlight from all step heads
            const stepHeads = $stepsHeader.querySelectorAll('.step-head');
            stepHeads.forEach(stepHead => stepHead.classList.remove('highlight'));
    
            // Add .highlight to the current step head
            const currentStepHead = $stepsHeader.querySelector(`.step-head.${newStepKey}`);
            if (currentStepHead) {
                currentStepHead.classList.add('highlight');
            }
    
            // Hide all steps
            $stepCreate.classList.remove('show');
            $stepTest.classList.remove('show');
            $stepSend.classList.remove('show'); // Updated to 'send'
            $stepResult.classList.remove('show');
    
            // Show the current step
            switch (newStepKey) {
                case 'create':
                    $stepCreate.classList.add('show');
                    break;
                case 'test':
                    $stepTest.classList.add('show');
                    break;
                case 'send': // Updated to 'send'
                    $stepSend.classList.add('show');
                    break;
                case 'result':
                    $stepResult.classList.add('show');
                    break;
            }
        }

    
        // Determine the current step
        const newStepKey = getCurrentStep(scrollTop);
    
        // Check if the step has changed and call didStepSwitch
        if (newStepKey && newStepKey !== this.currentStepKey) {
            this.currentStepKey = newStepKey;
            didStepSwitch(newStepKey);
        }

        const mapProgressClamped = (value, start, end) => {
            const progress = (value - start) / (end - start);
            return Math.max(0, Math.min(1, progress));
        };

        switch (newStepKey) {
            case 'create':
                // Get input elements
                //const introductionInput = $stepCreate.querySelector('input.introductionform');
                const remark0Input = $stepCreate.querySelector('input.remark_0form');
                const remark1Input = $stepCreate.querySelector('input.remark_1form');
                const endInput = $stepCreate.querySelector('input.endform');
    
                // Decide which input to focus on
                if (progressCreate > 0.1 && progressCreate <= 0.3) {
                    //if (document.activeElement !== introductionInput) {
                    //    introductionInput.focus();
                    //}
                    if (document.activeElement !== remark0Input) {
                        remark0Input.focus();
                    }
                } else if (progressCreate > 0.3 && progressCreate <= 0.5) {
                    //if (document.activeElement !== remark0Input) {
                    //    remark0Input.focus();
                    //}
                    if (document.activeElement !== remark1Input) {
                        remark1Input.focus();
                    }
                } else if (progressCreate > 0.5 && progressCreate <= 0.8) {
                    //if (document.activeElement !== remark1Input) {
                    //    remark1Input.focus();
                    //}
                    if (document.activeElement !== endInput) {
                        endInput.focus();
                    }
                } else if (progressCreate > 0.8 && progressCreate <= 1.0) {
                    //if (document.activeElement !== endInput) {
                    //    endInput.focus();
                    //}
                } else {
                    // Remove focus from any of them
                    //if (document.activeElement === introductionInput || document.activeElement === remark0Input || document.activeElement === remark1Input || document.activeElement === endInput) {
                    if (document.activeElement === remark0Input || document.activeElement === remark1Input || document.activeElement === endInput) {
                        document.activeElement.blur();
                    }
                }
                break;
            case 'test':
                // Add or remove 'on' class based on progressTest
                const runMeetingButton = document.getElementById('run-meeting-button');
                if (progressTest >= 0.6 && progressTest <= 1.0) {
                    runMeetingButton.classList.add('on');
                } else {
                    runMeetingButton.classList.remove('on');
                }
                break;
            case 'send':
                // Call updateMailTexts() only once when progressSend is < 0.1
                if (progressSend < 0.1 && !this.mailTextsUpdated) {
                    this.updateMailTexts();
                    this.mailTextsUpdated = true;
                }
                break;
            case 'result':
                // Get the elements
                const $result = document.getElementById('step-result');
                const $taxiVideo = document.getElementById('taxi-video');
                const $smartphone = document.getElementById('smartphone');
                const $smartphoneVideo = document.getElementById('smartphone-video');
                const $laptop = document.getElementById('laptop');
                const $laptopVideo = document.getElementById('laptop-video');


                // 1) Between 0.1 and 0.2, show up taxi-video
                //{
                //    const progress = mapProgressClamped(progressResult, 0.1, 0.15);
                //    const target = 48 * progress;
                //    $taxiVideo.style.width = `${target}vw`;
                //}
                {
                    const progress = mapProgressClamped(progressResult, 0.1, 0.2);
                    const targetX = -68 * progress;
                    const opacity = 1 - progress;
                    $taxiVideo.style.opacity = opacity;
                    $taxiVideo.style.transform = `translateX(${targetX}px)`;
                }

                // 2) Between 0.3 and 0.5, update svgAnimationSmartphone
                {
                    const progress = mapProgressClamped(progressResult, 0.14, 0.4);
                    this.svgAnimationSmartphone.update(progress);
                }

                // 3) Between 0.2 and 0.4, move smartphone and scale smartphone-video
                {
                    const progress = mapProgressClamped(progressResult, 0.2, 0.4);
                    const targetX = -$result.offsetWidth/4 * progress;
                    $smartphone.style.transform = `translateX(${targetX}px)`;

                    const scale = progress;
                    $smartphoneVideo.style.transform = `scale(${scale})`;
                }

                // 4) Between 0.4 and 0.6, set opacity of smartphone and smartphone-video
                {
                    const progress = mapProgressClamped(progressResult, 0.4, 0.6);
                    const opacity = 1 - progress;
                    $smartphone.style.opacity = opacity;
                }
                {
                    const progress = mapProgressClamped(progressResult, 0.6, 0.7);
                    const opacity = 1 - progress;
                    $smartphoneVideo.style.opacity = opacity;
                }

                // 4) Between 0.5 and 0.7, update svgAnimationLaptop
                {
                    const progress = mapProgressClamped(progressResult, 0.64, 0.9);
                    this.svgAnimationLaptop.update(progress);
                }

                // 4) Between 0.5 and 0.7, move laptop and scale laptop-video
                {
                    const progress = mapProgressClamped(progressResult, 0.8, 0.9);
                    const targetX = -$result.offsetWidth/4 * progress;
                    $laptop.style.transform = `translateX(${targetX}px)`;

                    const scale = progress;
                    $laptopVideo.style.transform = `scale(${scale})`;
                }

                // 5) Between 0.7 and 0.9, set opacity of laptop and laptop-video
                {
                    const progress = mapProgressClamped(progressResult, 0.8, 0.9);
                    const opacity = 1 - progress;
                    $laptop.style.opacity = opacity;
                }
                {
                    const progress = mapProgressClamped(progressResult, 0.9, 1.0);
                    const opacity = 1 - progress;
                    $laptopVideo.style.opacity = opacity;
                }



                //// 1) Between 0.1 and 0.3, update svgAnimationSmartphone
                //{
                //    const progress = mapProgressClamped(progressResult, 0.1, 0.5);
                //    this.svgAnimationSmartphone.update(progress);
                //}

                //// 2) Between 0.2 and 0.4, move smartphone and scale smartphone-video
                //{
                //    const progress = mapProgressClamped(progressResult, 0.2, 0.4);
                //    const targetX = -$result.offsetWidth/4 * progress;
                //    $smartphone.style.transform = `translateX(${targetX}px)`;

                //    const scale = progress;
                //    $smartphoneVideo.style.transform = `scale(${scale})`;
                //}

                //// 3) Between 0.4 and 0.6, set opacity of smartphone and smartphone-video
                //{
                //    const progress = mapProgressClamped(progressResult, 0.2, 0.4);
                //    const opacity = 1 - progress;
                //    $smartphone.style.opacity = opacity;
                //}
                //{
                //    const progress = mapProgressClamped(progressResult, 0.5, 0.6);
                //    const opacity = 1 - progress;
                //    $smartphoneVideo.style.opacity = opacity;
                //}

                //// 4) Between 0.5 and 0.7, update svgAnimationLaptop
                //{
                //    const progress = mapProgressClamped(progressResult, 0.6, 0.9);
                //    this.svgAnimationLaptop.update(progress);
                //}

                //// 4) Between 0.5 and 0.7, move laptop and scale laptop-video
                //{
                //    const progress = mapProgressClamped(progressResult, 0.7, 0.9);
                //    const targetX = -$result.offsetWidth/4 * progress;
                //    $laptop.style.transform = `translateX(${targetX}px)`;

                //    const scale = progress;
                //    $laptopVideo.style.transform = `scale(${scale})`;
                //}

                //// 5) Between 0.7 and 0.9, set opacity of laptop and laptop-video
                //{
                //    const progress = mapProgressClamped(progressResult, 0.8, 0.9);
                //    const opacity = 1 - progress;
                //    $laptop.style.opacity = opacity;
                //}
                //{
                //    const progress = mapProgressClamped(progressResult, 0.9, 1.0);
                //    const opacity = 1 - progress;
                //    $laptopVideo.style.opacity = opacity;
                //}



                break;
        }
    
        // Debugging: Log progress for development
        console.log({
            overallProgress,
            progressCreate,
            progressTest,
            progressSend,
            progressResult,
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

}

class SVGAnimation {
    constructor({ svg }) {
        this.defaultDashOffset = 2000;

        this.svgMap = {
            smartphone: SVGAnimation.smartphoneSvg,
            laptop: SVGAnimation.laptopSvg,
        };

        if (!this.svgMap[svg]) {
            throw new Error(`Unsupported SVG type: ${svg}`);
        }

        this.$svgElement = SVGAnimation.createSvgElement(this.svgMap[svg]());
        this.paths = Array.from(this.$svgElement.querySelectorAll('.st0'));
        //this.pathLengths = this.paths.map(path => path.getTotalLength());

        //// Initialize the paths with the correct stroke-dasharray and stroke-dashoffset
        //this.paths.forEach((path, index) => {
        //    const length = this.pathLengths[index];
        //    path.style.strokeDasharray = length;
        //    path.style.strokeDashoffset = length; // Initially hidden
        //});
        this.update(0);
    }

    static createSvgElement(svgString) {
        const $container = document.createElement('div');
        $container.innerHTML = svgString.trim();
        return $container.firstElementChild;
    }

    mount(container) {
        container.appendChild(this.$svgElement);
    }

    update(progress) {
        this.paths.forEach((path, index) => {
            path.style.strokeDashoffset = this.defaultDashOffset * (1 - progress);
        });
    }

    static smartphoneSvg(color = "#3784b0") {
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
                        stroke: ${color};
                        stroke-miterlimit: 10;
                        stroke-dasharray: 1000;
                        stroke-dashoffset: ${this.defaultDashOffset};
                        //transition: stroke-dashoffset 2s linear;
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

    static laptopSvg(color = "#00FFFF") {
        return `
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 721.7 439.3" style="enable-background:new 0 0 721.7 439.3;" xml:space="preserve">
                <style type="text/css">
                    .st0 {
                        fill: none;
                        stroke: ${color};
                        stroke-miterlimit: 10;
                        stroke-dasharray: 2000;
                        stroke-dashoffset: ${this.defaultDashOffset};
                        //transition: stroke-dashoffset 2s linear;
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


}
