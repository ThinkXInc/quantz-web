class InterviewCreateView {
    constructor({
        id,
        locale,
        lang,
        user,
        interviewId,
        interview,
        $message,
        onInterviewCreated,
        maxSteps = 3
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.user = user;
        this.interviewId = interviewId;
        this.interview = interview || defaults;
        this.$message = $message;

        this.maxInstructions = 3;

        this.maxSteps = maxSteps;
        this.onInterviewCreated = onInterviewCreated;

        // Arrays to store DOM elements and forms for each step
        this.stepContainers = [];
        this.questionForms = [];
        this.finishConditionForms = [];
        this.maxTurnsForms = [];
        this.instructionForms = [];

        this.createView();
    }

    createView() {
        console.warn('Creating view for InterviewCreateView');
        // Create the main container
        this.$view = document.createElement('div');
        this.$view.id = this.id;
        this.$view.classList.add('InterviewCreateView');

        // **InterviewCreateView**
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
            placeholder: this.locale.get('interview_create_input_introduction_placeholder', this.lang),
            isCounter: false,
        });
        this.introductionForm = introductionForm;
        $introductionContainer.appendChild(introductionForm.$view);

        $interviewCreateViewContainer.appendChild($introductionContainer);

        // **Steps**
        this.interview.steps.forEach((step, index) => {
            console.warn(`Creating step container for step ${index + 1}`, step);

            const $stepContainer = this.createStepContainer(step, index);
            $interviewCreateViewContainer.appendChild($stepContainer);
            this.stepContainers[index] = $stepContainer;
        });

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

        // Ensure an empty step at the end if necessary
        this.ensureEmptyStepAtEnd();

        // append the container to main view
        this.$view.appendChild($interviewCreateViewContainer);
        this.$interviewCreateViewContainer = $interviewCreateViewContainer;

        this.updateRemoveButtonVisibility();
    }

    createStepContainer(step, index) {
        console.warn(`Creating container for step ${index + 1}`, step);
        // **Step Container**
        const $stepContainer = document.createElement('div');
        $stepContainer.classList.add('stepContainer');
        $stepContainer.dataset.index = index;

        // **Step Title**
        const $stepTitle = document.createElement('h3');
        $stepTitle.classList.add('stepTitle');
        const stepLabelTemplate = this.locale.get('interview_create_steps_label', this.lang) || 'Step $0';
        $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1);
        $stepContainer.appendChild($stepTitle);

        // **Step Content Container**
        const $stepContent = document.createElement('div');
        $stepContent.classList.add('stepContent');

        // **Question and Remove Wrapper**
        const $questionAndRemoveWrapper = document.createElement('div');
        $questionAndRemoveWrapper.classList.add('questionAndRemoveWrapper');

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
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: 300 
                }),
            ],
            defaultValue: step.question,
            hasTitle: false,
            placeholder: this.locale.get("interview_create_input_question_placeholder", this.lang),
            isCounter: false,
        });
        questionForm.$view.classList.add('questionForm');
        this.questionForms[index] = questionForm;
        $questionWrapper.appendChild(questionForm.$view);

        // **Event Listener for Question Field**
        questionForm.$textField.addEventListener('textchanged', (e) => {
            const isLastStep = questionForm === this.questionForms[this.questionForms.length -1];
            if (isLastStep) {
                this.ensureEmptyStepAtEnd();
            }
        });
 
        // **Remove Step Button**
        const $removeStepButton = document.createElement('img');
        $removeStepButton.src = '/img/interviews/minus-icon.svg';
        $removeStepButton.classList.add('removeStepButton');
        $removeStepButton.style.cursor = 'pointer';
 
        $removeStepButton.addEventListener('click', () => {
            const idx = this.stepContainers.indexOf($stepContainer);
            this.removeStep(idx);
        });
 
        // Append question wrapper and remove button to the new wrapper
        $questionAndRemoveWrapper.appendChild($questionWrapper);
        $questionAndRemoveWrapper.appendChild($removeStepButton);
 
        $stepContent.appendChild($questionAndRemoveWrapper);

        // **Instructions Wrapper**
        const $instructionsWrapper = document.createElement('div');
        $instructionsWrapper.classList.add('instructionsWrapper');

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

        // **Instructions Label**
        const $instructionsLabel = document.createElement('span');
        $instructionsLabel.classList.add('instructionsLabel');
        $instructionsLabel.textContent = this.locale.get('interview_create_step_instructions_label', this.lang) || 'Instructions:';
        $hiddenContent.appendChild($instructionsLabel);

        // **Instructions List**
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
            console.warn(`Instruction ${idx + 1} form created for step ${index + 1}`);

            const $instructionWrapper = document.createElement('div');
            $instructionWrapper.classList.add('instructionWrapper');

            const $indexSpan = document.createElement('span');
            $indexSpan.classList.add('index');
            $indexSpan.textContent = idx + 1;

            $instructionWrapper.appendChild($indexSpan);
            $instructionWrapper.appendChild(instructionForm.$view);

            $instructionsList.appendChild($instructionWrapper);
            console.warn(`Instruction ${idx + 1} added to step ${index + 1} container`);
        });

        $hiddenContent.appendChild($instructionsList);

        // **Add Instruction Button Container**
        const $addInstructionButtonContainer = document.createElement('div');
        $addInstructionButtonContainer.classList.add('addInstructionButtonContainer');
        $addInstructionButtonContainer.style.display = 'flex';
        $addInstructionButtonContainer.style.justifyContent = 'center';

        // **Add Instruction Button**
        const $addInstructionButton = document.createElement('img');
        $addInstructionButton.src = '/img/interviews/plus-icon.svg';
        $addInstructionButton.classList.add('addInstructionButton');
        $addInstructionButton.style.cursor = 'pointer';

        $addInstructionButtonContainer.appendChild($addInstructionButton);

        // Hide the button if the number of instructions is >= 3
        if (this.instructionForms[index].length >= 3) {
            $addInstructionButtonContainer.style.display = 'none';
        }

        $hiddenContent.appendChild($addInstructionButtonContainer);

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
                    max: 5
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

        // **Add Instruction Button Event Listener**
        $addInstructionButton.addEventListener('click', () => {
            const idx = this.instructionForms[index].length;
            if (idx >= 3) {
                return;
            }
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
                defaultValue: '',
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

            if (this.instructionForms[index].length >= 3) {
                $addInstructionButtonContainer.style.display = 'none';
            }
        });

        $stepContent.appendChild($instructionsWrapper);
        $stepContainer.appendChild($stepContent);

        // Store references
        this.questionForms[index] = questionForm;
        this.finishConditionForms[index] = finishConditionForm;
        this.maxTurnsForms[index] = maxTurnsForm;
        //this.instructionForms[index] = []; // Initialize instructions array

        console.warn(`Step container created for step ${index + 1}`);
        console.warn($stepContainer)

        // Return the step container
        console.warn(`Finished creation of step container for step ${index + 1}`);
        return $stepContainer;
    }

    addStep() {
        if (this.interview.steps.length >= this.maxSteps) {
            console.warn('Max steps reached. Cannot add more steps.');
            return;
        }
    
        const newStep = defaultStep();
        this.interview.steps.push(newStep);
    
        console.warn(`Adding new step at index ${this.interview.steps.length - 1}`, newStep);
    
        const index = this.interview.steps.length - 1;
        const $newStepContainer = this.createStepContainer(newStep, index);
    
        // Find the position for the new step
        const $lastStepContainer = this.stepContainers[this.stepContainers.length - 1];
        const $endContainer = this.$interviewCreateViewContainer.querySelector('.endContainer');
    
        // Insert the new step container after the last step container, before the endContainer
        if ($lastStepContainer) {
            this.$interviewCreateViewContainer.insertBefore($newStepContainer, $endContainer);
        } else {
            this.$interviewCreateViewContainer.appendChild($newStepContainer);
        }
    
        this.stepContainers.push($newStepContainer);
        this.updateRemoveButtonVisibility();
    }
    

    removeStep(index) {
        console.warn(`Removing step at index ${index}`);
    
        // Remove the step data from interview steps
        this.interview.steps.splice(index, 1);
    
        // Remove the step DOM element
        const $stepContainer = this.stepContainers[index];
        if ($stepContainer && $stepContainer.parentNode) {
            $stepContainer.parentNode.removeChild($stepContainer);
        }
    
        // Remove the step from arrays
        this.stepContainers.splice(index, 1);
        this.questionForms.splice(index, 1);
        this.finishConditionForms.splice(index, 1);
        this.maxTurnsForms.splice(index, 1);
        this.instructionForms.splice(index, 1);
    
        // Update indices for the remaining steps
        this.updateStepIndices();
    
        // Update remove button visibility
        this.updateRemoveButtonVisibility();
    
        // Ensure an empty step if needed
        this.ensureEmptyStepAtEnd();
    
        console.warn(`Step ${index + 1} removed. Remaining steps: ${this.interview.steps.length}`);
    }
    
    updateStepIndices() {
        console.warn('Updating step indices');
    
        this.stepContainers.forEach(($stepContainer, index) => {
            $stepContainer.dataset.index = index;  // Update dataset index
            const $stepTitle = $stepContainer.querySelector('.stepTitle');
            const stepLabelTemplate = this.locale.get('interview_create_steps_label', this.lang) || 'Step $0';
            $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1); // Update step label
        });
    
        console.warn('Step indices updated');
    }

    updateRemoveButtonVisibility() {
        const visible = this.interview.steps.length > 1;
        console.warn(`Setting remove button visibility to ${visible ? 'visible' : 'hidden'}`);

        if (this.interview.steps.length <= 1) {
            const $removeStepButton = this.stepContainers[0].querySelector('.removeStepButton');
            $removeStepButton.style.display = 'none';
        } else {
            this.stepContainers.forEach($stepContainer => {
                const $removeStepButton = $stepContainer.querySelector('.removeStepButton');
                $removeStepButton.style.display = 'block';
            });
        }
    }

    ensureEmptyStepAtEnd() {
        // Ensure that if the last questionForm is filled, and steps are less than maxSteps, we add a new empty step
        if (this.interview.steps.length < this.maxSteps) {
            const lastQuestionForm = this.questionForms[this.questionForms.length -1];
            if (lastQuestionForm && lastQuestionForm.value && lastQuestionForm.value.trim() !== '') {
                this.addStep();
            } else if (!lastQuestionForm) {
                // If there are no question forms yet, add an initial step
                this.addStep();
            }
        }
    }

    mount($parent) {
        $parent.appendChild(this.$view);
    }

    interviewObjectFromFormData() {
        const title = this.titleForm.value;
        const introduction = this.introductionForm.value;
        const end = this.endForm.value;
    
        const steps = [];
        let hasQuestionValue = false;
    
        this.questionForms.forEach((questionForm, index) => {
            if (questionForm?.value?.trim()) {
                hasQuestionValue = true;
                const step = {
                    question: questionForm.value,
                    finish_condition: this.finishConditionForms[index]?.value || '',
                    max_turns: parseInt(this.maxTurnsForms[index]?.value || '0', 10),
                    instructions: (this.instructionForms[index] || []).map(instructionForm => instructionForm?.value || '')
                };
                steps.push(step);
            }
        });
    
        // If no question form has value, show an alert on the first question form
        if (!hasQuestionValue && this.questionForms.length > 0) {
            this.questionForms[0].alert(this.locale.get("interview_create_no_question_error", this.lang));
            console.log('No question. return.')
            return null;
        }
    
        return {
            title: title,
            introduction: introduction,
            end: end,
            steps: steps
        };
    }
    
    

    submitCreateInterview() {
        const interviewJSON = this.interviewObjectFromFormData();
        if (!interviewJSON) {
            return
        }

        if (this.$message) {
            this.$message.classList.remove('alert', 'success');
            this.$message.textContent = '';
        } else {
            console.error(`InterviewCreateView.$message not exist.`)
        }

        Http.post(`/v1/${this.lang}/interviews/create`, interviewJSON,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.$message.classList.add('success');
                this.$message.textContent = message;

                this.interviewId = res.id;
                // show url
                if (this.onInterviewCreated) {
                    this.onInterviewCreated(this.interviewId);
                }
            },
            (error) => {
                this.handleError(error, this.$message);
            }
        );
    }

    submitUpdateInterview(interviewId) {
        const interviewJSON = this.interviewObjectFromFormData();

        const $message = document.getElementById('InterviewSettingsModalViewMessage');
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
    
                    // Find the relevant TextField based on the field_name and call the error method
                    switch (field_name) {
                        case 'title':
                            this.titleForm?.alert(message);
                            break;
                        case 'introduction':
                            this.introductionForm?.alert(message);
                            break;
                        case 'end':
                            this.endForm?.alert(message);
                            break;
                        default:
                            // Check if the field belongs to a specific step
                            const stepMatch = field_name.match(/^question_(\d+)$/);
                            if (stepMatch) {
                                const stepIndex = parseInt(stepMatch[1], 10);
                                this.questionForms[stepIndex]?.alert(message);
                            }
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
            $message.textContent = 'An unexpected error occurred.';
        }
    }
    
}
