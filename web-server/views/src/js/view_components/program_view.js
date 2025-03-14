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
    references: [],
    guidelines: [
        "First, read the remark.",
        "When the answer looks done, ask 'Are you sure that's it?'"
    ],
    left: 0,
    top: 0 
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
        onInteractionModelCreated,
        maxSteps = 3,
        updateIntervalMs = 1000,
        stepPositionMargin = 200,
        onChangeVoiceSet,
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.user = user;
        this.interactionModelId = interactionModelId;
        this.interactionModel = interactionModel || defaults; 

        if (!this.interactionModel.steps || this.interactionModel.steps.length === 0) {
            this.interactionModel.steps = [ defaultStep() ];
        }

        this.backgroundContainerHeight = 5000;
        this.backgroundContainerWidth = 5000;

        this.stepPositionInitX = 28;
        this.stepPositionInitY = 165;
        this.stepPositionMargin = 40;

        this.scale = (this.interactionModel.zoom !== undefined)
            ? this.interactionModel.zoom
            : 1.0;
        this.offsetX = (this.interactionModel.offset_x !== undefined)
            ? this.interactionModel.offset_x
            : 0;
        this.offsetY = (this.interactionModel.offset_y !== undefined)
            ? this.interactionModel.offset_y
            : 0;

        //this.offsetX = 0;
        //this.offsetY = 0;
        this.minScale = 0.2;
        this.maxScale = 5.0;

        this.maxGuidelines = 3;
        this.maxSteps = maxSteps;
        this.onInteractionModelCreated = onInteractionModelCreated;
        this.onChangeVoiceSet = onChangeVoiceSet;

        this.stepPositionMargin = stepPositionMargin;

        // Instead of parallel arrays, we keep ONE array:
        // each element in stepsData = { container, step, topicForm, remarkForm, ... }
        this.stepsData = [];

        this.fetchMaterials();
        this.materialsReady = new Promise((resolve, reject) => {
            this._materialsReadyResolver = resolve;
            this._materialsReadyRejecter = reject;
        });

        // Create the main view
        this.createView();

        // Start interval update
        this._lastSnapshot = JSON.stringify(
            this.interactionModelObjectFromFormData() || {}
        );

        this.updateIntervalMs = updateIntervalMs; // adjust as needed
        this.updateScheduler = setInterval(() => {
            this.checkForUpdates();
        }, this.updateIntervalMs);
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
        console.log('***Creating view for ProgramView');
        // Create the main container
        this.$view = document.createElement('div');
        this.$view.id = this.id;
        this.$view.classList.add('ProgramView');

        // **ProgramView**
        const $programViewContainer = document.createElement('div');
        $programViewContainer.classList.add('ProgramViewContainer');

        // ───────────────────────────────────────────────────────────────────────────
        //  1) HEADER CONTAINER (title + loadingMessage)
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

        // ───────────────────────────────────────────────────────────────────────────
        //  VOICESET: Show voiceset name + "change" button
        // ───────────────────────────────────────────────────────────────────────────
        const $voiceSetContainer = document.createElement('div');
        $voiceSetContainer.classList.add('voiceSetContainer');

        const $voiceSetLabel = document.createElement('span');
        $voiceSetLabel.classList.add('voiceSetLabel');
        $voiceSetLabel.textContent = this.locale.get("create_voiceset_label", this.lang) || "Voice Set:";
        $voiceSetContainer.appendChild($voiceSetLabel);
    
        // Display either the voiceset name or a "not set" message
        const $voiceSetName = document.createElement('span');
        $voiceSetName.classList.add('voiceSetName');
        
        // If voiceset or name doesn’t exist, we show the localized “not set” message
        if (this.interactionModel.voiceset && this.interactionModel.voiceset.name) {
            $voiceSetName.textContent = this.interactionModel.voiceset.name;
            $voiceSetContainer.classList.remove('alert');
        } else {
            $voiceSetName.textContent = this.locale.get("create_voiceset_not_set", this.lang);
            $voiceSetContainer.classList.add('alert');
        }
        $voiceSetContainer.appendChild($voiceSetName);
    
        // "Change" button
        const $changeButton = document.createElement('button');
        $changeButton.classList.add('changeVoiceSetButton');
        $changeButton.textContent = this.locale.get("create_voiceset_edit_button", this.lang);
        $changeButton.addEventListener('click', () => {
            if (this.onChangeVoiceSet) {
                this.onChangeVoiceSet();
            }
        });
        $voiceSetContainer.appendChild($changeButton);
    
        // Finally, attach the entire container to the header
        $headerContainer.appendChild($voiceSetContainer);
        // ───────────────────────────────────────────────────────────────────────────
        //  Loading Message
        // ───────────────────────────────────────────────────────────────────────────

        this.loadingMessage = new LoadingMessage({
            id: 'ProgramLoadingMessage',
            classList: 'hover-grad-txt',
            pattern: LoadingMessagePattern.B,
            textAlign: LoadingMessageTextAlign.left,
            minimumWaitTimeMs: 0
        });
        $headerContainer.appendChild(this.loadingMessage.$view);
        this.loadingMessage.setText('Loading..', {gradient: LoadingMessageGradient.ocean})

        $programViewContainer.appendChild($headerContainer);

        // ───────────────────────────────────────────────────────────────────────────
        //  2) BACKGROUND CONTAINER (draggable)
        // ───────────────────────────────────────────────────────────────────────────
        // This container will fill the space under the header and hold mainContainer, steps, etc.
        const $backgroundContainer = document.createElement('div');
        $backgroundContainer.classList.add('backgroundContainer');
        this.$backgroundContainer = $backgroundContainer;
        $programViewContainer.appendChild($backgroundContainer);
        console.error(
            'Container rect:', 
            $backgroundContainer.getBoundingClientRect()
        );
        console.error(
            'Container clientH:', 
            this.$backgroundContainer.clientHeight
        );

 
        //mesh.animate({ type: MeshAnimation.perspective });
        const initX = (this.interactionModel.offset_x !== undefined)
            ? this.interactionModel.offset_x 
            : 0;
        const initY = (this.interactionModel.offset_y !== undefined)
            ? this.interactionModel.offset_y 
            : 0;

        new Draggable({
            element: this.$backgroundContainer,
            onDrag: (pos) => {
                // Continuously redraw to keep the arrows aligned with background movement
                this.offsetX = pos.left;
                this.offsetY = pos.top;
                this.updateTransform();
                this.connectionsManager.drawAllArrows();
            },
            onDragEnd: (pos) => {
                // Final alignment
                this.connectionsManager.drawAllArrows();
            },
            ignorewhenoverselector: '.TextField'
        });
        
        this.$backgroundContainer.addEventListener(
            'wheel',
            (evt) => this.onBackgroundWheel(evt),
            { passive: false }
        );


        // ───────────────────────────────────────────────────────────────────────────
        //  2) MAIN CONTAINER (Steps)
        // ───────────────────────────────────────────────────────────────────────────
        const $mainContainer = document.createElement('div');
        this.$mainContainer = $mainContainer;
        $mainContainer.classList.add('mainContainer');

        //const $stepListScrollContainer = document.createElement('div');
        //$stepListScrollContainer.classList.add('stepListScrollContainer');
        //$mainContainer.appendChild($stepListScrollContainer);

        //$stepListScrollContainer.addEventListener('wheel', (evt) => {
        //    evt.preventDefault();
        //    $stepListScrollContainer.scrollLeft += evt.deltaY;
        //}, { passive: false });

        const $stepList = document.createElement('ul');
        $stepList.classList.add('stepList');
        //$stepListScrollContainer.appendChild($stepList);
        $mainContainer.appendChild($stepList);

        // **Steps**
        this.interactionModel.steps.forEach((step, index) => {
            const stepData = this.buildStepData(step, index);
            this.stepsData.push(stepData);  // store
            $stepList.appendChild(stepData.container); // mount
        });

        // Assign the container before calling methods that use it
        this.$programViewContainer = $programViewContainer;

        // append the container to main view
        this.$view.appendChild($programViewContainer);

        this.updateRemoveButtonVisibility();

        this.adjustContainersInitialPosition({w: this.backgroundContainerWidth, h: this.backgroundContainerHeight})
        setTimeout(() => {
            // NOTE: wait until $backgroundContainer is rendered. otherwise w,h becomes 0.
            this.setupMesh({n: 100, m: 100})
            this.connectionsManager.drawAllArrows();
            //this.mesh.animate({type: MeshAnimation.perspective})
        }, 20)

        // Instantiate the connections manager
        // TODO: ensure createView is all done then run this
        this.connectionsManager = new ProgramViewConnections({
            programView: this,
            $parentView: this.$programViewContainer,
            width: this.backgroundContainerWidth,
            height: this.backgroundContainerHeight
        });

        this.connectionsManager.drawAllArrows();
        this.updateTransform();

        // Finally, append mainContainer inside the background
        $backgroundContainer.appendChild($mainContainer);
    }

    setupMesh({n, m}) {
        const mesh = new Mesh({
            id: 'ProgramViewBackgroundMesh',
            n: n,
            m: m,
            lineColor: '#888',
            lineWidth: 0.1
        });
        mesh.mount({
            $parent: this.$backgroundContainer,
            $insertBefore: this.$mainContainer
          });
        this.mesh = mesh;
        /*
        // DEBUG
        console.error(
            'Container styles:',
            getComputedStyle(this.$backgroundContainer).cssText
        );
        console.error(
            'Container rect:', 
            this.$backgroundContainer.getBoundingClientRect()
        );
        console.error(
            'Container clientH:', 
            this.$backgroundContainer.clientHeight
        );
        console.log("BackgroundContainer rect:", this.$backgroundContainer.getBoundingClientRect());
        */

        this.addTestView();
    }

    adjustContainersInitialPosition({w, h}) {
        const W = w;
        const H = h;
        this.$backgroundContainer.style.position = 'absolute';
        this.$backgroundContainer.style.width = W + 'px';
        this.$backgroundContainer.style.height = H + 'px';
    
        // 3) Center the backgroundContainer in the *browser window*
        //    so that (0,0) of backgroundContainer is in the center of the screen
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        this.$backgroundContainer.style.left = (- W / 2) + 'px';
        this.$backgroundContainer.style.top  = (- H / 2) + 'px';
    
        // 4) Place the mainContainer so that its (0,0) is at
        //    the center of the backgroundContainer
        this.$mainContainer.style.position = 'absolute';
        this.$mainContainer.style.left = (W / 2) + 'px';
        this.$mainContainer.style.top  = (H / 2) + 'px';
    }


    /**
     * Build one "stepData" object containing everything for that step:
     *  - container (DOM)
     *  - references to forms, dropdowns, etc.
     *  - the actual step object
     * Returns an object { container, step, topicForm, remarkForm, ... }
     */
    buildStepData(step, index) {
        console.log(`Building step data for step ${index + 1}`, step, `(left: ${step.left}, top: ${step.top})`);
    
        // Container
        const $stepContainer = document.createElement('li');
        $stepContainer.classList.add('stepContainer');
        $stepContainer.dataset.index = index;

        // (A) Immediately position the container
        $stepContainer.style.left = (step.left !== null && step.left !== undefined)
        ? step.left + 'px'
        : this.stepPositionInitX + 'px';
      
        $stepContainer.style.top = (step.top !== null && step.top !== undefined)
          ? step.top + 'px'
          : this.stepPositionInitY + 'px';
      
        // Make the step container draggable
        new Draggable({
            element: $stepContainer,
            onDrag: (pos) => {
                // Continuously redraw while moving the step
                step.left = pos.left;
                step.top  = pos.top;
                this.connectionsManager.drawAllArrows();
            },
            onDragEnd: (pos) => {
                // Final position
                step.left = pos.left;
                step.top  = pos.top;
                this.connectionsManager.drawAllArrows();
                console.log(
                    `Step #${index + 1} position updated -> left=${step.left}, top=${step.top}`
                );
            },
            ignoreWhenOverSelector: '.TextField'
        });
   
        // Step Title
        const $stepTitle = document.createElement('h3');
        $stepTitle.classList.add('stepTitle');
        const stepLabelTemplate = this.locale.get('create_steps_label', this.lang) || 'Step $0';
        $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1);
        $stepContainer.appendChild($stepTitle);
    
        // Step Content
        const $stepContent = document.createElement('div');
        $stepContent.classList.add('stepContent');
    
        // ───────────────────────────────────────────────────────────────────────────
        //  0) TASK TYPE
        // ───────────────────────────────────────────────────────────────────────────
        const $taskTypeWrapper = document.createElement('div');
        $taskTypeWrapper.classList.add('taskTypeWrapper', 'configItemWrapper');
    
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
    
        // Add class to container for style
        $stepContainer.classList.add(taskTypeSelector.value);
    
        taskTypeSelector.$view.addEventListener('selected', (e) => {
            const selectedValue = e.detail.value; 
            // handle task type changed
            this.onTaskTypeChanged(index, selectedValue);
            // Update container class
            Object.values(TaskType).forEach((task) => {
                $stepContainer.classList.remove(task);
            });
            $stepContainer.classList.add(selectedValue);
        });
    
        $taskTypeWrapper.appendChild(taskTypeSelector.$view);
        $stepContent.appendChild($taskTypeWrapper);
    
        // ───────────────────────────────────────────────────────────────────────────
        //  1) TOPIC
        // ───────────────────────────────────────────────────────────────────────────
        const $topicWrapper = document.createElement('div');
        $topicWrapper.classList.add('topicWrapper', 'configItemWrapper');
    
        const $topicLabel = document.createElement('span');
        $topicLabel.classList.add('topicLabel', 'configItemLabel');
        $topicLabel.textContent = this.locale.get('create_step_topic_label', this.lang) || 'Topic/Content:';
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
    
        $topicWrapper.appendChild(topicForm.$view);
        $stepContent.appendChild($topicWrapper);
    
        // ───────────────────────────────────────────────────────────────────────────
        //  2) REMARK
        // ───────────────────────────────────────────────────────────────────────────
        const $remarkWrapper = document.createElement('div');
        $remarkWrapper.classList.add('remarkWrapper', 'configItemWrapper');
    
        const $remarkLabel = document.createElement('span');
        $remarkLabel.classList.add('remarkLabel', 'configItemLabel');
    
        // Decide label/placeholder from step.task_type
        const remarkLabelKey       = `create_remark_label_${step.task_type || TaskType.CONSULTING}`;
        const defaultLabelKey      = 'create_step_remark_label';
        const remarkPlaceholderKey = `create_input_remark_placeholder_${step.task_type || TaskType.CONSULTING}`;
        const defaultPlaceholderKey= 'create_input_remark_placeholder';
    
        const labelText = this.locale.get(remarkLabelKey, this.lang)
            || this.locale.get(defaultLabelKey, this.lang)
            || 'Question:';
        const placeholderText = this.locale.get(remarkPlaceholderKey, this.lang)
            || this.locale.get(defaultPlaceholderKey, this.lang)
            || 'Enter your remark.';
    
        $remarkLabel.textContent = labelText;
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
            placeholder: placeholderText,
            isCounter: false,
        });
        remarkForm.$view.classList.add('remarkForm');
        $remarkWrapper.appendChild(remarkForm.$view);
        $stepContent.appendChild($remarkWrapper);
    
        // ───────────────────────────────────────────────────────────────────────────
        //  3) GOAL
        // ───────────────────────────────────────────────────────────────────────────
        const $goalWrapper = document.createElement('div');
        $goalWrapper.classList.add('goalWrapper', 'configItemWrapper');
    
        const $goalLabel = document.createElement('span');
        $goalLabel.classList.add('goalLabel', 'configItemLabel');
        $goalLabel.textContent = this.locale.get('create_step_goal_label', this.lang) || 'Finish Condition:';
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
        $goalWrapper.appendChild(goalForm.$view);
        $stepContent.appendChild($goalWrapper);
    
        // ───────────────────────────────────────────────────────────────────────────
        //  4) DETAILS (hidden content)
        // ───────────────────────────────────────────────────────────────────────────
        const $detailsWrapper = document.createElement('div');
        $detailsWrapper.classList.add('detailsWrapper');
    
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
    
        const $hiddenContent = document.createElement('div');
        $hiddenContent.classList.add('hiddenContent');
    
        // 4.1) GUIDELINES
        const $guidelinesWrapper = document.createElement('div');
        $guidelinesWrapper.classList.add('guidelinesWrapper', 'configItemWrapper');
    
        const $guidelinesLabel = document.createElement('span');
        $guidelinesLabel.classList.add('guidelinesLabel', 'configItemLabel');
        $guidelinesLabel.textContent = this.locale.get('create_step_guidelines_label', this.lang) || 'Guidelines:';
        $guidelinesWrapper.appendChild($guidelinesLabel);
    
        // Prepare guideline forms array
        const guidelineForms = [];
        step.guidelines.forEach((guideline, gIdx) => {
            const guidelineForm = new TextField({
                id: `guidelineForm_${index}_${gIdx}`,
                fieldName: `guideline_${index}_${gIdx}`,
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
                placeholder: `Enter guideline ${gIdx + 1}.`,
                isCounter: false,
            });
            guidelineForm.$view.classList.add('guidelineForm');
    
            const $guidelineWrapper = document.createElement('div');
            $guidelineWrapper.classList.add('guidelineWrapper');
            $guidelineWrapper.appendChild(guidelineForm.$view);
    
            $guidelinesWrapper.appendChild($guidelineWrapper);
            guidelineForms.push(guidelineForm);
        });
    
        // Add Guideline Button
        const $addGuidelineButtonContainer = document.createElement('div');
        $addGuidelineButtonContainer.classList.add('addGuidelineButtonContainer');
        $addGuidelineButtonContainer.style.display = 'flex';
        $addGuidelineButtonContainer.style.justifyContent = 'center';
    
        const $addGuidelineButton = document.createElement('img');
        $addGuidelineButton.src = '/img/interviews/plus-icon.svg';
        $addGuidelineButton.classList.add('addGuidelineButton');
        $addGuidelineButton.style.cursor = 'pointer';
    
        $addGuidelineButtonContainer.appendChild($addGuidelineButton);
        if (guidelineForms.length >= 3) {
            $addGuidelineButtonContainer.style.display = 'none';
        }
        $guidelinesWrapper.appendChild($addGuidelineButtonContainer);
    
        // Add Guideline Button event
        $addGuidelineButton.addEventListener('click', () => {
            const gIdx = guidelineForms.length;
            if (gIdx >= 3) return;
            const guidelineForm = new TextField({
                id: `guidelineForm_${index}_${gIdx}`,
                fieldName: `guideline_${index}_${gIdx}`,
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
                placeholder: `Enter guideline ${gIdx + 1}.`,
                isCounter: false,
            });
            guidelineForm.$view.classList.add('guidelineForm');
            guidelineForms.push(guidelineForm);
    
            const $guidelineWrapper = document.createElement('div');
            $guidelineWrapper.classList.add('guidelineWrapper');
            $guidelineWrapper.appendChild(guidelineForm.$view);
            $guidelinesWrapper.appendChild($guidelineWrapper);
    
            if (guidelineForms.length >= 3) {
                $addGuidelineButtonContainer.style.display = 'none';
            }
        });
    
        $hiddenContent.appendChild($guidelinesWrapper);
    
        // 4.2) MAX TURNS
        const $maxTurnsWrapper = document.createElement('div');
        $maxTurnsWrapper.classList.add('maxTurnsWrapper', 'configItemWrapper');
    
        const $maxTurnsLabel = document.createElement('span');
        $maxTurnsLabel.classList.add('maxTurnsLabel', 'configItemLabel');
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
        $maxTurnsWrapper.appendChild(maxTurnsForm.$view);
    
        $hiddenContent.appendChild($maxTurnsWrapper);
    
        // 4.3) RESPONSE MODE
        const $responseModeWrapper = document.createElement('div');
        $responseModeWrapper.classList.add('responseModeWrapper', 'configItemWrapper');
    
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
    
        const responseModeSelector = new DropdownButton({
            id: `responseModeSelector_${index}`,
            fieldName: `response_mode_${index}`,
            title: '',
            description: this.locale.get('create_response_mode_title', this.lang),
            type: DropdownMenuType.list,
            position: DropdownMenuDisplayPositionType.bottomover,
            hasSelectedIcon: true,
            isMultiSelect: false,
            items: responseModeItems,
            validators: [
              new Validator({
                errorType: ValidationErrorType.required,
                errorMessage: this.locale.get(ValidationErrorType.required, this.lang),
              }),
            ],
        });
        responseModeSelector.value = step.response_mode || defaultStep().response_mode;
    
        $responseModeWrapper.appendChild(responseModeSelector.$view);
        $hiddenContent.appendChild($responseModeWrapper);
    
        // 4.4) REFERENCES
        const $referenceWrapper = document.createElement('div');
        $referenceWrapper.classList.add('referenceWrapper', 'configItemWrapper');
    
        const $referenceTypeContainer = document.createElement('div');
        $referenceTypeContainer.classList.add('referenceTypeContainer');
    
        const referenceTypeSelector = new DropdownButton({
            id: `referenceTypeSelector_${index}`,
            fieldName: `reference_type_${index}`,
            title: '',
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
                errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
            })]
        });
    
        $referenceTypeContainer.appendChild(referenceTypeSelector.$view);
        $referenceWrapper.appendChild($referenceTypeContainer);
    
        const $referencesContainer = document.createElement('div');
        $referencesContainer.classList.add('referencesContainer');
    
        // Build references dropdown only after materials fetch
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
    
            // Pre-populate
            if (step.references && Array.isArray(step.references)) {
                referencesSelector.value = step.references;  
            }
    
            // store in stepData as well
            $referencesContainer.appendChild(referencesSelector.$view);
    
            // Show/hide referencesContainer based on referenceType
            if (referenceTypeSelector.value !== 'select') {
                $referencesContainer.style.display = 'none';
            }
    
            referenceTypeSelector.$view.addEventListener('selected', (e) => {
                if (e.detail.value === 'select') {
                    $referencesContainer.style.display = 'block';
                } else {
                    $referencesContainer.style.display = 'none';
                }
            });
    
            stepData.referencesSelector = referencesSelector; // We'll define stepData later
        }).catch((error) => {
            console.error("Materials fetch failed:", error);
        });
    
        $referenceWrapper.appendChild($referencesContainer);
        $hiddenContent.appendChild($referenceWrapper);
    
        $detailsWrapper.appendChild($hiddenContent);
        $stepContainer.appendChild($stepContent);
        $stepContent.appendChild($detailsWrapper);
    
        // More detail toggle
        $moreDetail.addEventListener('click', () => {
            $hiddenContent.classList.toggle('expanded');
            $moreDetail.classList.toggle('rotated');
        });

        // Add ProgramTools
        const tools = new ProgramTools({
            id: `programTools_${index}`,
            locale: this.locale,
            lang: this.lang,
            onClickAddFlow: () => {
                console.log(`Add flow from step #${index + 1}`);
                this.addFlow({ indexAfter: index });
            },
            onClickAddFunction: () => {
                console.log(`Add function from step #${index + 1}`);
                this.addFunction({ indexAfter: index });
            },
            onClickDelete: () => {
                console.log(`Delete step #${$stepContainer.dataset.index}`);
                this.removeStep($stepContainer); 
            },
            // If you eventually need these:
            // onClickAddImage: () => { ... },
            // onClickAddVideo: () => { ... },
        });
        tools.attach($stepContainer);
        tools.$view.classList.add('show')

    
        // Return a single object with everything we need
        const stepData = {
            container: $stepContainer,
            step,   // the underlying step data in this.interactionModel.steps[index]
            taskTypeSelector,
            topicForm,
            remarkForm,
            goalForm,
            guidelineForms,
            maxTurnsForm,
            responseModeSelector,
            referenceTypeSelector,
            referencesSelector: null // we set it in .then() above
        };
    
        return stepData;
    }

    onTaskTypeChanged(stepIndex, newTaskType) {
        // Get the step data
        const stepData = this.stepsData[stepIndex];
        if (!stepData) return;

        // Update the actual step object
        stepData.step.task_type = newTaskType;

        const config = taskTypeConfigs[newTaskType];
        if (!config) return;

        // Update step data & forms
        stepData.step.max_turns = config.maxTurns;
        stepData.maxTurnsForm.value = String(config.maxTurns);

        stepData.step.response_mode = config.responseMode;
        stepData.responseModeSelector.value = config.responseMode;

        stepData.step.reference_type = config.referenceType;
        stepData.referenceTypeSelector.value = config.referenceType;

        // Update remark label/placeholder
        const $remarkLabel = stepData.container.querySelector('.remarkLabel');
        if ($remarkLabel) {
            const labelKey = `create_remark_label_${newTaskType}`;
            const fallbackLabelKey = 'create_step_remark_label';
            const newLabel = this.locale.get(labelKey, this.lang)
                || this.locale.get(fallbackLabelKey, this.lang)
                || 'Remark:';
            $remarkLabel.textContent = newLabel;
        }
        const placeholderKey = `create_input_remark_placeholder_${newTaskType}`;
        const fallbackPlaceholder = 'create_input_remark_placeholder';
        const newPlaceholder = this.locale.get(placeholderKey, this.lang)
            || this.locale.get(fallbackPlaceholder, this.lang)
            || 'Enter the remark.';
        stepData.remarkForm.placeholder = newPlaceholder;

        // show/hide remark wrapper
        const $remarkWrapper = stepData.container.querySelector('.remarkWrapper');
        if ($remarkWrapper) {
            $remarkWrapper.style.display = config.showRemark ? 'block' : 'none';
        }

        console.log(`Task type for step ${stepIndex} changed to ${newTaskType}`);
    }

    determineStepPosition(step, index) {
        // If the step already has a (left, top) from saved data, just use it
        if (typeof step.left === 'number' && typeof step.top === 'number') {
            return;
        }

        // Rule 1: If this is the very first step, place it at (initX, initY)
        if (index === 0) {
            step.left = this.stepPositionInitX;  // or whatever you want
            step.top  = this.stepPositionInitY;
            // --- Additional LOG:
            console.log(
                `Setting initial position for the first step: left=${step.left}, top=${step.top}`
            );
            return;
        }

        // Otherwise, anchor it to the right of the previous step
        const prevStepData = this.stepsData[index - 1];
        if (!prevStepData) {
            // Fallback if somehow there's no previous step data
            step.left = this.stepPositionInitX;
            step.top  = this.stepPositionInitY;
            console.log(
                `No previous step data found; fallback position: left=${step.left}, top=${step.top}`
            );
            return;
        }

        // Get the previous step’s bounding rectangle
        const prevRect = prevStepData.container.getBoundingClientRect();
        step.left = prevStepData.step.left + prevRect.width + this.stepPositionMargin;
        step.top  = prevStepData.step.top;
        // --- Additional LOG:
        console.log(
            `Positioning step #${index + 1} to the right of step #${index} => left=${step.left}, top=${step.top}`
        );
    }

    shiftStepsToRight(startIndex) {
        // Decide how far to shift
        const shiftDistance = this.stepPositionMargin || 200;
        console.log(`Shifting steps to the right starting from index=${startIndex}, distance=${shiftDistance}`);

        for (let i = startIndex; i < this.stepsData.length; i++) {
            const sd = this.stepsData[i];
            sd.step.left += shiftDistance;
            // Also update the container’s style to visually move it
            sd.container.style.left = sd.step.left + 'px';
            // --- Additional LOG:
            console.log(`Step #${i + 1} => new left=${sd.step.left}, top remains=${sd.step.top}`);
        }

        // Redraw arrows so they follow the updated positions
        this.connectionsManager.drawAllArrows();
    }

    addFlow({ indexAfter } = {}) {
        if (this.interactionModel.steps.length >= this.maxSteps) {
            console.warn('Max steps reached. Cannot add more steps.');
            return;
        }

        console.log('Adding a new step via addFlow()...');
        const newStep = defaultStep();
        let insertIndex = this.interactionModel.steps.length; // default => end
        if (typeof indexAfter === 'number' && indexAfter >= 0 && indexAfter < this.interactionModel.steps.length) {
            insertIndex = indexAfter + 1;
        }

        // Insert into the data array
        this.interactionModel.steps.splice(insertIndex, 0, newStep);

        console.log(`Determining position for the new step at index=${insertIndex}`);
        this.determineStepPosition(newStep, insertIndex);

        const newStepData = this.buildStepData(newStep, insertIndex);
        console.log(`New step data created.`)
        console.log(newStepData);
        this.stepsData.splice(insertIndex, 0, newStepData);

        // Insert DOM after the stepContainer at indexAfter
        if (this.stepsData[insertIndex - 1]) {
            const refContainer = this.stepsData[insertIndex - 1].container;
            if (refContainer && refContainer.nextSibling) {
                refContainer.parentNode.insertBefore(newStepData.container, refContainer.nextSibling);
            } else {
                refContainer.parentNode.appendChild(newStepData.container);
            }
        } else {
            // If no existing step => just append
            const $parent = this.$view.querySelector('.ProgramViewContainer');
            $parent.appendChild(newStepData.container);
        }

        // If we're NOT appending at the very end (meaning we inserted in the middle),
        // shift all subsequent steps to avoid overlap
        // i.e. if "insertIndex" is NOT the last index in the array
        if (insertIndex < this.interactionModel.steps.length - 1) {
            this.shiftStepsToRight(insertIndex + 1);
        }

        // Re-index the DOM
        this.updateStepIndices();
        this.updateRemoveButtonVisibility();
        this.connectionsManager.drawAllArrows();

        console.log(`Step added successfully at index=${insertIndex}. Current total steps: ${this.stepsData.length}`);
    }


    removeStep(containerElement) {
        console.log(`Removing step by container`, containerElement);
    
        // 1) Find which stepData has this container
        const index = this.stepsData.findIndex(sd => sd.container === containerElement);
        if (index === -1) {
            console.warn("Could not find stepData for container. Aborting removeStep().");
            return;
        }
    
        // 2) Remove the actual step object from interactionModel
        this.interactionModel.steps.splice(index, 1);
    
        // 3) Remove the DOM node
        const stepData = this.stepsData[index];
        const $container = stepData.container;
        if ($container && $container.parentNode) {
            $container.parentNode.removeChild($container);
        }
    
        // 4) Remove from stepsData array
        this.stepsData.splice(index, 1);
    
        // 5) Re-index the steps & re-check
        this.updateStepIndices();
        this.updateRemoveButtonVisibility();
        this.ensureEmptyStepAtEnd(); // <- NOTE: necessary?

        this.connectionsManager.drawAllArrows();
    }
    
    
    updateStepIndices() {
        console.log('Updating step indices');
        this.stepsData.forEach((sd, index) => {
            sd.container.dataset.index = index;
            const $stepTitle = sd.container.querySelector('.stepTitle');
            const stepLabelTemplate = this.locale.get('create_steps_label', this.lang) || 'Step $0';
            if ($stepTitle) {
                $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1);
            }
        });
        console.log('Step indices updated');

        this.connectionsManager.drawAllArrows();
    }

    updateRemoveButtonVisibility() {
        const visible = this.interactionModel.steps.length > 1;
        console.log(`Setting remove button visibility to ${visible ? 'visible' : 'hidden'}`);

        // If there's only one step, hide the remove button
        if (this.interactionModel.steps.length <= 1 && this.stepsData.length > 0) {
            const $removeStepButton = this.stepsData[0].container.querySelector('.removeStepButton');
            if ($removeStepButton) {
                $removeStepButton.style.display = 'none';
            }
        } else {
            this.stepsData.forEach(sd => {
                const $removeStepButton = sd.container.querySelector('.removeStepButton');
                if ($removeStepButton) {
                    $removeStepButton.style.display = 'block';
                }
            });
        }
    }

    onBackgroundWheel(evt) {
        evt.preventDefault();

        const zoomSpeed = 0.0003;  
        const delta = -evt.deltaY * zoomSpeed; // negative => zoom in
        const oldScale = this.scale;
        let newScale = oldScale + delta;
        if (newScale < this.minScale) newScale = this.minScale;
        if (newScale > this.maxScale) newScale = this.maxScale;
        if (Math.abs(newScale - oldScale) < 1e-6) return;

        // get bounding rect
        const rect = this.$backgroundContainer.getBoundingClientRect();
        const mouseX = evt.clientX - rect.left;
        const mouseY = evt.clientY - rect.top;

        // find anchor in unscaled coords
        const anchorX = (mouseX - this.offsetX) / oldScale;
        const anchorY = (mouseY - this.offsetY) / oldScale;

        // offset so anchor remains (mouseX, mouseY)
        this.offsetX = mouseX - anchorX * newScale;
        this.offsetY = mouseY - anchorY * newScale;

        // set
        this.scale = newScale;
        this.updateTransform();
        
        // if needed, re-draw
        this.connectionsManager.drawAllArrows();
    }

    updateTransform() {
        console.log('[updateTransform] apply transform.')
        this.$backgroundContainer.style.top = this.offsetY + 'px';
        this.$backgroundContainer.style.left = this.offsetX + 'px';
        this.$backgroundContainer.style.transform = `
          scale(${this.scale})
        `;

        // Then re-draw arrows if needed
        this.connectionsManager.drawAllArrows();
    }

    ensureEmptyStepAtEnd() {
        if (this.interactionModel.steps.length < this.maxSteps) {
            // Check last step's topic or remark forms
            const lastStepData = this.stepsData[this.stepsData.length - 1];
            if (!lastStepData) {
                // no steps => add
                this.addFlow();
                return;
            }
            const topicVal = lastStepData.topicForm.value.trim();
            const remarkVal = lastStepData.remarkForm.value.trim();
            if (topicVal) {
                // if we have content => add empty
                this.addFlow();
            }
        }
    }

    mount($parent) {
        $parent.appendChild(this.$view);
    }

    unmount() {
        console.log('[ProgramView] unmount() called. Cleaning up resources...');

        // 1) Stop the scheduled interval that checks for updates:
        this.destroy(); 
        //    (We already have a destroy() that clears the interval)

        // 2) If you need to remove event listeners or destroy Draggable objects,
        //    do so here. For instance, if you stored references:
        // if (this.backgroundDraggable) {
        //     this.backgroundDraggable.destroy();
        //     this.backgroundDraggable = null;
        // }
        // if (this.stepDraggables) {
        //     this.stepDraggables.forEach(d => d.destroy());
        //     this.stepDraggables = [];
        // }
        //
        // Also, if your mesh or any additional objects have `unmount()` or `destroy()` methods, 
        // call them here:
        // if (this.mesh) {
        //     this.mesh.unmount();
        //     this.mesh = null;
        // }

        // 3) Remove the root DOM element from the parent
        if (this.$view && this.$view.parentNode) {
            this.$view.parentNode.removeChild(this.$view);
        }

        // 4) Optionally, null out references to avoid memory leaks
        this.$view = null;
        this.$backgroundContainer = null;
        this.$mainContainer = null;
    }

    interactionModelObjectFromFormData() {
        const title = this.titleForm.value;
        const steps = [];
        let hasAnyStepContent = false;

        // Build each step from stepsData
        this.stepsData.forEach((stepData, index) => {
            const topicVal = stepData.topicForm.value?.trim();
            const remarkVal = stepData.remarkForm.value?.trim();

            // If user typed something, we consider it a valid step
            //if (topicVal || remarkVal) { 
                hasAnyStepContent = true;
                const referencesVal = stepData.referencesSelector
                    ? stepData.referencesSelector.value || []
                    : [];
                const referenceTypeVal = stepData.referenceTypeSelector.value;

                const stepObj = {
                    task_type: stepData.taskTypeSelector.value,
                    topic: topicVal,
                    remark: remarkVal,
                    goal: stepData.goalForm.value || '',
                    guidelines: stepData.guidelineForms.map(g => g.value || ''),
                    max_turns: parseInt(stepData.maxTurnsForm.value, 10),
                    response_mode: parseInt(stepData.responseModeSelector.value, 10),
                    reference_type: referenceTypeVal,
                    references: referenceTypeVal === 'select' ? referencesVal : [],
                    left: stepData.step.left,
                    top:  stepData.step.top
                };
                steps.push(stepObj);
            //}
        });

        //if (!hasAnyStepContent) {
        //    // Alert if no step content
        //    if (this.stepsData[0]?.remarkForm) {
        //        this.stepsData[0].remarkForm.alert(
        //            this.locale.get("create_no_remark_error", this.lang)
        //        );
        //    }
        //    console.log('No topic or remark. return null');
        //    return null;
        //}

        return {
            title,
            steps,
            zoom: this.scale,
            offset_x: this.offsetX ?? 0,
            offset_y: this.offsetY ?? 0
        };
    }

    checkForUpdates() {
        console.log("[checkForUpdates] Checking for changes in interaction model...");

        // If there's no interactionModelId, skip
        if (!this.interactionModelId) {
            console.log("[checkForUpdates] No interactionModelId present. Skipping update check.");
            return;
        }

        // Build the current data object from the form
        const currentData = this.interactionModelObjectFromFormData();
        console.log("[checkForUpdates] currentData:", currentData);

        if (!currentData) {
            // Possibly invalid or empty => skip
            console.log("[checkForUpdates] currentData is null or invalid. Skipping update.");
            return;
        }

        // Compare with the last snapshot
        const currentJson = JSON.stringify(currentData);
        if (currentJson !== this._lastSnapshot) {
            console.log("[checkForUpdates] Detected changes. Preparing to submit update...");

            // Call update
            this.submitUpdateInteractionModelAsync(this.interactionModelId)
                .then(() => {
                    // On success, update snapshot and show success
                    this._lastSnapshot = currentJson;
                    console.log("[checkForUpdates] Update successful. Snapshot refreshed.");
                })
                .catch((err) => {
                    // On error, show an alert
                    console.error("[checkForUpdates] Update failed:", err);
                });
        } else {
            console.log("[checkForUpdates] No changes detected in interaction model. No update needed.");
        }
    }

    submitCreateInteractionModel() {
        console.log("[submitCreateInteractionModel] Starting interview creation process...");

        const interviewJSON = this.interactionModelObjectFromFormData();
        console.log("[submitCreateInteractionModel] Generated interview JSON:", interviewJSON);

        if (!interviewJSON) {
            console.warn("[submitCreateInteractionModel] interviewJSON is null or invalid. Aborting creation.");
            return;
        }

        console.log("[submitCreateInteractionModel] Sending POST request to create interview...");
        this.loadingMessage.setText(this.locale.get('create_creating_new_interaction_model', this.lang), {gradient: LoadingMessageGradient.ocean});

        Http.post(
            `/v1/${this.lang}/interviews/create`,
            interviewJSON,
            (res) => {
                if (!res.ok) {
                    this.loadingMessage.setText(result.message, {alert: true})
                    throw new Error(result.message || 'Create failed.');
                }
                const { code, message } = res;
                console.log(`[submitCreateInteractionModel] [${code} success] ${message}`);
                this.loadingMessage.setText(result.message || 'Create succeeded!', {gradient: LoadingMessageGradient.bluegreen});

                this.interactionModelId = res.id;
                console.log("[submitCreateInteractionModel] Interview created successfully with ID:", res.id);

                // show url
                if (this.onInteractionModelCreated) {
                    console.log("[submitCreateInteractionModel] Calling onInteractionModelCreated callback with ID:", res.id);
                    this.onInteractionModelCreated(this.interactionModelId);
                }
            },
            (error) => {
                console.error("[submitCreateInteractionModel] Interview creation failed:", error);
                this.handleError(error);
            }
        );
    }

    submitUpdateInteractionModelAsync(interactionModelId) {
        return new Promise((resolve, reject) => {
            console.log("[submitUpdateInteractionModelAsync] Preparing to update interaction model:", interactionModelId);
            
            const interactionModelJSON = this.interactionModelObjectFromFormData();
            console.log("[submitUpdateInteractionModelAsync] interactionModelJSON:", interactionModelJSON);

            this.loadingMessage.setText(this.locale.get('create_updating_interaction_model', this.lang), {gradient: LoadingMessageGradient.gray2});

            if (!interactionModelJSON) {
                // No data or invalid => just reject
                const msg = "[submitUpdateInteractionModelAsync] No data to update. Rejecting promise.";
                console.warn(msg);
                return reject(new Error('No data to update.'));
            }

            console.log("[submitUpdateInteractionModelAsync] Sending POST request to update interaction model...");
            Http.post(
                `/v1/${this.lang}/interaction_model/${interactionModelId}/update`,
                interactionModelJSON,
                (res) => {
                    const { code, message } = res;
                    console.log(`[submitUpdateInteractionModelAsync] [${code} success] ${message}`);
                    this.loadingMessage.setText(
                        this.locale.get('create_interaction_model_updated', this.lang),
                        { gradient: LoadingMessageGradient.gray2 }
                    );
                    console.log("[submitUpdateInteractionModelAsync] Update operation resolved successfully.");
                    resolve();
                },
                (error) => {
                    console.error("[submitUpdateInteractionModelAsync] Update operation failed:", error);
                    this.handleError(error, this.$message);
                    reject(error);
                }
            );
        });
    }

    submitUpdateInteractionModel(interactionModelId) {
        const interactionModelJSON = this.interactionModelObjectFromFormData();
        if (!interactionModelJSON) {
            return;
        }

        this.loadingMessage.setText('Updating interaction model...', {
            gradient: LoadingMessageGradient.ocean
        });

        Http.post(`/v1/${this.lang}/interaction_model/${interactionModelId}/update`, 
            interactionModelJSON,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.loadingMessage.setText('Update successful!', {
                    gradient: LoadingMessageGradient.bluegreen
                });
            },
            (error) => {
                this.handleError(error);
            }
        );
    }

    handleError(error) {
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
                        default: {
                            // e.g., "topic_0", "remark_1", "guideline_2_1"...
                            const stepMatchTopic = field_name.match(/^topic_(\d+)$/);
                            const stepMatchRemark = field_name.match(/^remark_(\d+)$/);
                            const stepMatchGoal  = field_name.match(/^goal_(\d+)$/);
                            const stepMatchGuide = field_name.match(/^guideline_(\d+)_(\d+)$/);

                            if (stepMatchTopic) {
                                const stepIndex = parseInt(stepMatchTopic[1], 10);
                                this.stepsData[stepIndex]?.topicForm?.alert(message);
                            } else if (stepMatchRemark) {
                                const stepIndex = parseInt(stepMatchRemark[1], 10);
                                this.stepsData[stepIndex]?.remarkForm?.alert(message);
                            } else if (stepMatchGoal) {
                                const stepIndex = parseInt(stepMatchGoal[1], 10);
                                this.stepsData[stepIndex]?.goalForm?.alert(message);
                            } else if (stepMatchGuide) {
                                const stepIndex = parseInt(stepMatchGuide[1], 10);
                                const guideSubIndex = parseInt(stepMatchGuide[2], 10);
                                this.stepsData[stepIndex]?.guidelineForms[guideSubIndex]?.alert(message);
                            } else if (message) {
                                console.error(`[handleError] Unexpected API Error`, message)
                            }
                            break;
                        }
                    }
                });
            } else if (message) {
                console.error(`[handleError] API Error with errors`, errors)
                this.loadingMessage.setText(message, {alert: true});
            }
        } else {
            console.error(error);
            this.loadingMessage.setText('An unexpected error occurred.', {alert: true});
        }
    }

    destroy() {
        if (this.updateScheduler) {
            clearInterval(this.updateScheduler);
            this.updateScheduler = null;
        }
    }

    addTestView() {
        // Create container
        this.$testView = document.createElement('div');
        this.$testView.classList.add('testView');
    
        //// If script is not loaded globally, inject the script
        //const $scriptTag = document.createElement('script');
        ////$scriptTag.src = 'https://quantz.thinkxinc.com/js/dist/quantz-button.min.js';
        //$scriptTag.src = 'https://quantz.thinkxinc.com/js/dist/quantz-button-v10-dev.js';
        //this.$testView.appendChild($scriptTag);
    
        // Create quantz-loader
        const $loader = document.createElement('div');
        $loader.classList.add('QBTN-button-loader');
        $loader.setAttribute('data-publisher-id', '6761336d842132052346a1bd');
    
        const cfg = {
            "buttonType": "Default",
            "iconSize": 30,
            "fontSize": 13,
            "buttonWidth": 120,
            "buttonHeight": 50,
            "buttonColor": "#930ea4",
            "borderRadius": 20,
            "displayLocale": true,
            "balloonRectWidth": "17vw",
            "balloonRectHeight": "30vh",
            "defaultLang": this.lang,
            "modelId": this.interactionModelId,
            "responseMode": 0
        };
        $loader.setAttribute('data-quantz-config', JSON.stringify(cfg));
    
    
        this.$programViewContainer.appendChild(this.$testView);
        this.$testView.appendChild($loader);
    }
}
