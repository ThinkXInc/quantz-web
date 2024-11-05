const defaults = {
    "title": "Interview 001",
    //"introduction": "Hello, {name}. I would like to conduct a simple interview with you now. Are you ready?",
    "introduction": "Hello, {name}. Are you ready?",
    "end": "Thank you {name}. This is the end. Please write the note to supply this interview if you want. Bye.",
    "steps": [
        {
            "question": "Introduce yourself in about 1 minutes.",
            "finish_condition": "Interviewee answerd it's done.",
            "max_turns": 3,
            "instructions": [
                "First, read the question.",
                "When the answer looks done, ask 'Are you sure that\'s it?'"
            ]
        },
        {
            "question": "We're building a software automating communications. Our system is written mainly in Python, Go, and JavaScript. Any cloud services are not used to achieve complete privacy. Instead we have our own physical systems. What can you contribute?",
            "finish_condition": "Interviewee answerd it's done.",
            "max_turns": 3,
            "instructions": [
                "First, read the question.",
                "Ask if it's okay to stop at this good point."
            ]
        },
        {
            "question": "Can you explain the concept of 'General purpose computer'?",
            "finish_condition": "Interviewee answerd it's done.",
            "max_turns": 3,
            "instructions": [
                "First, read the question.",
                "Once you get the first answer, ask 'Can you explain more detail such that even a child can understand?'",
                "When the answer looks done, ask 'Are you sure that\'s it?'"
            ]
        }
    ]
}
class InterviewCreateModalView extends ModalView {
    constructor({
        id,
        user,
        locale,
        lang = 'en',
        title = "",
        text = "",
        interviewId = "",
        interview = null,
        cancelButtonText = "Cancel",
        doneButtonText = "Done",
        shouldCloseOnTapBG = true,
        htmlTag = 'div',
        protocols = [],
        validators = []
    }) {

        super({
            id,
            title,
            text,
            cancelButtonText,
            doneButtonText,
            shouldCloseOnTapBG,
            htmlTag,
            protocols,
            validators
        });

        this.user = user;
        this.locale = locale;
        this.lang = lang;

        this.interviewId = interviewId; //'670dcf37aa9bfc2db50d1574';//null;//'670b89cf740b61aa1bf16761';//null;
        this.interview = interview;
        console.warn(this.interview)
        console.warn(this.interview)
        console.warn(this.interview)
        console.warn(this.interview)


        this.createElements();
        //this.setupSettingsInputPageView();
        this.interviewCreateView = new InterviewCreateView({
            id: 'InterviewCreateView',
            locale: locale,
            lang: lang,
            user: this.user,
            interviewId: this.interviewId,
            interview: this.interview,
        });
        this.interviewCreateView.mount(this.$mainContent);
 
    }

    createElements() {
        super.createElements()

        const $message = document.createElement('p');
        $message.id = 'InterviewCreateModalViewMessage';
        $message.classList.add('message');
        this.$view.querySelector('.footer').prepend($message);
        this.$message = $message;
    }

    show() {
        super.show();
    }

    cancel() {
        super.cancel();
    }

    done() {
        if (!this.interviewId) {
            // create new
            this.interviewCreateView.submitCreateInterview();
        } else {
            // update
            this.interviewCreateView.submitUpdateInterview(this.interviewId);
        }
        // Trigger custom event
        //if (!this.cell) {
        //    throw Error('No cell is set to MaterialDeleteModalView before confirming deletion.');
        //}
        //this.$view.dispatchEvent(
        //    new CustomEvent(
        //        MaterialsEventKeys.CONFIRMED_DELETE_MATERIAL,
        //        { detail: { materialId: this.cell.content.materialId, cell: this.cell } }));
    }
}

const InterviewCreatePageIndex = Object.freeze({
    title: 0, introduction: 1, step1: 2, step2: 3, step3: 4, end: 5
})

class InterviewCreateView {
    constructor({
        id,
        locale,
        lang,
        user,
        interviewId,
        interview,
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.user = user;
        this.interviewId = interviewId;
        this.interview = interview;

        this.setupView();
    }

    setupView(){
        const pageView = new PageView({
            id: 'InterviewCreatePageView',
            numPages: 6
        })
        this.pageView = pageView;

        // URL View
        if (this.interviewId) {
            this.createUrlView(this.interviewId);
        }

        // Page 1: Title

        this.createTitlePage() 
        this.handleEventTitlePage()

        // Page 2: Introduction

        this.createIntroductionPage();
        this.handleEventIntroductionPage();

        // Page 3: Step
        
        this.questionForms = []
        this.finishConditionForms = []
        this.maxTurnsForms = []
        this.instructionForms = []

        for (let step=0; step<=2; step++) {
            this.createStepPage(step);
            this.handleEventStepPage(step);
        }

        this.pageView.showAll();

        // Page 3: Introduction

        this.createEndPage();
        this.handleEventEndPage();
    }

    mount(element) {
        this.pageView.mount(element);
    }

    interviewObjectFromFormData() {
        const title = this.titleForm.value;
        const introduction = this.introductionForm.value;
        const end = this.endForm.value;

        const steps = this.questionForms.map((form, index) => ({
            question: form.value,
            finish_condition: this.finishConditionForms[index].value,
            max_turns: parseInt(this.maxTurnsForms[index].value, 10),
            instructions: this.instructionForms[index].map(instructionForm => instructionForm.value)
        }));

        return {
            title: title,
            introduction: introduction,
            end: end,
            steps: steps
        };
    }

    submitCreateInterview() {
        const interviewJSON = this.interviewObjectFromFormData();

        const $message = document.getElementById('InterviewCreateModalViewMessage')
        $message.classList.remove('alert');
        $message.classList.remove('success');
        $message.textContent = '';
        
        Http.post(`/v1/${this.lang}/interviews/create`, interviewJSON,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                $message.classList.add('success');
                $message.textContent = message;

                this.interviewId = res.data.interview_id;
                // show url
                this.createUrlView(this.interviewId);
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason} message:${error.message}`);
                    const { errors, message } = error; 
                    if (errors) {
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'email':
                                    this.emailForm.alert(message)
                                    break;
                            }
                        });
                    } else if (message) {
                        $message.classList.add('alert');
                        $message.textContent = message;
                    }
                } else {
                    console.error(error);
                    $message.classList.add('alert');
                    $message.textContent = message;
                }
            }
        );
    }

    submitUpdateInterview(interviewId) {
        const interviewJSON = this.interviewObjectFromFormData();

        const $message = document.getElementById('InterviewCreateModalViewMessage')
        $message.textContent = '';
        
        Http.post(`/v1/${this.lang}/interviews/${interviewId}/update`, interviewJSON,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                $message.classList.add('success');
                $message.textContent = message;
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason} message:${error.message}`);
                    const { errors, message } = error; 
                    if (errors) {
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'email':
                                    this.emailForm.alert(message)
                                    break;
                            }
                        });
                    } else if (message) {
                        $message.classList.add('alert');
                        $message.textContent = message;
                    }
                } else {
                    console.error(error);
                    $message.classList.add('alert');
                    $message.textContent = message;
                }
            }
        );
    }

    createUrlView(interviewId) {
        const $urlView = document.createElement('div');
        $urlView.id = 'UrlView';
        $urlView.classList.add('UrlView');

        const $urlViewPre = document.createElement('pre');
        $urlViewPre.classList.add('UrlViewPre');


        const $url = document.createElement('code');
        $url.id = 'InterviewUrl';
        $url.textContent = `https://quantz.thinkxinc.com/v1/en/interviews/${interviewId}`;
        $url.classList.add('language-javascript');
    
        // Create the copy button
        const $copyButton = document.createElement('img');
        $copyButton.src = '/img/copy-icon.svg';
        $copyButton.classList.add('CopyButton');

        const $toolTip = document.createElement('span');
        $toolTip.classList.add('tooltip');
        $toolTip.textContent = this.locale.get("interview_create_url_copy_tooltip", lang);

        $copyButton.addEventListener('mouseenter', () => {
            $toolTip.classList.add('visible');
            $toolTip.classList.remove('fade-out');
        });

        $copyButton.addEventListener('mouseleave', () => {
            $toolTip.classList.add('fade-out');
        });

        $copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText($url.textContent).then(() => {
                $toolTip.textContent = this.locale.get("interview_create_url_copy_done_tooltip", lang);
                $toolTip.classList.add('copied');
                setTimeout(() => {
                    $toolTip.classList.add('fade-out');
                    setTimeout(() => {
                        $toolTip.classList.remove('visible', 'fade-out', 'copied');
                        $toolTip.textContent = this.locale.get("create_interview_url_copy_tooltip", lang);
                    }, 1000);
                }, 2000);
            }, err => {
                console.error('Failed to copy text: ', err);
            });
        });

        $urlViewPre.appendChild($url);
        $urlViewPre.appendChild($copyButton);
        $urlViewPre.appendChild($toolTip);
        $urlView.appendChild($urlViewPre);

        this.pageView.$view.prepend($urlView)
    }



    // Page 1: Title

    createTitlePage() {
        const pageIndex = InterviewCreatePageIndex.title;
        this.pageView.pages[pageIndex].container.classList.add('TitlePage');

        const $titlePageTitle = document.createElement('h3');
        $titlePageTitle.classList.add('title');
        $titlePageTitle.textContent = locale.get('create_interview_title_page_title', lang);

        //const $description = document.createElement('p');
        //$description.classList.add('description');
        //$description.textContent = ""

        const $container = document.createElement('div');
        $container.classList.add('container');

        const titleForm = new TextField({
            id: 'titleForm',
            fieldName: 'title',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100 
                }),
            ],
            defaultValue: this.interview ? this.interview.title : defaults.title,
            hasTitle: true,
            title: "Title",
            placeholder: "Enter the interview title.",
            isCounter: false,
        });

        $container.appendChild(titleForm.$view);
        this.titleForm = titleForm;

        this.pageView.appendChild($titlePageTitle, pageIndex);
        //this.pageView.appendChild($description, pageIndex);
        this.pageView.appendChild($container, pageIndex);

    }
    handleEventTitlePage() {

    }

    // Page 2: Introduction

    createIntroductionPage() {
        const pageIndex = InterviewCreatePageIndex.introduction;
        this.pageView.pages[pageIndex].container.classList.add('IntroductionPage');

        const $introductionPageTitle = document.createElement('h3');
        $introductionPageTitle.classList.add('title');
        $introductionPageTitle.textContent = locale.get('create_interview_introduction_page_title', lang);

        const $description = document.createElement('p');
        $description.classList.add('description');
        $description.textContent = locale.get('create_interview_introduction_page_description', lang);

        const $container = document.createElement('div');
        $container.classList.add('container');

        const introductionForm = new TextField({
            id: 'introductionForm',
            fieldName: 'introduction',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100 
                }),
            ],
            defaultValue: this.interview ? this.interview.introduction : defaults.introduction,
            hasTitle: true,
            title: locale.get('create_interview_introduction_form_title', lang),
            placeholder: locale.get('create_interview_introduction_form_placeholder', lang),
            isCounter: false,
        });

        $container.appendChild(introductionForm.$view);
        this.introductionForm = introductionForm;

        this.pageView.appendChild($introductionPageTitle, pageIndex);
        //this.pageView.appendChild($description, pageIndex);
        this.pageView.appendChild($container, pageIndex);
 
    }
    handleEventIntroductionPage() {


    }

    // Page 3: Step
    createStepPage(step) {
        const stepNumber = step + 1;
        const pageIndexKey = `step${stepNumber}`;
        const pageIndex = InterviewCreatePageIndex[pageIndexKey];
        console.error(step)
        console.error(pageIndexKey)
        console.error(pageIndex)
        this.pageView.pages[pageIndex].container.classList.add(`StepPage`);
        this.pageView.pages[pageIndex].container.classList.add(`Step${stepNumber}Page`);

        // Step 1
        const $stepPageTitle = document.createElement('h3');
        $stepPageTitle.classList.add('title');
        $stepPageTitle.classList.add('StepTitle');
        $stepPageTitle.textContent = locale.get('create_interview_step_page_title', lang) + ` ${stepNumber}`;


        const $container = document.createElement('div');
        $container.classList.add('container');

 
        // Message/Question

        const questionForm = new TextField({
            id: `questionForm_${step}`,
            fieldName: `question_${step}`,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 300 
                }),
            ],
            defaultValue: this.interview ? this.interview.steps[step]["question"] : defaults.steps[step]["question"],
            hasTitle: true,
            title: "Question/Message",
            placeholder: "Enter the question.",
            isCounter: false,
        });

        $container.appendChild(questionForm.$view);
        this.questionForms[step] = questionForm;


        // Condition (Choice)

        const finishConditionForm = new TextField({
            id: `finishConditionForm_${step}`,
            fieldName: `finishCondition_${step}`,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100 
                }),
            ],
            defaultValue: this.interview ? this.interview.steps[step]["finish_condition"] : defaults.steps[step]["finish_condition"],
            hasTitle: true,
            title: "Finish condition",
            placeholder: "Choose the condition to finish this step.",
            isCounter: false,
        });

        $container.appendChild(finishConditionForm.$view);
        this.finishConditionForms[step] = finishConditionForm;


        // Max turns
        const $maxTurnsTitle = document.createElement('h4');
        $maxTurnsTitle.classList.add('subtitle');
        $maxTurnsTitle.textContent = locale.get('create_interview_max_turns_title', lang)

        const min = 1;
        const max = 10;

        const maxTurnsForm = new TextField({
            id: 'maxTurnsForm',
            fieldName: 'maxTurns',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.positiveIntegerFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, lang),
                    min: min,
                    max: max
                })
            ],
            defaultValue: this.interview ? String(this.interview.steps[step]["max_turns"]) : String(defaults.steps[step]["max_turns"]),
            isCounter: false,
            isIncrementer: true,
            incrementButtonPlace: TextFieldPlaceTo.inputAfter,
            incrementUpImgSrc: '/img/up.svg',
            incrementDownImgSrc: '/img/down.svg',
        });

        $container.appendChild(maxTurnsForm.$view);
        this.maxTurnsForms[step] = maxTurnsForm;

        // Instructions 1~3
        this.instructionForms[step] = []

        defaults.steps[step]["instructions"].forEach((instruction, index) => {
            const indexDisplayed = index + 1;

            const instructionForm = new TextField({
                id: `instructionForm_${step}_${index}`,
                fieldName: `instruction_${step}_${index}`,
                validators: [
                    new Validator({
                        errorType: ValidationErrorType.required,
                        errorMessage: locale.get(ValidationErrorType.required, lang)
                    }),
                    new Validator({
                        errorType: ValidationErrorType.maxLength,
                        errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                        maxLength: 300 
                    }),
                ],
                defaultValue: defaults.steps[step]["instructions"][index],
                hasTitle: true,
                title: `Instruction ${indexDisplayed}`,
                placeholder: "Enter an instruction.",
                isCounter: false,
            });

            $container.appendChild(instructionForm.$view);
            this.instructionForms[step][index] = instructionForm;
        })


        this.pageView.appendChild($stepPageTitle, pageIndex);
        //this.pageView.appendChild($description, pageIndex);
        this.pageView.appendChild($container, pageIndex);
 
    }
    handleEventStepPage() {

    }

    // Page 4: End

    createEndPage() {
        const pageIndex = InterviewCreatePageIndex.end;
        this.pageView.pages[pageIndex].container.classList.add('EndPage');

        const $endPageTitle = document.createElement('h3');
        $endPageTitle.classList.add('title');
        $endPageTitle.textContent = locale.get('create_interview_end_page_title', lang);

        const $description = document.createElement('p');
        $description.classList.add('description');
        $description.textContent = locale.get('create_interview_end_page_description', lang);

        const $container = document.createElement('div');
        $container.classList.add('container');

        const endForm = new TextField({
            id: 'endForm',
            fieldName: 'end',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100 
                }),
            ],
            defaultValue: this.interview ? this.interview.end : defaults.end,
            hasTitle: true,
            title: locale.get('create_interview_end_form_title', lang),
            placeholder: locale.get('create_interview_end_form_placeholder', lang),
            isCounter: false,
        });

        $container.appendChild(endForm.$view);
        this.endForm = endForm;

        this.pageView.appendChild($endPageTitle, pageIndex);
        //this.pageView.appendChild($description, pageIndex);
        this.pageView.appendChild($container, pageIndex);
 
    }
    handleEventEndPage() {


    }


}