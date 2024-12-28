const TaskType = {
    FREE_CONVERSATION: "free",
    GREETING: "greeting",
    QUESTION: "question",
    EXPLANATION: "explanation",
    TEST: "test",
    CONSULTING: "consulting"
};

const ResponseMode = {
    TEMPO_ORIENTED: 0,
    NORMAL: 1,
    CAREFUL_LISTENING: 2,
    WAIT_MANUAL_SUBMIT: 3
};

const ReferenceType = {
    ALL: "all",
    NONE: "none",
    SELECT: "select"
};

const taskTypeConfigs = {
    [TaskType.GREETING]: {
        maxTurns: 2,
        responseMode: ResponseMode.TEMPO_ORIENTED,  // 0
        referenceType: ReferenceType.NONE,          // 'none'
        showRemark: true
    },
    [TaskType.FREE_CONVERSATION]: {
        maxTurns: 20,
        responseMode: ResponseMode.TEMPO_ORIENTED,  // 0
        referenceType: ReferenceType.ALL,           // 'all'
        showRemark: true//false
    },
    [TaskType.QUESTION]: {
        maxTurns: 3,
        responseMode: ResponseMode.CAREFUL_LISTENING, // 2
        referenceType: ReferenceType.NONE,            // 'none'
        showRemark: true
    },
    [TaskType.EXPLANATION]: {
        maxTurns: 3,
        responseMode: ResponseMode.NORMAL, // 1
        referenceType: ReferenceType.ALL,  // 'all'
        showRemark: true
    },
    [TaskType.TEST]: {
        maxTurns: 3,
        responseMode: ResponseMode.WAIT_MANUAL_SUBMIT, // 3
        referenceType: ReferenceType.ALL,              // 'all'
        showRemark: true
    },
    [TaskType.CONSULTING]: {
        maxTurns: 5,
        responseMode: ResponseMode.NORMAL, // 1
        referenceType: ReferenceType.ALL,  // 'all'
        showRemark: true
    }
};

const defaultStep = () => ({
    task_type: TaskType.CONSULTING,
    topic: "Recruiting Interview",
    remark: "",
    goal: "Interviewee answered it's done.",
    max_turns: 3,
    response_mode: 1,
    reference_type: "all",
    guidelines: [
        "First, read the remark.",
        "When the answer looks done, ask 'Are you sure that's it?'"
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

class ProgramView {
    constructor({
        id,
        locale,
        lang,
        user,
        interactionModelId,
        interactionModel,
        $message,
        onInteractionModelCreated,
        maxSteps = 3
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
 
        this.user = user;
        this.interactionModelId = interactionModelId;
        this.interactionModel = interactionModel || defaults;
        this.$message = $message;

        this.maxGuidelines = 3;

        this.maxSteps = maxSteps;
        this.onInteractionModelCreated = onInteractionModelCreated;

        // Arrays to store DOM elements and forms for each step
        this.stepContainers = [];
        this.taskTypeSelectors = [];
        this.topicForms = [];
        this.remarkForms = [];
        this.goalForms = [];
        this.maxTurnsForms = [];
        this.instructionForms = [];
        this.responseModeSelectors = []; 
        this.referenceTypeSelectors = [];
        this.referencesSelectors = [];

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
        console.warn('***Creating view for ProgramView');
        // Create the main container
        this.$view = document.createElement('div');
        this.$view.id = this.id;
        this.$view.classList.add('ProgramView');

        // **ProgramView**
        const $interviewCreateViewContainer = document.createElement('div');
        $interviewCreateViewContainer.classList.add('ProgramViewContainer');

        // ───────────────────────────────────────────────────────────────────────────
        //  1) HEADER CONTAINER
        //     holds: titleForm + loadingMessage
        // ───────────────────────────────────────────────────────────────────────────
        const $headerContainer = document.createElement('div');
        $headerContainer.classList.add('headerContainer');

        // Title container (wraps the titleForm)
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
            defaultValue: this.interactionModel.title,
            hasTitle: true,
            title: this.locale.get("create_title_label", this.lang),
            placeholder: this.locale.get("create_title_placeholder", this.lang),
            isCounter: false,
        });
        this.titleForm = titleForm;
        $titleContainer.appendChild(titleForm.$view);
        $headerContainer.appendChild($titleContainer);

        this.loadingMessage = new LoadingMessage({
            id: 'ProgramLoadingMessage',
            classList: 'hover-grad-txt',
            gradientStart: '#00ff00',
            gradientEnd: '#0000ff',
            alertColor: '#ff3333',
            pattern: LoadingMessagePattern.B
        });
        $headerContainer.appendChild(this.loadingMessage.$view);
        this.loadingMessage.setText('Loading..', {gradient: LoadingMessageGradient.ocean})

        $interviewCreateViewContainer.appendChild($headerContainer);


        // ───────────────────────────────────────────────────────────────────────────
        //  2) MAIN CONTAINER
        //     holds: stepContainer(s)
        // ───────────────────────────────────────────────────────────────────────────
        const $mainContainer = document.createElement('div');
        $mainContainer.classList.add('mainContainer');

        // **Steps**
        this.interactionModel.steps.forEach((step, index) => {
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
        //$endLabel.textContent = this.locale.get('create_end_label', this.lang) || 'Closing Remarks:';
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
        //    defaultValue: this.interactionModel.end,
        //    hasTitle: false,
        //    placeholder: "Enter the closing remarks.",
        //    isCounter: false,
        //});
        //this.endForm = endForm;
        //$endContainer.appendChild(endForm.$view);

        //$interviewCreateViewContainer.appendChild($endContainer);

        // Finally, append the mainContainer
        $interviewCreateViewContainer.appendChild($mainContainer);


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
        const stepLabelTemplate = this.locale.get('create_steps_label', this.lang) || 'Step $0';
        $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1);
        $stepContainer.appendChild($stepTitle);

        // **Step Content Container**
        const $stepContent = document.createElement('div');
        $stepContent.classList.add('stepContent');

        // ----------------------------------------------------------------------
        // 0) TASK TYPE
        // ----------------------------------------------------------------------
        const $taskTypeWrapper = document.createElement('div');
        $taskTypeWrapper.classList.add('taskTypeWrapper', 'configItemWrapper');
    
        //const $taskTypeLabel = document.createElement('span');
        //$taskTypeLabel.classList.add('taskTypeLabel', 'configItemLabel');
        //$taskTypeLabel.textContent = this.locale.get('create_task_type_selector_title', this.lang) || 'Task Type';
        //$taskTypeWrapper.appendChild($taskTypeLabel);
    
        const taskTypeItems = [
            new ListItem({
                title: this.locale.get('basic_configs_task_type_greeting', this.lang) || 'Greeting',
                value: TaskType.GREETING
            }),
            new ListItem({
                title: this.locale.get('basic_configs_task_type_free', this.lang) || 'Free Conversation',
                value: TaskType.FREE_CONVERSATION
            }),
            new ListItem({
                title: this.locale.get('basic_configs_task_type_question', this.lang) || 'Question',
                value: TaskType.QUESTION
            }),
            new ListItem({
                title: this.locale.get('basic_configs_task_type_explanation', this.lang) || 'Explanation',
                value: TaskType.EXPLANATION
            }),
            new ListItem({
                title: this.locale.get('basic_configs_task_type_test', this.lang) || 'Test',
                value: TaskType.TEST
            }),
            new ListItem({
                title: this.locale.get('basic_configs_task_type_consulting', this.lang) || 'Consulting',
                value: TaskType.CONSULTING
            })
        ];
    
        const taskTypeSelector = new DropdownButton({
            id: `taskTypeSelector_${index}`,
            fieldName: `task_type_${index}`,
            title: '',
            description: this.locale.get('create_task_type_selector_title', this.lang), 
            type: DropdownMenuType.list,
            position: DropdownMenuDisplayPositionType.bottomover,
            hasSelectedIcon: true,
            isMultiSelect: false,
            items: taskTypeItems,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                })
            ],
        });
        taskTypeSelector.value = step.task_type || TaskType.CONSULTING;
        this.taskTypeSelectors[index] = taskTypeSelector;
        $stepContainer.classList.add(step.task_type)
    
        taskTypeSelector.$view.addEventListener('selected', (e) => {
            const selectedValue = e.detail.value;  // greeting, free, ...
            this.onTaskTypeChanged(index, selectedValue);
            Object.values(TaskType).forEach((task) => {
                $stepContainer.classList.remove(task);
            });
            $stepContainer.classList.add(e.detail.value)
        });
    
        $taskTypeWrapper.appendChild(taskTypeSelector.$view);
        $stepContent.appendChild($taskTypeWrapper);

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
          'create_step_topic_label', 
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
            placeholder: this.locale.get("create_input_topic_placeholder", this.lang),
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
        // **Remark Wrapper**
        const $remarkWrapper = document.createElement('div');
        $remarkWrapper.classList.add('remarkWrapper', 'configItemWrapper');

        const $remarkLabel = document.createElement('span');
        $remarkLabel.classList.add('remarkLabel', 'configItemLabel');

        if (!step.task_type) {
            step.task_type = TaskType.CONSULTING
        }

        // We look up the label/placeholder according to step.task_type
        const remarkLabelKey       = `create_remark_label_${step.task_type}`;
        const defaultLabelKey       = 'create_step_remark_label'; // fallback
        const remarkPlaceholderKey = `create_input_remark_placeholder_${step.task_type}`;
        const defaultPlaceholderKey = 'create_input_remark_placeholder'; // fallback

        // Retrieve text from locale:
        const labelText = this.locale.get(remarkLabelKey, this.lang)
          || this.locale.get(defaultLabelKey, this.lang)
          || 'Question:';

        const placeholderText = this.locale.get(remarkPlaceholderKey, this.lang)
          || this.locale.get(defaultPlaceholderKey, this.lang)
          || 'Enter your remark.';

        // Apply the label text
        $remarkLabel.textContent = labelText;
        $remarkWrapper.appendChild($remarkLabel);

        // Create the remark form
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
          placeholder: placeholderText, // set the placeholder here
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
 
        // // **Remove Step Button**
        // const $removeStepButton = document.createElement('img');
        // $removeStepButton.src = '/img/interviews/minus-icon.svg';
        // $removeStepButton.classList.add('removeStepButton');
        // $removeStepButton.style.cursor = 'pointer';
 
        // $removeStepButton.addEventListener('click', () => {
        //     const idx = this.stepContainers.indexOf($stepContainer);
        //     this.removeStep(idx);
        // });
 
        //$remarkAndRemoveWrapper.appendChild($removeStepButton);

        $stepContent.appendChild($remarkWrapper);

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
          'create_step_goal_label', 
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
            placeholder: this.locale.get("create_input_goal_placeholder", this.lang) 
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
        $moreDetailLabel.textContent = this.locale.get('create_step_more_detail_label', this.lang) || 'More detail';

        $moreDetail.appendChild($arrowIcon);
        $moreDetail.appendChild($moreDetailLabel);
        $detailsWrapper.appendChild($moreDetail);

        // **Hidden Content**
        const $hiddenContent = document.createElement('div');
        $hiddenContent.classList.add('hiddenContent');

        // ----------------------------------------------------------------------
        // Details (Hidden area)
        // ----------------------------------------------------------------------

        // ----------------------------------------------------------------------
        // Detail 1) GUIDELINES
        // ----------------------------------------------------------------------

        // **Guidelines List**
        const $guidelinesWrapper = document.createElement('div');
        $guidelinesWrapper.classList.add('guidelinesWrapper');
        $guidelinesWrapper.classList.add('configItemWrapper');

        // **Guidelines Label**
        const $guidelinesLabel = document.createElement('span');
        $guidelinesLabel.classList.add('guidelinesLabel');
        $guidelinesLabel.classList.add('configItemLabel');
        $guidelinesLabel.textContent = this.locale.get('create_step_guidelines_label', this.lang) || 'Guidelines:';
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
        $maxTurnsLabel.textContent = this.locale.get('create_step_max_turns_label', this.lang) || 'Max Turns:';
        $maxTurnsWrapper.appendChild($maxTurnsLabel);

        const maxTurnsForm = new TextField({
            id: `maxTurnsForm_${index}`,
            fieldName: `maxTurns_${index}`,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.positiveIntegerFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, this.lang),
                    min: 1,
                    max: 100
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
        // Detail 3.1) RESPONSE MODE
        // ----------------------------------------------------------------------
        const $responseModeWrapper = document.createElement('div');
        $responseModeWrapper.classList.add('responseModeWrapper');
        $responseModeWrapper.classList.add('configItemWrapper');

        //const $responseModeLabel = document.createElement('span');
        //$responseModeLabel.classList.add('responseModeLabel');
        //$responseModeLabel.classList.add('configItemLabel');
        //// "Response Mode:"
        //$responseModeLabel.textContent = this.locale.get('create_response_mode_title', this.lang);
        //$responseModeWrapper.appendChild($responseModeLabel);

        const responseModeItems = [
            new ListItem({
                title: this.locale.get('basic_configs_response_mode_tempo_oriented', this.lang),
                value: 0
            }),
            new ListItem({
                title: this.locale.get('basic_configs_response_mode_normal', this.lang),
                value: 1
            }),
            new ListItem({
                title: this.locale.get('basic_configs_response_mode_careful_listening', this.lang),
                value: 2
            }),
            new ListItem({
                title: this.locale.get('basic_configs_response_mode_wait_manual_submit', this.lang),
                value: 3
            })
        ];

        /** Create the actual dropdown */
        const responseModeSelector = new DropdownButton({
            id: `responseModeSelector_${index}`,
            fieldName: `response_mode_${index}`,
            title: '', // We can dynamically set this after picking an item
            description: this.locale.get('create_response_mode_title', this.lang),
            type: DropdownMenuType.list,
            position: DropdownMenuDisplayPositionType.bottomover,
            hasSelectedIcon: true,    // to show the checkmark
            isMultiSelect: false,     
            items: responseModeItems,
            // defaultValue is from the step or fallback to 1
            validators: [
              new Validator({
                errorType: ValidationErrorType.required,
                errorMessage: this.locale.get(ValidationErrorType.required, this.lang),
              }),
            ],
        });
        responseModeSelector.value = step.response_mode || defaultStep.response_mode;
        this.responseModeSelectors[index] = responseModeSelector;
        $responseModeWrapper.appendChild(responseModeSelector.$view);

        // Finally, append it to the hidden content
        $hiddenContent.appendChild($responseModeWrapper);

        // ----------------------------------------------------------------------
        // Detail 4) REFERENCES
        // ----------------------------------------------------------------------

        const $referenceWrapper = document.createElement('div');
        $referenceWrapper.classList.add('referenceWrapper');
        $referenceWrapper.classList.add('configItemWrapper');

        const $referenceTypeContainer = document.createElement('div');
        $referenceTypeContainer.classList.add('referenceTypeContainer');
    
        //const $referenceTypeLabel = document.createElement('span');
        //$referenceTypeLabel.classList.add('referenceTypeLabel');
        //$referenceTypeLabel.classList.add('configItemLabel');
        //$referenceTypeLabel.textContent = this.locale.get('create_reference_type_selector_label', this.lang);
        //$referenceTypeContainer.appendChild($referenceTypeLabel);
    
        const referenceTypeSelector = new DropdownButton({
            id: `referenceTypeSelector_${index}`,
            fieldName: `reference_type_${index}`,
            title: '', // We'll use the label above, so title can remain empty or be used differently.
            description: this.locale.get('create_reference_type_selector_label', this.lang),
            type: DropdownMenuType.list,
            position: DropdownMenuDisplayPositionType.bottomover,
            hasSelectedIcon: true,
            isMultiSelect: false,
            items: [
                {
                    title: this.locale.get('create_reference_type_all', this.lang),
                    value: 'all',
                },
                {
                    title: this.locale.get('create_reference_type_none', this.lang),
                    value: 'none',
                },
                {
                    title: this.locale.get('create_reference_type_select', this.lang),
                    value: 'select',
                },
            ],
            defaultValue: step.reference_type || 'all',
            validators: [new Validator({
                errorType: ValidationErrorType.required,
                errorMessage: this.locale.get(ValidationErrorType.required, lang)
            })]
        });
        this.referenceTypeSelectors[index] = referenceTypeSelector;
    
        $referenceTypeContainer.appendChild(referenceTypeSelector.$view);
        $referenceWrapper.appendChild($referenceTypeContainer);
    
        /**
         *  References Multi-select
         */
        const $referencesContainer = document.createElement('div');
        $referencesContainer.classList.add('referencesContainer');
    
        this.materialsReady.then(() => {
            const referencesSelector = new DropdownButton({
                id: `referencesDropdown_${index}`,
                fieldName: `references_${index}`,
                title: '', 
                description: this.locale.get('create_reference_selector_label', this.lang),
                type: DropdownMenuType.list,
                position: DropdownMenuDisplayPositionType.bottomover,
                hasSelectedIcon: true,
                items: this.materialItems || [],
                isMultiSelect: true,
                multiSelectDisplayTitle: this.locale.get('create_reference_selector_display_title', this.lang),
            });
    
            // If step already has references, pre-populate
            if (step.references && Array.isArray(step.references)) {
                referencesSelector.value = step.references;  
            }
    
            this.referencesSelectors[index] = referencesSelector;
    
            $referencesContainer.appendChild(referencesSelector.$view);
            $referenceWrapper.appendChild($referencesContainer);
        }).catch((error) => {
            console.error("Materials failed to fetch:", error);
        });
    
        // Show/hide referencesContainer when referenceType changes
        referenceTypeSelector.$view.addEventListener('selected', (e) => {
            const val = e.detail.value;   // The selected item’s value
            if (val === 'select') {
                $referencesContainer.style.display = 'block';
            } else {
                $referencesContainer.style.display = 'none';
            }
        });
    
        // Set initial value
        referenceTypeSelector.value = step.reference_type || defaultStep.reference_type

        $hiddenContent.appendChild($referenceWrapper);

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

        // Create an instance of ProgramTools:
        const tools = new ProgramTools({
          id: `programTools_${index}`,
          locale: this.locale,
          lang: this.lang,
          onClickAdd: () => {
            console.log(`Add step from step #${index + 1}`);
            //this.addStep(index);
            this.addStep();
          },
          onClickDelete: () => {
            console.log(`Delete step #${index + 1}`);
            this.removeStep(index);
          },
          // onClickAddImage: () => { ... },
          // onClickAddVideo: () => { ... },
        });
        tools.attach($stepContainer);

        console.warn(`Step container created for step ${index + 1}`);
        return $stepContainer;
    }

    onTaskTypeChanged(stepIndex, newTaskType) {
        this.interactionModel.steps[stepIndex].task_type = newTaskType;
    
        // 1) Apply config (maxTurns, responseMode, etc.)
        const config = taskTypeConfigs[newTaskType];
        if (!config) return;
        // set default values
        this.interactionModel.steps[stepIndex].max_turns = config.maxTurns;
        if (this.maxTurnsForms[stepIndex]) {
            this.maxTurnsForms[stepIndex].value = String(config.maxTurns);
        }
        this.interactionModel.steps[stepIndex].response_mode = config.responseMode;
        if (this.responseModeSelectors[stepIndex]) {
            this.responseModeSelectors[stepIndex].value = config.responseMode;
        }
        this.interactionModel.steps[stepIndex].reference_type = config.referenceType;
        if (this.referenceTypeSelectors[stepIndex]) {
            this.referenceTypeSelectors[stepIndex].value = config.referenceType;
        }

        // 2) Update the label/placeholder for the remark text
        const remarkForm = this.remarkForms[stepIndex];
        if (remarkForm) {
          const labelKey = `create_remark_label_${newTaskType}`;
          const placeholderKey = `create_input_remark_placeholder_${newTaskType}`;

          const newLabel = this.locale.get(labelKey, this.lang) 
            || this.locale.get('create_step_remark_label', this.lang) 
            || 'Remark:';
          const newPlaceholder = this.locale.get(placeholderKey, this.lang) 
            || this.locale.get('create_input_remark_placeholder', this.lang) 
            || 'Enter the remark.';

          // If you have a separate DOM label, update its textContent:
          const $remarkLabel = this.stepContainers[stepIndex].querySelector('.remarkLabel');
          if ($remarkLabel) {
            $remarkLabel.textContent = newLabel;
          }

          // And for the remark form placeholder:
          remarkForm.placeholder = newPlaceholder;
        }

        // 3) Toggle visibility if needed
        const $stepContainer = this.stepContainers[stepIndex];
        const $remarkWrapper = $stepContainer?.querySelector('.remarkWrapper');
        if ($remarkWrapper) {
          $remarkWrapper.style.display = config.showRemark ? 'block' : 'none';
        }
    
        console.log(`Task type for step ${stepIndex} changed to ${newTaskType}`);
    }
    
    addStep() {
        if (this.interactionModel.steps.length >= this.maxSteps) {
            console.warn('Max steps reached. Cannot add more steps.');
            return;
        }
    
        const newStep = defaultStep();
        this.interactionModel.steps.push(newStep);
    
        console.warn(`Adding new step at index ${this.interactionModel.steps.length - 1}`, newStep);
    
        const index = this.interactionModel.steps.length - 1;
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
        this.interactionModel.steps.splice(index, 1);
    
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
    
        console.warn(`Step ${index + 1} removed. Remaining steps: ${this.interactionModel.steps.length}`);
    }
    
    updateStepIndices() {
        console.warn('Updating step indices');
        this.stepContainers.forEach(($stepContainer, index) => {
            $stepContainer.dataset.index = index;
            const $stepTitle = $stepContainer.querySelector('.stepTitle');
            const stepLabelTemplate = this.locale.get('create_steps_label', this.lang) || 'Step $0';
            $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1); 
        });
        console.warn('Step indices updated');
    }

    updateRemoveButtonVisibility() {
        const visible = this.interactionModel.steps.length > 1;
        console.warn(`Setting remove button visibility to ${visible ? 'visible' : 'hidden'}`);

        // If there's only one step, hide the remove button on that step
        if (this.interactionModel.steps.length <= 1 && this.stepContainers.length > 0) {
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
        if (this.interactionModel.steps.length < this.maxSteps) {
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
            const taskTypeSelector = this.taskTypeSelectors[index];
            const remarkForm = this.remarkForms[index];
            const goalForm = this.goalForms[index];
            const maxTurnsForm = this.maxTurnsForms[index];
            const guidelinesArray = this.guidelineForms[index] || [];

            const responseModeSelector = this.responseModeSelectors[index];
            const referencesSelector = this.referencesSelectors
                ? this.referencesSelectors[index]
                : null;
            const referenceTypeSelector = this.referenceTypeSelectors[index];

            const topicVal = topicForm?.value?.trim() || '';
            const remarkVal = remarkForm?.value?.trim() || '';

            // If user typed something in remark or topic, it’s a valid step
            if (topicVal || remarkVal) {
                hasQuestionValue = true;

                const referencesVal = referencesSelector?.value || [];
                const referenceTypeVal = referenceTypeSelector?.value || ReferenceType.ALL;

                const step = {
                    // 1) Task Type
                    task_type: taskTypeSelector.value,

                    // 2) Basic fields
                    topic: topicVal,
                    remark: remarkVal,
                    goal: goalForm?.value || '',

                    // 3) Guidelines
                    guidelines: guidelinesArray.map(gForm => gForm?.value || ''),

                    // 4) Config fields
                    max_turns: parseInt(maxTurnsForm?.value, 10),
                    response_mode: parseInt(responseModeSelector?.value, 10),
                    reference_type: referenceTypeVal,
                    references: referenceTypeVal === 'select' ? referencesVal : []
                };
                steps.push(step);
            }
        });
    
        // If no topic/remark form has value, show an alert on the first step’s remark
        if (!hasQuestionValue && this.remarkForms.length > 0) {
            this.remarkForms[0].alert(
              this.locale.get("create_no_remark_error", this.lang)
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
        const interviewJSON = this.interactionModelObjectFromFormData();
        if (!interviewJSON) {
            return;
        }

        if (this.$message) {
            this.$message.classList.remove('alert', 'success');
            this.$message.textContent = '';
        } else {
            console.error(`ProgramView.$message not exist.`)
        }

        Http.post(`/v1/${this.lang}/interviews/create`, interviewJSON,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.$message.classList.add('success');
                this.$message.textContent = message;

                this.interactionModelId = res.id;
                // show url
                if (this.onInteractionModelCreated) {
                    this.onInteractionModelCreated(this.interactionModelId);
                }
            },
            (error) => {
                this.handleError(error, this.$message);
            }
        );
    }

    submitUpdateInterview(interactionModelId) {
        const interviewJSON = this.interactionModelObjectFromFormData();
        if (!interviewJSON) {
            return;
        }

        this.$message.textContent = '';

        Http.post(`/v1/${this.lang}/interviews/${interactionModelId}/update`, interviewJSON,
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
