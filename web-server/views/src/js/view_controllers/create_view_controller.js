class CreateViewController {
    constructor({
        id,
        locale,
        lang = 'en',
        user,
        interactionModelId,
        interactionModel,
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;

        this.user = user;

        document.body.classList.add('dark'); // TODO: switch
        document.body.style.overflow = 'hidden';

        // The main container where we mount the PageView
        this.$mainContent = document.getElementById('MainContent');

        const page = Browser.getURLParam('page');        // e.g. 'voiceset' or 'program'
        const modelId = Browser.getURLParam('model_id'); // e.g. 'abc123' if present
        console.log(window.location.search)
        console.log(page)
        console.log(modelId)
        const modelId2 = Browser.getValueFromSearchParams('model_id'); // e.g. 'abc123' if present
        console.log(modelId2)
        console.log(location.href);

        // Create a PageView with 3 pages: 0=Start, 1=Voice, 2=Program
        this.pageView = new PageView({
            id: 'CreatePageView',
            numPages: 3,
        });

        if (modelId) {
            this.fetchInteractionModel(modelId).then((model) => {
                this.interactionModel = model;
                this.interactionModelId = model.id;
                this.setupView();
    
                if (page === 'voiceset') {
                    this.goToVoiceSetSelectView();
                } else if (page === 'program') {
                    this.goToProgramView(model);
                } else {
                    // Default to Start page if no recognized page param
                    this.pageView.show(0);
                }
            });
        } else {
            // If no model_id, maybe just show Start page
            this.pageView.show(0);

            this.interactionModelId = interactionModelId;
            this.interactionModel = interactionModel || defaults;

            this.setupView();
        }

        // Set up the view (build the pages, mount them, etc.)

        //this.pageView.show(2); // DEBUG
    }

    get interactionModelId() {
        return this._interactionModelId;
    }

    set interactionModelId(value) {
        this._interactionModelId = value;
        // Whenever we set the model ID, update the URL param:
        Browser.setQueryParam('model_id', value || null);
    }

    setupView() {
        console.log('[CreateViewController] setupView called.');

        // --- Page 0: Start Page ---
        const startView = new CreateStartView({
            locale: this.locale,
            lang: this.lang,
            onNext: () => {
                console.log('[CreateViewController] onNext from StartView called. Navigating to Voice page.');
                this.goToVoiceSetSelectView();
            },
            onInteractionModelClick: (model) => {
                console.log('[CreateViewController] Interaction model clicked:', model);
                this.editInteractionModel(model);
            }
        });
        this.pageView.appendChild(startView.$view, 0);

        // --- Page 1: Voice Page ---

        // --- Page 2: Program Page ---
        console.log('[CreateViewController] Creating ProgramView...');
        this.programPageWrapper = document.createElement('div');
        this.programPageWrapper.classList.add('ProgramPageWrapper');
        this.pageView.appendChild(this.programPageWrapper, 2);

        //this.programView = new ProgramView({
        //    id: 'ProgramView',
        //    locale: this.locale,
        //    lang: this.lang,
        //    user: this.user,
        //    interactionModelId: this.interactionModelId,
        //    interactionModel: this.interactionModel,
        //    onInteractionModelCreated: (id) => {
        //        this.handleInteractionModelCreated(id);
        //    },
        //    onChangeVoiceSet: () => {
        //        // This will be invoked when $changeButton is clicked in ProgramView
        //        console.log('Switching to Voice Page (page index = 1)');
        //        this.pageView.show(1);
        //    }
        //});
        //console.log('[CreateViewController] ProgramView created.');

        // // Create a container to mount the ProgramView
        // const programPageElement = document.createElement('div');
        // programPageElement.classList.add('ProgramPageWrapper');
        // this.programView.mount(programPageElement);

        // this.pageView.appendChild(programPageElement, 2);

        // Finally, mount the entire PageView into the main content area
        this.pageView.mount(this.$mainContent);
        console.log('[CreateViewController] PageView mounted to MainContent.');
    }

    createVoiceSetSelectView() {
        console.log('[CreateViewController] createVoiceSetSelectView called.');
        // If an old instance exists, remove/unmount it
        if (this.voiceSetSelectView) {
            // Optionally remove from DOM if you want a fresh re-creation:
            this.voiceSetSelectView.$view.remove();
            this.voiceSetSelectView = null;
        }

        // Determine which voiceGroup is currently selected in the interactionModel
        // (Typically something like interactionModel.voiceset.id or entire object.)
        const selectedVoiceGroupId = this.interactionModel?.voiceset?.id;

        // Create the new VoiceSetSelectView instance
        this.voiceSetSelectView = new VoiceSetSelectView({
            locale: this.locale,
            lang: this.lang,
            interactionModelId: this.interactionModelId,
            interactionModel: this.interactionModel,
            onVoiceSelected: (voiceGroup, loadButton) => {
                this.handleVoiceSelection(voiceGroup, loadButton);
            },
            getInteractionModelId: () => this.interactionModelId,
            createInteractionModel: () => this.createInteractionModel(),
            updateInteractionModel: () => this.updateInteractionModel(),
            submitVoiceSet: () => this.submitVoiceSet(),
        });

        // Put it into PageView’s page index=1
        this.pageView.appendChild(this.voiceSetSelectView.$view, 1);
    }

    createProgramView(interactionModel, loadingMessage) {
        console.log('[CreateViewController] createProgramView called.');
    
        // Optionally update a loading message:
        if (loadingMessage) {
            // For example, show “Preparing Program View…”
            loadingMessage.setText(
                this.locale.get('create_prepare_program_view', this.lang), 
                { gradient: LoadingMessageGradient.ocean }
            );
        }
    
        // If there's an existing ProgramView, remove/unmount it if you wish
        if (this.programView) {
            this.programView.unmount();  // If your ProgramView has an unmount() method
            this.programView = null;
        }
    
        // Now create a fresh ProgramView. 
        this.programView = new ProgramView({
            id: 'ProgramView',
            locale: this.locale,
            lang: this.lang,
            user: this.user,
            interactionModelId: interactionModel.id, 
            interactionModel: interactionModel,
            onInteractionModelCreated: (id) => {
                this.handleInteractionModelCreated(id);
            },
            onChangeVoiceSet: () => {
                console.log('Switching back to Voice Page (page=1)');
                this.goToVoiceSetSelectView();
            },
        });
    
        // Mount the newly created ProgramView
        this.programView.mount(this.programPageWrapper);
        console.log('[CreateViewController] ProgramView created & mounted.');
    }

    goToVoiceSetSelectView() {
        // 1) Create or re-create the view
        this.createVoiceSetSelectView();
        
        // 2) Show page=1 in PageView
        this.pageView.show(1);
    
        // 3) Update the URL
        Browser.setQueryParam('page', 'voiceset');
        if (this.interactionModelId) {
            Browser.setQueryParam('model_id', this.interactionModelId, true);
        } else {
            Browser.setQueryParam('model_id', null, true);
        }
    
        // 4) Animation
        if (this.voiceSetSelectView && typeof this.voiceSetSelectView.openAnimation === 'function') {
            this.voiceSetSelectView.openAnimation();
        }
    }
    
    goToProgramView(interactionModel, loadingMessage) {
        // 1) Update our controller’s model references
        this.interactionModel = interactionModel;
        this.interactionModelId = interactionModel.id;
        
        // 2) Create the ProgramView
        this.createProgramView(interactionModel, loadingMessage);
        
        // 3) Switch to page=2
        this.pageView.show(2);
    
        // 4) Update the URL
        Browser.setQueryParam('page', 'program');
        Browser.setQueryParam('model_id', this.interactionModelId, true);
    }

    editInteractionModel(model, loadingMessage) {
        console.log('[CreateViewController] editInteractionModel called with:', model);
        this.goToProgramView(model, loadingMessage);
    }
    

    handleVoiceSelection(voiceGroup, loadButton) {
        // This logic used to be in onSelectButtonClicked(voiceGroup, loadButton).
        // You can reuse the same code here or keep it separate.
        ScreenLock.lock();
        loadButton.load(true);

        // Save the voiceGroup
        this.voiceset = voiceGroup;

        if (this.interactionModelId) {
            console.log('[CreateViewController] Updating existing interaction model:', this.interactionModelId);
            this.voiceSetSelectView.loadingMessage.setText(
                this.locale.get('create_updating_interaction_model', this.lang),
                { gradient: LoadingMessageGradient.ocean }
            );
            this.updateInteractionModel()
                .then((interactionModel) => {
                    this.interactionModel = interactionModel;
                    this.interactionModelId = interactionModel.id;
                    this.submitVoiceSet()
                })
                .then(() => {
                    loadButton.load(false);
                    setTimeout(() => {
                        ScreenLock.lock(false);
                        this.goToProgramView(this.interactionModel, this.voiceSetSelectView.loadingMessage);
                    }, 1000);
                })
                .catch(err => {
                    ScreenLock.lock(false);
                    console.error('[CreateViewController] Error in update:', err);
                    this.voiceSetSelectView.loadingMessage.setText(`${err.message || err}`, { alert: true });
                    loadButton.load(false);
                });
        } else {
            console.log('[CreateViewController] Creating new interaction model...');
            this.voiceSetSelectView.loadingMessage.setText(
                this.locale.get('create_creating_new_interaction_model', this.lang),
                { gradient: LoadingMessageGradient.ocean }
            );
            setTimeout(() => {
                this.createInteractionModel()
                    .then((interactionModel) => {
                        this.interactionModel = interactionModel;
                        this.interactionModelId = interactionModel.id;
                        return this.submitVoiceSet();
                    })
                    .then(() => this.submitVoiceSet())
                    .then(() => {
                        loadButton.load(false);
                        setTimeout(() => {
                            ScreenLock.lock(false);
                            this.goToProgramView(this.interactionModel, this.voiceSetSelectView.loadingMessage);
                        }, 1000);
                    })
                    .catch((err) => {
                        console.error('[CreateViewController] Error in create+submit:', err);
                        this.voiceSetSelectView.loadingMessage.setText(`${err.message || err}`, { alert: true });
                        loadButton.load(false);
                        ScreenLock.lock(false);
                    });
            }, 2000);
        }
    }

    async fetchInteractionModel(id) {
        const endpoint = `/v1/${this.lang}/interaction_model/${id}`;
        console.log(`[CreateViewController] GET => ${endpoint}`);
    
        try {
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await res.json();
    
            if (!res.ok) {
                console.error('[CreateViewController] fetchInteractionModel error =>', result);
                throw new Error(result.message || 'Could not fetch Interaction Model');
            }
    
            console.log('[CreateViewController] fetchInteractionModel result =>', result);
            return result.interaction_model;
        } catch (err) {
            console.error('[CreateViewController] fetchInteractionModel Exception =>', err);
            throw err;
        }
    }

    async createInteractionModel() {
        const endpoint = `/v1/${this.lang}/interaction_model/create`;
        const body = { title: "", voiceset: this.voiceset };
        console.log('[CreateViewController] POST =>', endpoint, body);

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        const { interaction_model, message } = result;
        console.log(`[createInteractionModel] response result`, result)
        console.log(`[createInteractionModel] `, message)
        if (!res.ok) {
            this.voiceSetSelectView.loadingMessage.setText(result.message, {alert: true})
            throw new Error(result.message || 'Create failed.');
        }
        // Show success
        this.voiceSetSelectView.loadingMessage.setText(message || 'Create succeeded!', {gradient: LoadingMessageGradient.ocean});

        return interaction_model; 
    }

    async updateInteractionModel() {
        const endpoint = `/v1/${this.lang}/interaction_model/${this.interactionModelId}/update`;
        const body = { voiceset: this.voiceset };
        console.log('[CreateViewController] POST =>', endpoint, body);

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        const { interaction_model, message } = result;
        console.log(`[updateInteractionModel] response result`, result)
        console.log(`[updateInteractionModel] `, message)
        if (!res.ok) {
            this.voiceSetSelectView.loadingMessage.setText(result.message, {alert: true});
            throw new Error(result.message || 'Update failed.');
        }
        // Show success
        this.voiceSetSelectView.loadingMessage.setText(message, {gradient: LoadingMessageGradient.ocean});
        return interaction_model
    }

    /**
     * Submits the entire voiceset for the currently selected languages
     */
    submitVoiceSet() {
        console.log('[CreateViewController] submitVoiceSet called with voiceset:', this.voiceset);
        const endpoint = `/v1/${this.lang}/interaction_model/${this.interactionModelId}/update`;
        // We can re-use the same logic as updateInteractionModel or do it inline:
        return fetch(endpoint, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voiceset: this.voiceset }),
        })
        .then(async (res) => {
            const result = await res.json();
            if (!res.ok) {
                console.error('[CreateViewController] voiceset update error:', result);
                this.voiceSetSelectView.loadingMessage.setText(result.message, {alert: true});
                throw new Error(result.message || 'Update failed.');
            }
            console.log('[CreateViewController] Voice set updated:', result);
            this.voiceSetSelectView.loadingMessage.setText(result.message, {gradient: LoadingMessageGradient.ocean});

            // Possibly go to next page automatically, or not:
            // this.pageView.show(2);
        })
        .catch((err) => {
            console.error('[CreateViewController] submitVoiceSet error:', err);
            this.voiceSetSelectView.loadingMessage.setText(`${err.message || 'Submit voiceset failed.'}`, {alert: true});
            throw err;
        });
    }

    /**
     * Callback for ProgramView creation
     */
    handleInteractionModelCreated(id) {
        console.log('[CreateViewController] handleInteractionModelCreated called. ID:', id);
        // Possibly show success or move to a new route.
    }
}

