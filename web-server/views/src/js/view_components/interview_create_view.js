const defaultStep = () => ({
    "topic": "Recruiting Interview",
    "remark": "",
    "goal": "Interviewee answered it's done.",
    "max_turns": 3,
    "response_mode": 1,
    "guidelines": [
        "First, read the remark.",
        "When the answer looks done, ask 'Are you sure that\'s it?'"
    ]
});

const defaults = {
    "title": "",
    //"introduction": "Hello, {name}. Are you ready?",
    //"end": "Thank you {name}. This is the end. Goodbye.",
    "steps": [
        defaultStep()
    ]
}

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

        this.maxGuidelines = 3;

        this.maxSteps = maxSteps;
        this.onInterviewCreated = onInterviewCreated;

        // Arrays to store DOM elements and forms for each step
        this.stepContainers = [];
        this.topicForms = [];
        this.remarkForms = [];
        this.goalForms = [];
        this.maxTurnsForms = [];
        this.instructionForms = [];

        this.fetchMaterials();
        this.materialsReady = new Promise((resolve, reject) => {
            this._materialsReadyResolver = resolve;
            this._materialsReadyRejecter = reject;
        });

        this.createView();
    }

    fetchMaterials() {
        Http.get(`/v1/${this.lang}/materials/list`,
            (res) => {
                const { code, materials, count, message } = res;  // array of {id, title, text, ...}
                console.log(`${code}: ${message} [count ${count}]`);
                this.materialItems = materials.map(m => new ListItem({
                    title: m.title,
                    description: m.text,
                    value: String(m._id)
                }));
                this._materialsReadyResolver();
            },
            (err) => {
                console.error("Failed to fetch materials: ", err);
                this._materialsReadyRejecter(err);
            }
        );
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

        // **Steps**
        this.interview.steps.forEach((step, index) => {
            console.warn(`Creating step container for step ${index + 1}`, step);

            const $stepContainer = this.createStepContainer(step, index);
            $interviewCreateViewContainer.appendChild($stepContainer);
            this.stepContainers[index] = $stepContainer;
        });

        //// **End Container**
        //const $endContainer = document.createElement('div');
        //$endContainer.classList.add('endContainer');

        //const $endLabel = document.createElement('span');
        //$endLabel.classList.add('endLabel');
        //$endLabel.textContent = this.locale.get('interview_create_end_label', this.lang) || 'Closing Remarks:';
        //$endContainer.appendChild($endLabel);

        //const endForm = new TextField({
        //    id: 'endForm',
        //    fieldName: 'end',
        //    validators: [
        //        new Validator({
        //            errorType: ValidationErrorType.required,
        //            errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
        //        }),
        //        new Validator({
        //            errorType: ValidationErrorType.maxLength,
        //            errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
        //            maxLength: 300 
        //        }),
        //    ],
        //    defaultValue: this.interview.end,
        //    hasTitle: false,
        //    placeholder: "Enter the closing remarks.",
        //    isCounter: false,
        //});
        //this.endForm = endForm;
        //$endContainer.appendChild(endForm.$view);

        //$interviewCreateViewContainer.appendChild($endContainer);

        // Assign the container before calling methods that use it
        this.$interviewCreateViewContainer = $interviewCreateViewContainer;

        // Ensure an empty step at the end if necessary
        //this.ensureEmptyStepAtEnd();

        // append the container to main view
        this.$view.appendChild($interviewCreateViewContainer);

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

        // ----------------------------------------------------------------------
        // 1) TOPIC
        // ----------------------------------------------------------------------
        const $topicWrapper = document.createElement('div');
        $topicWrapper.classList.add('topicWrapper');
        $topicWrapper.classList.add('configItemWrapper');

        const $topicLabel = document.createElement('span');
        $topicLabel.classList.add('topicLabel');
        $topicLabel.classList.add('configItemLabel');
        // "Topic/Content for this step"
        $topicLabel.textContent = this.locale.get(
          'interview_create_step_topic_label', 
          this.lang
        ) || 'Topic/Content:';
        $topicWrapper.appendChild($topicLabel);

        const topicForm = new TextField({
            id: `topicForm_${index}`,
            fieldName: `topic_${index}`,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: 300 
                }),
            ],
            defaultValue: step.topic,
            hasTitle: false,
            placeholder: this.locale.get("interview_create_input_topic_placeholder", this.lang),
            isCounter: false,
        });
        topicForm.$view.classList.add('topicForm');
        this.topicForms[index] = topicForm;
        $topicWrapper.appendChild(topicForm.$view);

        //// Trigger add empty step if topic is filled
        //topicForm.$textField.addEventListener('textchanged', (e) => {
        //    const isLastStep = topicForm === this.topicForms[this.topicForms.length -1];
        //    if (isLastStep) {
        //        this.ensureEmptyStepAtEnd();
        //    }
        //});

        $stepContent.appendChild($topicWrapper);

        // ----------------------------------------------------------------------
        // 2) REMARK (Question)
        // ----------------------------------------------------------------------
        // **Remark and Remove Wrapper**
        const $remarkAndRemoveWrapper = document.createElement('div');
        $remarkAndRemoveWrapper.classList.add('remarkAndRemoveWrapper');
        $remarkAndRemoveWrapper.classList.add('configItemWrapper');

        // **Remark Wrapper**
        const $remarkWrapper = document.createElement('div');
        $remarkWrapper.classList.add('remarkWrapper');
        $remarkWrapper.classList.add('configItemWrapper');
 
        const $remarkLabel = document.createElement('span');
        $remarkLabel.classList.add('remarkLabel');
        $remarkLabel.classList.add('configItemLabel');
        $remarkLabel.textContent = this.locale.get('interview_create_step_remark_label', this.lang) || 'Question:';
        $remarkWrapper.appendChild($remarkLabel);
 
        const remarkForm = new TextField({
            id: `remarkForm_${index}`,
            fieldName: `remark_${index}`,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: 300 
                }),
            ],
            defaultValue: step.remark,
            hasTitle: false,
            placeholder: this.locale.get("interview_create_input_remark_placeholder", this.lang),
            isCounter: false,
        });
        remarkForm.$view.classList.add('remarkForm');
        this.remarkForms[index] = remarkForm;
        $remarkWrapper.appendChild(remarkForm.$view);

        // **Event Listener for remark field**  
        //remarkForm.$textField.addEventListener('textchanged', (e) => {
        //    const isLastStep = remarkForm === this.remarkForms[this.remarkForms.length -1];
        //    if (isLastStep) {
        //        this.ensureEmptyStepAtEnd();
        //    }
        //});
 
        // **Remove Step Button**
        const $removeStepButton = document.createElement('img');
        $removeStepButton.src = '/img/interviews/minus-icon.svg';
        $removeStepButton.classList.add('removeStepButton');
        $removeStepButton.style.cursor = 'pointer';
 
        $removeStepButton.addEventListener('click', () => {
            const idx = this.stepContainers.indexOf($stepContainer);
            this.removeStep(idx);
        });
 
        $remarkAndRemoveWrapper.appendChild($remarkWrapper);
        $remarkAndRemoveWrapper.appendChild($removeStepButton);

        $stepContent.appendChild($remarkAndRemoveWrapper);

        // ----------------------------------------------------------------------
        // 3) GOAL (Finish Condition)
        // ----------------------------------------------------------------------
        const $goalWrapper = document.createElement('div');
        $goalWrapper.classList.add('goalWrapper');
        $goalWrapper.classList.add('configItemWrapper');

        const $goalLabel = document.createElement('span');
        $goalLabel.classList.add('configItemLabel');
        $goalLabel.classList.add('goalLabel');
        // "Goal/Completion criteria for this step"
        $goalLabel.textContent = this.locale.get(
          'interview_create_step_goal_label', 
          this.lang
        ) || 'Finish Condition:';
        $goalWrapper.appendChild($goalLabel);

        const goalForm = new TextField({
            id: `goalForm_${index}`,
            fieldName: `goal_${index}`,
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
            defaultValue: step.goal,
            hasTitle: false,
            placeholder: this.locale.get("interview_create_input_goal_placeholder", this.lang) 
              || "Enter the finish condition.",
            isCounter: false,
        });
        goalForm.$view.classList.add('goalForm');
        this.goalForms[index] = goalForm;
        $goalWrapper.appendChild(goalForm.$view);

        $stepContent.appendChild($goalWrapper);

        const $detailsWrapper = document.createElement('div');
        $detailsWrapper.classList.add('detailsWrapper');

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
        $detailsWrapper.appendChild($moreDetail);

        // **Hidden Content**
        const $hiddenContent = document.createElement('div');
        $hiddenContent.classList.add('hiddenContent');

        // ----------------------------------------------------------------------
        // GUIDELINES (Hidden area)
        // ----------------------------------------------------------------------
        // **Guidelines List**
        const $guidelinesWrapper = document.createElement('div');
        $guidelinesWrapper.classList.add('guidelinesWrapper');
        $guidelinesWrapper.classList.add('configItemWrapper');

        // **Guidelines Label**
        const $guidelinesLabel = document.createElement('span');
        $guidelinesLabel.classList.add('guidelinesLabel');
        $guidelinesLabel.classList.add('configItemLabel');
        $guidelinesLabel.textContent = this.locale.get('interview_create_step_guidelines_label', this.lang) || 'Guidelines:';
        $guidelinesWrapper.appendChild($guidelinesLabel);

        // Make sure we have a sub-array for guidelineForms
        if (!this.guidelineForms) {
            this.guidelineForms = [];
        }
        if (!this.guidelineForms[index]) {
            this.guidelineForms[index] = [];
        }
        this.guidelineForms[index] = [];

        step.guidelines.forEach((guideline, idx) => {
            const guidelineForm = new TextField({
                id: `guidelineForm_${index}_${idx}`,
                fieldName: `guideline_${index}_${idx}`,
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
                defaultValue: guideline,
                hasTitle: false,
                placeholder: `Enter guideline ${idx + 1}.`,
                isCounter: false,
            });
            guidelineForm.$view.classList.add('guidelineForm');
            this.guidelineForms[index][idx] = guidelineForm;

            const $guidelineWrapper = document.createElement('div');
            $guidelineWrapper.classList.add('guidelineWrapper');

            const $indexSpan = document.createElement('span');
            $indexSpan.classList.add('index');
            $indexSpan.textContent = idx + 1;

            $guidelineWrapper.appendChild($indexSpan);
            $guidelineWrapper.appendChild(guidelineForm.$view);

            $guidelinesWrapper.appendChild($guidelineWrapper);
        });

        $hiddenContent.appendChild($guidelinesWrapper);

        // **Add Guideline Button Container**
        const $addGuidelineButtonContainer = document.createElement('div');
        $addGuidelineButtonContainer.classList.add('addGuidelineButtonContainer');
        $addGuidelineButtonContainer.style.display = 'flex';
        $addGuidelineButtonContainer.style.justifyContent = 'center';

        // **Add Guideline Button**
        const $addGuidelineButton = document.createElement('img');
        $addGuidelineButton.src = '/img/interviews/plus-icon.svg';
        $addGuidelineButton.classList.add('addGuidelineButton');
        $addGuidelineButton.style.cursor = 'pointer';

        $addGuidelineButtonContainer.appendChild($addGuidelineButton);

        // Hide the button if the number of guidelines is >= 3
        if (this.guidelineForms[index].length >= 3) {
            $addGuidelineButtonContainer.style.display = 'none';
        }

        $guidelinesWrapper.appendChild($addGuidelineButtonContainer);


        // ----------------------------------------------------------------------
        // Detail 3) MAX TURNS
        // ----------------------------------------------------------------------
        const $maxTurnsWrapper = document.createElement('div');
        $maxTurnsWrapper.classList.add('maxTurnsWrapper');
        $maxTurnsWrapper.classList.add('configItemWrapper');

        const $maxTurnsLabel = document.createElement('span');
        $maxTurnsLabel.classList.add('maxTurnsLabel');
        $maxTurnsLabel.classList.add('configItemLabel');
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

        $hiddenContent.appendChild($maxTurnsWrapper);

        // ----------------------------------------------------------------------
        // Detail 2) REFERENCES (Multi-select)
        // ----------------------------------------------------------------------
        const $referencesWrapper = document.createElement('div');
        $referencesWrapper.classList.add('referencesWrapper');
        $referencesWrapper.classList.add('configItemWrapper');

        const $referencesLabel = document.createElement('span');
        $referencesLabel.classList.add('referencesLabel');
        $referencesLabel.classList.add('configItemLabel');
        $referencesLabel.textContent = this.locale.get(
          'view_create_reference_selector_label', 
          this.lang
        ) || 'Reference Materials:';
        $referencesWrapper.appendChild($referencesLabel);


        this.materialsReady.then(() => {
            // Create the multi-select dropdown
            const referencesDropdown = new DropdownButton({
                id: `referencesDropdown_${index}`,
                fieldName: `references_${index}`,
                title: '',
                description: this.locale.get('view_create_reference_selector_label', this.lang),
                type: DropdownMenuType.list,
                position: DropdownMenuDisplayPositionType.bottomover,
                hasSelectedIcon: true,
                items: this.materialItems || [],
                isMultiSelect: true,  // <-- the key part
                multiSelectDisplayTitle: this.locale.get('view_create_reference_selector_display_title', this.lang),
            });

            // If step already has references, pre-populate
            if (step.references && Array.isArray(step.references)) {
                referencesDropdown.value = step.references;  // sets the selected array
            }

            // Store a reference to the dropdown in an array so we can gather values in `interviewObjectFromFormData`
            if (!this.referencesDropdowns) {
                this.referencesDropdowns = [];
            }
            this.referencesDropdowns[index] = referencesDropdown;

            $referencesWrapper.appendChild(referencesDropdown.$view);
            //const $maxTurnsWrapper = document.querySelector('.maxTurnsWrapper');
            //if ($maxTurnsWrapper) {
            //    $hiddenContent.insertBefore($referencesWrapper, $maxTurnsWrapper);
            //} else {
            //    $hiddenContent.appendChild($referencesWrapper); // Fallback if maxTurnsWrapper doesn't exist
            //}
            $hiddenContent.appendChild($referencesWrapper);
        }).catch((error) => {
            console.error("Materials failed to fetch:", error);
        });

        $detailsWrapper.appendChild($hiddenContent);

        // **More Detail Event Listener**
        $moreDetail.addEventListener('click', () => {
            $hiddenContent.classList.toggle('expanded');
            $moreDetail.classList.toggle('rotated');
        });

        // **Add Guideline Button Event Listener**
        $addGuidelineButton.addEventListener('click', () => {
            const idx = this.guidelineForms[index].length;
            if (idx >= 3) {
                return;
            }
            const guidelineForm = new TextField({
                id: `guidelineForm_${index}_${idx}`,
                fieldName: `guideline_${index}_${idx}`,
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
                placeholder: `Enter guideline ${idx + 1}.`,
                isCounter: false,
            });
            guidelineForm.$view.classList.add('guidelineForm');
            this.guidelineForms[index][idx] = guidelineForm;

            const $guidelineWrapper = document.createElement('div');
            $guidelineWrapper.classList.add('guidelineWrapper');

            const $indexSpan = document.createElement('span');
            $indexSpan.classList.add('index');
            $indexSpan.textContent = idx + 1;

            $guidelineWrapper.appendChild($indexSpan);
            $guidelineWrapper.appendChild(guidelineForm.$view);

            $guidelinesWrapper.appendChild($guidelineWrapper);

            if (this.guidelineForms[index].length >= 3) {
                $addGuidelineButtonContainer.style.display = 'none';
            }
            this.guidelineForms[index].push(guidelineForm); // add to guidelineForms
        });

        $stepContent.appendChild($detailsWrapper);
        $stepContainer.appendChild($stepContent);

        // Store references
        this.remarkForms[index] = remarkForm;
        this.goalForms[index] = goalForm;
        this.topicForms[index] = topicForm;
        this.maxTurnsForms[index] = maxTurnsForm;

        console.warn(`Step container created for step ${index + 1}`);
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
        //const $endContainer = this.$interviewCreateViewContainer.querySelector('.endContainer');
    
        // Insert the new step container after the last step container, before the endContainer
        //if ($lastStepContainer) {
        //    this.$interviewCreateViewContainer.insertBefore($newStepContainer, $endContainer);
        //} else {
            this.$interviewCreateViewContainer.appendChild($newStepContainer);
        //}
    
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
        this.topicForms.splice(index, 1);
        this.remarkForms.splice(index, 1);
        this.goalForms.splice(index, 1);
        this.maxTurnsForms.splice(index, 1);
        this.instructionForms.splice(index, 1);
        if (this.guidelineForms && this.guidelineForms[index]) {
            this.guidelineForms.splice(index, 1);
        }
    
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
            $stepContainer.dataset.index = index;
            const $stepTitle = $stepContainer.querySelector('.stepTitle');
            const stepLabelTemplate = this.locale.get('interview_create_steps_label', this.lang) || 'Step $0';
            $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1); 
        });
        console.warn('Step indices updated');
    }

    updateRemoveButtonVisibility() {
        const visible = this.interview.steps.length > 1;
        console.warn(`Setting remove button visibility to ${visible ? 'visible' : 'hidden'}`);

        // If there's only one step, hide the remove button on that step
        if (this.interview.steps.length <= 1 && this.stepContainers.length > 0) {
            const $removeStepButton = this.stepContainers[0].querySelector('.removeStepButton');
            if ($removeStepButton) {
                $removeStepButton.style.display = 'none';
            }
        } else {
            this.stepContainers.forEach($stepContainer => {
                const $removeStepButton = $stepContainer.querySelector('.removeStepButton');
                if ($removeStepButton) {
                    $removeStepButton.style.display = 'block';
                }
            });
        }
    }

    ensureEmptyStepAtEnd() {
        // Ensure that if the last topic/remark is filled and steps are < maxSteps, we add a new empty step
        if (this.interview.steps.length < this.maxSteps) {
            const lastTopicForm = this.topicForms[this.topicForms.length -1];
            const lastRemarkForm = this.remarkForms[this.remarkForms.length -1];
            if (
                (lastTopicForm && lastTopicForm.value && lastTopicForm.value.trim() !== '') ||
                (lastRemarkForm && lastRemarkForm.value && lastRemarkForm.value.trim() !== '')
            ) {
                this.addStep();
            } else if (!lastTopicForm && !lastRemarkForm) {
                // If there are no topic/remark forms yet, add an initial step
                this.addStep();
            }
        }
    }

    mount($parent) {
        $parent.appendChild(this.$view);
    }

    interviewObjectFromFormData() {
        const title = this.titleForm.value;
        const steps = [];
        let hasQuestionValue = false;

        // Build each step from forms
        this.topicForms.forEach((topicForm, index) => {
            const remarkForm = this.remarkForms[index];
            const goalForm = this.goalForms[index];
            const maxTurnsForm = this.maxTurnsForms[index];
            const guidelinesArray = this.guidelineForms[index] || [];
            const referencesDropdown = this.referencesDropdowns ? this.referencesDropdowns[index] : null;

            const topicVal = topicForm?.value?.trim() || '';
            const remarkVal = remarkForm?.value?.trim() || '';

            // If user typed something in remark or topic, it's a valid step
            if (topicVal || remarkVal) {
                hasQuestionValue = true;
                const referencesVal = referencesDropdown?.value || []; 

                const step = {
                    topic: topicVal,
                    remark: remarkVal,
                    goal: goalForm?.value || '',
                    max_turns: parseInt(maxTurnsForm?.value || '0', 10),
                    guidelines: guidelinesArray.map(gForm => gForm?.value || ''),
                    references: referencesVal
                };
                steps.push(step);
            }
        });
    
        // If no topic/remark form has value, show an alert on the first step’s remark
        if (!hasQuestionValue && this.remarkForms.length > 0) {
            this.remarkForms[0].alert(
              this.locale.get("interview_create_no_remark_error", this.lang)
            );
            console.log('No topic or remark. return.');
            return null;
        }
    
        return {
            title: title,
            steps: steps
        };
    }

    submitCreateInterview() {
        const interviewJSON = this.interviewObjectFromFormData();
        if (!interviewJSON) {
            return;
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
        if (!interviewJSON) {
            return;
        }

        this.$message.textContent = '';

        Http.post(`/v1/${this.lang}/interviews/${interviewId}/update`, interviewJSON,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.$message.classList.add('success');
                this.$message.textContent = message;
            },
            (error) => {
                this.handleError(error, this.$message);
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
    
                    switch (field_name) {
                        case 'title':
                            this.titleForm?.alert(message);
                            break;
                        //case 'end':
                        //    this.endForm?.alert(message);
                        //    break;
                        default:
                            // Check if the field belongs to a specific step
                            const stepMatchTopic = field_name.match(/^topic_(\d+)$/);
                            const stepMatchRemark = field_name.match(/^remark_(\d+)$/);
                            const stepMatchGoal  = field_name.match(/^goal_(\d+)$/);
                            const stepMatchGuide = field_name.match(/^guideline_(\d+)_(\d+)$/);

                            if (stepMatchTopic) {
                                const stepIndex = parseInt(stepMatchTopic[1], 10);
                                this.topicForms[stepIndex]?.alert(message);
                            } else if (stepMatchRemark) {
                                const stepIndex = parseInt(stepMatchRemark[1], 10);
                                this.remarkForms[stepIndex]?.alert(message);
                            } else if (stepMatchGoal) {
                                const stepIndex = parseInt(stepMatchGoal[1], 10);
                                this.goalForms[stepIndex]?.alert(message);
                            } else if (stepMatchGuide) {
                                const stepIndex    = parseInt(stepMatchGuide[1], 10);
                                const guideSubIndex = parseInt(stepMatchGuide[2], 10);
                                this.guidelineForms[stepIndex][guideSubIndex]?.alert(message);
                            } else if (message) {
                                $message.classList.add('alert');
                                $message.textContent = message;
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
