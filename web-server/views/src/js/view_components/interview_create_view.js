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
        console.error('**************************')
        console.error(this.locale)
        this.lang = lang;
        this.user = user;
        this.interviewId = interviewId;
        this.interview = interview || defaults;

        this.createView();
    }

    createView() {
        // Create the main container
        this.$view = document.createElement('div');
        this.$view.id = this.id;
        this.$view.classList.add('InterviewCreateView');

        // **InterviewSummaryView**
        const $interviewCreateViewContainer = document.createElement('div');
        $interviewCreateViewContainer.classList.add('InterviewCreateViewContainer');

        const $titleContainer = document.createElement('div');
        $titleContainer.classList.add('titleContainer');

        // **Interview Title**
        const titleForm = new TextField({
            id: 'titleForm',
            fieldName: 'title',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: 100 
                }),
            ],
            defaultValue: this.interview.title,
            hasTitle: true,
            title: this.locale.get("interview_create_title_label", this.lang),
            placeholder: "Enter the interview title.",
            isCounter: false,
        });
        this.titleForm = titleForm;
        $titleContainer.appendChild(titleForm.$view);
        $interviewCreateViewContainer.appendChild($titleContainer);

        // **Introduction Container**
        const $introductionContainer = document.createElement('div');
        $introductionContainer.classList.add('introductionContainer');

        const $introductionLabel = document.createElement('span');
        $introductionLabel.classList.add('introductionLabel');
        $introductionLabel.textContent = this.locale.get('interview_create_introduction_label', this.lang) || 'Introduction:';
        $introductionContainer.appendChild($introductionLabel);

        const introductionForm = new TextField({
            id: 'introductionForm',
            fieldName: 'introduction',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: 300 
                }),
            ],
            defaultValue: this.interview.introduction,
            hasTitle: false,
            placeholder: "Enter the introduction.",
            isCounter: false,
        });
        this.introductionForm = introductionForm;
        $introductionContainer.appendChild(introductionForm.$view);

        $interviewCreateViewContainer.appendChild($introductionContainer);

        // **Steps**
        this.questionForms = [];
        this.finishConditionForms = [];
        this.maxTurnsForms = [];
        this.instructionForms = [];

        this.interview.steps.forEach((step, index) => {
            // **Arrow Between Steps**
            if (index > 0) {
                const $arrowContainer = document.createElement('div');
                $arrowContainer.classList.add('stepArrowContainer');

                const $arrow = document.createElement('img');
                $arrow.src = '/img/interviews/step-arrow.svg';
                $arrow.classList.add('stepArrow');
                $arrowContainer.appendChild($arrow);

                $interviewCreateViewContainer.appendChild($arrowContainer);
            }

            // **Step Container**
            const $stepContainer = document.createElement('div');
            $stepContainer.classList.add('stepContainer');

            // **Step Title**
            const $stepTitle = document.createElement('h3');
            $stepTitle.classList.add('stepTitle');
            const stepLabelTemplate = this.locale.get('interview_create_steps_label', this.lang) || 'Step $0';
            $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1);
            $stepContainer.appendChild($stepTitle);

            // **Step Content Container**
            const $stepContent = document.createElement('div');
            $stepContent.classList.add('stepContent');

            // **Question Wrapper**
            const $questionWrapper = document.createElement('div');
            $questionWrapper.classList.add('questionWrapper');

            const $questionLabel = document.createElement('span');
            $questionLabel.classList.add('questionLabel');
            $questionLabel.textContent = this.locale.get('interview_create_step_question_label', this.lang) || 'Question:';
            $questionWrapper.appendChild($questionLabel);

            const questionForm = new TextField({
                id: `questionForm_${index}`,
                fieldName: `question_${index}`,
                validators: [
                    new Validator({
                        errorType: ValidationErrorType.required,
                        errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                    }),
                    new Validator({
                        errorType: ValidationErrorType.maxLength,
                        errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                        maxLength: 300 
                    }),
                ],
                defaultValue: step.question,
                hasTitle: false,
                placeholder: "Enter the question.",
                isCounter: false,
            });
            questionForm.$view.classList.add('questionForm');
            this.questionForms[index] = questionForm;
            $questionWrapper.appendChild(questionForm.$view);

            $stepContent.appendChild($questionWrapper);

            // **Instructions Wrapper**
            const $instructionsWrapper = document.createElement('div');
            $instructionsWrapper.classList.add('instructionsWrapper');

            const $instructionsLabel = document.createElement('span');
            $instructionsLabel.classList.add('instructionsLabel');
            $instructionsLabel.textContent = this.locale.get('interview_create_step_instructions_label', this.lang) || 'Instructions:';
            $instructionsWrapper.appendChild($instructionsLabel);

            const $instructionsList = document.createElement('div');
            $instructionsList.classList.add('instructions');

            this.instructionForms[index] = [];

            step.instructions.forEach((instruction, idx) => {
                const instructionForm = new TextField({
                    id: `instructionForm_${index}_${idx}`,
                    fieldName: `instruction_${index}_${idx}`,
                    validators: [
                        new Validator({
                            errorType: ValidationErrorType.required,
                            errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                        }),
                        new Validator({
                            errorType: ValidationErrorType.maxLength,
                            errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                            maxLength: 300 
                        }),
                    ],
                    defaultValue: instruction,
                    hasTitle: false,
                    placeholder: `Enter instruction ${idx + 1}.`,
                    isCounter: false,
                });
                instructionForm.$view.classList.add('instructionForm')
                this.instructionForms[index][idx] = instructionForm;

                const $instructionWrapper = document.createElement('div');
                $instructionWrapper.classList.add('instructionWrapper');

                const $indexSpan = document.createElement('span');
                $indexSpan.classList.add('index');
                $indexSpan.textContent = idx + 1;

                $instructionWrapper.appendChild($indexSpan);
                $instructionWrapper.appendChild(instructionForm.$view);

                $instructionsList.appendChild($instructionWrapper);
            });

            $instructionsWrapper.appendChild($instructionsList);

            // **More Detail**
            const $moreDetail = document.createElement('span');
            $moreDetail.classList.add('moreDetail');

            const $arrowIcon = document.createElement('img');
            $arrowIcon.src = '/img/interviews/down-arrow.svg';
            $arrowIcon.classList.add('moreDetailArrow');

            const $moreDetailLabel = document.createElement('p');
            $moreDetailLabel.classList.add('moreDetailLabel');
            $moreDetailLabel.textContent = this.locale.get('interview_create_step_more_detail_label', this.lang) || 'More detail';

            $moreDetail.appendChild($arrowIcon);
            $moreDetail.appendChild($moreDetailLabel);

            $instructionsWrapper.appendChild($moreDetail);

            // **Hidden Content**
            const $hiddenContent = document.createElement('div');
            $hiddenContent.classList.add('hiddenContent');

            // **Finish Condition Wrapper**
            const $finishConditionWrapper = document.createElement('div');
            $finishConditionWrapper.classList.add('finishConditionWrapper');

            const $finishConditionLabel = document.createElement('span');
            $finishConditionLabel.classList.add('finishConditionLabel');
            $finishConditionLabel.textContent = this.locale.get('interview_create_step_finish_condition_label', this.lang) || 'Finish Condition:';
            $finishConditionWrapper.appendChild($finishConditionLabel);

            const finishConditionForm = new TextField({
                id: `finishConditionForm_${index}`,
                fieldName: `finishCondition_${index}`,
                validators: [
                    new Validator({
                        errorType: ValidationErrorType.required,
                        errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                    }),
                    new Validator({
                        errorType: ValidationErrorType.maxLength,
                        errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                        maxLength: 100 
                    }),
                ],
                defaultValue: step.finish_condition,
                hasTitle: false,
                placeholder: "Enter the finish condition.",
                isCounter: false,
            });
            finishConditionForm.$view.classList.add('finishConditionForm')
            this.finishConditionForms[index] = finishConditionForm;
            $finishConditionWrapper.appendChild(finishConditionForm.$view);

            // **Max Turns Wrapper**
            const $maxTurnsWrapper = document.createElement('div');
            $maxTurnsWrapper.classList.add('maxTurnsWrapper');

            const $maxTurnsLabel = document.createElement('span');
            $maxTurnsLabel.classList.add('maxTurnsLabel');
            $maxTurnsLabel.textContent = this.locale.get('interview_create_step_max_turns_label', this.lang) || 'Max Turns:';
            $maxTurnsWrapper.appendChild($maxTurnsLabel);

            const maxTurnsForm = new TextField({
                id: `maxTurnsForm_${index}`,
                fieldName: `maxTurns_${index}`,
                validators: [
                    new Validator({
                        errorType: ValidationErrorType.positiveIntegerFormat,
                        errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, this.lang),
                        min: 1,
                        max: 10
                    })
                ],
                defaultValue: String(step.max_turns),
                isCounter: false,
                isIncrementer: true,
                incrementButtonPlace: TextFieldPlaceTo.inputAfter,
                incrementUpImgSrc: '/img/up.svg',
                incrementDownImgSrc: '/img/down.svg',
            });
            maxTurnsForm.$view.classList.add('maxTurnsForm');
            this.maxTurnsForms[index] = maxTurnsForm;
            $maxTurnsWrapper.appendChild(maxTurnsForm.$view);

            $hiddenContent.appendChild($finishConditionWrapper);
            $hiddenContent.appendChild($maxTurnsWrapper);

            $instructionsWrapper.appendChild($hiddenContent);

            // **More Detail Event Listener**
            $moreDetail.addEventListener('click', () => {
                $hiddenContent.classList.toggle('expanded');
                $moreDetail.classList.toggle('rotated');
            });

            $stepContent.appendChild($instructionsWrapper);

            $stepContainer.appendChild($stepContent);

            $interviewCreateViewContainer.appendChild($stepContainer);
        });

        const $endArrowContainer = document.createElement('div');
        $endArrowContainer.classList.add('endArrowContainer');

        const $endArrow = document.createElement('img');
        $endArrow.src = '/img/interviews/step-arrow.svg';
        $endArrow.classList.add('endArrow');
        $endArrowContainer.appendChild($endArrow);

        $interviewCreateViewContainer.appendChild($endArrowContainer);
 

        // **End Container**
        const $endContainer = document.createElement('div');
        $endContainer.classList.add('endContainer');

        const $endLabel = document.createElement('span');
        $endLabel.classList.add('endLabel');
        $endLabel.textContent = this.locale.get('interview_create_end_label', this.lang) || 'Closing Remarks:';
        $endContainer.appendChild($endLabel);

        const endForm = new TextField({
            id: 'endForm',
            fieldName: 'end',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: 300 
                }),
            ],
            defaultValue: this.interview.end,
            hasTitle: false,
            placeholder: "Enter the closing remarks.",
            isCounter: false,
        });
        this.endForm = endForm;
        $endContainer.appendChild(endForm.$view);

        $interviewCreateViewContainer.appendChild($endContainer);

        // Append the summary view to the main view
        this.$view.appendChild($interviewCreateViewContainer);

    }

    mount($parent) {
        $parent.innerHTML = '';
        $parent.appendChild(this.$view);
    }

    interviewObjectFromFormData() {
        const title = this.titleForm.value;
        const introduction = this.introductionForm.value;
        const end = this.endForm.value;

        const steps = this.questionForms.map((questionForm, index) => ({
            question: questionForm.value,
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

        const $message = document.getElementById('InterviewCreateModalViewMessage');
        $message.classList.remove('alert', 'success');
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
                this.handleError(error, $message);
            }
        );
    }

    submitUpdateInterview(interviewId) {
        const interviewJSON = this.interviewObjectFromFormData();

        const $message = document.getElementById('InterviewCreateModalViewMessage');
        $message.textContent = '';

        Http.post(`/v1/${this.lang}/interviews/${interviewId}/update`, interviewJSON,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                $message.classList.add('success');
                $message.textContent = message;
            },
            (error) => {
                this.handleError(error, $message);
            }
        );
    }

    handleError(error, $message) {
        if (error && error.code) {
            console.log(`[error] code:${error.code} reason:${error.reason} message:${error.message}`);
            const { errors, message } = error; 
            if (errors) {
                errors.forEach(errorObj => {
                    const { field_name, message } = errorObj;
                    // Handle specific field errors if needed
                });
            } else if (message) {
                $message.classList.add('alert');
                $message.textContent = message;
            }
        } else {
            console.error(error);
            $message.classList.add('alert');
            $message.textContent = 'An unexpected error occurred.';
        }
    }

    createUrlView(interviewId) {
        // Your existing implementation
    }
}
