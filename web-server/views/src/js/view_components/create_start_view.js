/**
 * A view class responsible for building and handling the Start Page,
 * including fetching and displaying the list of interaction models.
 */

const VOICE_SET_LABEL_COLOR_PATTERNS = [
    'var(--voiceset-label-bg-blue)',
    'var(--voiceset-label-bg-green)',
    'var(--voiceset-label-bg-yellow)',
    'var(--voiceset-label-bg-red)',
    'var(--voiceset-label-bg-purple)'
];

class CreateStartView {
    constructor({ locale, lang, onNext, onInteractionModelClick }) {
        this.locale = locale;
        this.lang = lang;
        this.onNext = onNext;
        this.onInteractionModelClick = onInteractionModelClick;

        // Build the DOM
        this.$view = this.createView();

        // Fetch data
        this.fetchInteractionModels()
            .catch(err => {
                console.error('[CreateStartView] fetchInteractionModels() failed:', err);
            });
    }

    createView() {
        const $container = document.createElement('div');
        $container.classList.add('StartPageWrapper');

        // --- The "Start" button below ---
        const $button = document.createElement('button');
        $button.classList.add('StartPageButton');

        const $startButtonText = document.createElement('span');
        $startButtonText.textContent =
            this.locale.get("create_start_button", this.lang) ||
            "Start Creating your Conversation System";
        $button.appendChild($startButtonText);

        $button.addEventListener('click', () => {
            $button.classList.add('action');
            setTimeout(() => {
                $button.classList.remove('action');
                if (typeof this.onNext === 'function') {
                    this.onNext();
                }
            }, 300);
        });

        $container.appendChild($button);

        // LoadingMessageWrapper
        const $loadingMessageWrapper = document.createElement('div');
        $loadingMessageWrapper.classList.add('LoadingMessageWrapper');

        //   - The LoadingMessage inside it
        this.loadingMessage = new LoadingMessage({
            id: 'StartPageLoadingMessage',
            pattern: LoadingMessagePattern.B,
            textAlign: LoadingMessageTextAlign.center,
            minimumWaitTimeMs: 0
        });
        $loadingMessageWrapper.appendChild(this.loadingMessage.$view);
        $container.appendChild($loadingMessageWrapper);

        // --- The container for the Interaction Models ---
        this.$interactionModelListContainer = document.createElement('div');
        this.$interactionModelListContainer.id = 'InteractionModelListContainer';
        this.$interactionModelListContainer.style.display = 'none';
        $container.appendChild(this.$interactionModelListContainer);

        // GradientViewLoader
        this.loader = new GradientViewLoader({
            id: 'InteractionModelListGradientLoader',
            numIndicator: 1,
            indicatorWidth: 500,
            individualHeight: 3,
            spaceBetween: 5,
            alignment: IndicatorAlignment.center,
            initialBaseColor: [80, 80, 80],
            animationDelay: 5,
            initialX1: -50,
            defaultShift: 10,
            shiftAmount: -20,
            rx: 2,
            ry: 2,
        });
        this.loader.mount(this.$interactionModelListContainer);

        this.$interactionModelsScrollWrapper = document.createElement('div');
        this.$interactionModelsScrollWrapper.classList.add('InteractionModelsScrollWrapper');
        this.$interactionModelsScrollWrapper.addEventListener(
            'wheel',
            (evt) => {
                evt.preventDefault();
                this.$interactionModelsScrollWrapper.scrollLeft += evt.deltaY;
            },
            { passive: false }
        );

        this.$interactionModelListContainer.appendChild(this.$interactionModelsScrollWrapper);

        this.$interactionModelsList = document.createElement('ul');
        this.$interactionModelsList.classList.add('InteractionModelList');
        this.$interactionModelsScrollWrapper.appendChild(this.$interactionModelsList);

        return $container;
    }

    async fetchInteractionModels() {
        this.loader.startLoading();
        const loadingText =
            this.locale.get('create_interaction_model_list_loading', this.lang) ||
            'Loading interaction models...';
        this.loadingMessage.setText(loadingText, {
            loading: true,
            gradient: LoadingMessageGradient.ocean,
            fadeOutAfterMs: 0
        });

        try {
            const endpoint = `/v1/${this.lang}/interaction_model/list?sort=latest`;
            const res = await fetch(endpoint, { method: 'GET' });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || 'Failed to fetch interaction models');
            }

            const successText = json.message || 'Success';
            this.loadingMessage.setText(
                successText,
                {
                    gradient: LoadingMessageGradient.ocean
                },
                () => {
                    // callback after setting text
                    this.loader.stopLoading();
                    const interactionModels = json.interaction_models || [];
                    this.renderInteractionModelList(interactionModels);

                }
            );

        } catch (err) {
            this.loadingMessage.setText(String(err.message || err), { alert: true });
            throw err;
        } finally {
            this.$interactionModelListContainer.style.display = 'block';
        }
    }

    /**
     * Renders the list of interaction models.
     * Each item includes:
     *   - <h4> for the title
     *   - <span> for the voicsetName
     *   - <span> for updatedStr
     *   - a <div class="control"> containing .edit and .delete
     */
    renderInteractionModelList(interactionModels) {
        // Clear old items, if any
        this.$interactionModelsList.innerHTML = '';

        interactionModels.forEach(model => {
            // Create one <li> per model
            const $interactionModel = document.createElement('li');
            $interactionModel.classList.add('InteractionModel');
    
            // For readability
            const title       = model.title        || '(no title)';
            const updatedStr  = model.updated_str  || '(no time)';
            const voicsetName = model.voiceset?.name || '(no voice)';
    
            // main container
            const $main = document.createElement('div');
            $main.classList.add('main');
    
            // 1) <h4> for title
            const $title = document.createElement('h4');
            $title.classList.add('title');
            $title.textContent = title;
            $main.appendChild($title);
    
            // 2) <span> for the voicesetName
            const $voicset = document.createElement('span');
            $voicset.classList.add('voicesetName');
            $voicset.textContent = voicsetName;
            const colorIndex = this.hashVoicesetName(voicsetName);
            const bgColor = VOICE_SET_LABEL_COLOR_PATTERNS[colorIndex];
            $voicset.style.backgroundColor = bgColor;
            $main.appendChild($voicset);
    
            // footer container
            const $footer = document.createElement('div');
            $footer.classList.add('footer');
    
            // 3) <span> for created_str
            const $createdSpan = document.createElement('span');
            $createdSpan.classList.add('updatedStr');
            $createdSpan.textContent = updatedStr;
            $footer.appendChild($createdSpan);
    
            // Append them to the $interactionModel
            $interactionModel.appendChild($main);
            $interactionModel.appendChild($footer);
    
            // ---- the .control container (fade in on hover) ----
            const $control = document.createElement('div');
            $control.classList.add('control');
    
            // .edit
            const $edit = document.createElement('div');
            $edit.classList.add('edit');
            // Replace text with an SVG icon
            $edit.innerHTML = `<img src="/img/create/edit-icon.svg" alt="Edit" />`;
            $edit.addEventListener('click', (evt) => {
                evt.stopPropagation(); // Prevent the entire li's click from also firing
                if (typeof this.onInteractionModelClick === 'function') {
                    this.onInteractionModelClick(model);
                }
            });
            $control.appendChild($edit);

            const $editTooltip = document.createElement('span');
            $editTooltip.classList.add('tooltip');
            $editTooltip.textContent = this.locale.get('create_edit_interaction_model_tooltip', this.lang);
            $edit.appendChild($editTooltip);
 
    
            // .delete
            const $delete = document.createElement('div');
            $delete.classList.add('delete');
            // Replace text with an SVG icon
            $delete.innerHTML = `<img src="/img/create/delete-icon.svg" alt="Delete" />`;
            $delete.addEventListener('click', (evt) => {
                evt.stopPropagation(); 
                this.deleteInteractionModel(model);
            });
            $control.appendChild($delete);

            const $deleteTooltip = document.createElement('span');
            $deleteTooltip.classList.add('tooltip');
            $deleteTooltip.textContent = this.locale.get('create_delete_interaction_model_tooltip', this.lang);
            $delete.appendChild($deleteTooltip);
    
            // Add the .control div to the $interactionModel
            $interactionModel.appendChild($control);
    
            // If user clicks the main part of the li, call onInteractionModelClick
            $interactionModel.addEventListener('click', () => {
                console.log('[CreateStartView] Interaction model clicked:', model);
                if (typeof this.onInteractionModelClick === 'function') {
                    this.onInteractionModelClick(model);
                }
            });
    
            // Finally, add the $interactionModel <li> to the <ul>
            this.$interactionModelsList.appendChild($interactionModel);
        });
    }

    /**
     * Show a confirmation Modal, and delete the model if user clicks "Done"
     */
    deleteInteractionModel(model) {
        const modalMessage = this.locale.get("create_delete_interaction_model_message", this.lang, [model.title]);

        const modal = new ModalView({
            id: 'DeleteInteractionModelModal',
            title: this.locale.get("create_delete_interaction_model_title", this.lang),
            text: modalMessage,
            cancelButtonText: this.locale.get("create_delete_modal_cancel_button", this.lang),
            doneButtonText: this.locale.get("create_delete_modal_done_button", this.lang),
            showAnimation: AnimationType.EXPAND,
            closeAnimation: AnimationType.SHRINK,
            baseCSSStyle: ModalViewStyle.DEFAULT,
            onDone: async () => {
                // Send delete request
                const endpoint = `/v1/${this.lang}/interaction_model/${model.id}/delete`;
                try {
                    const res = await fetch(endpoint, { method: 'GET' });
                    if (!res.ok) {
                        const errJson = await res.json();
                        const errMsg = errJson.message || 'Failed to delete.';
                        alert(errMsg);
                        return;
                    }
                    // If success, optionally refetch or remove from list
                    const data = await res.json();
                    console.log('[DeleteInteractionModelModal] success:', data);
                    // Refresh the list or remove the item
                    // E.g., call fetchInteractionModels() again:
                    await this.fetchInteractionModels();
                } catch (e) {
                    console.error('[DeleteInteractionModelModal] error:', e);
                    alert('Error while deleting interaction model');
                } finally {
                    modal.close();
                }
            }
        });

        // Mount and show
        modal.mount(document.body);
        modal.show();
    }

    /**
     * a simple hash function for distributing label colors
     */
    hashVoicesetName(str) {
        let hashValue = 0;
        for (let i = 0; i < str.length; i++) {
          hashValue = (hashValue << 5) - hashValue + str.charCodeAt(i);
          hashValue |= 0; // convert to 32-bit integer
        }
        // Make sure it's positive and within array bounds
        return Math.abs(hashValue) % VOICE_SET_LABEL_COLOR_PATTERNS.length;
    }

}
