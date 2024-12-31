/**
 * A view class responsible for building and handling the Start Page,
 * including fetching and displaying the list of interaction models.
 */
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
            textAlign: LoadingMessageTextAlign.center
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
            numIndicator: 3,
            indicatorWidth: 500,
            individualHeight: 3,
            spaceBetween: 5,
            alignment: IndicatorAlignment.center,
            initialBaseColor: [80, 80, 80],
            animationDelay: 10,
            initialX1: -50,
            defaultShift: 10,
            shiftAmount: -20,
            rx: 2,
            ry: 2,
        });
        this.loader.mount(this.$interactionModelListContainer);
 
        this.$interactionModelsScrollWrapper = document.createElement('div');
        this.$interactionModelsScrollWrapper.classList.add('InteractionModelsScrollWrapper');
        this.$interactionModelsScrollWrapper.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            this.$interactionModelsScrollWrapper.scrollLeft += evt.deltaY;
        }, { passive: false });

        this.$interactionModelListContainer.appendChild(this.$interactionModelsScrollWrapper);


        this.$interactionModelsList = document.createElement('ul');
        this.$interactionModelsList.classList.add('InteractionModelList');
        this.$interactionModelsScrollWrapper.appendChild(this.$interactionModelsList);

        return $container;
    }

    async fetchInteractionModels() {
        this.loader.startLoading();
        const loadingText = this.locale.get('create_interaction_model_list_loading', this.lang)
            || 'Loading interaction models...';
        this.loadingMessage.setText(loadingText, {
            loading: true,
            gradient: LoadingMessageGradient.ocean
        });

        try {
            const endpoint = `/v1/${this.lang}/interaction_model/list`;
            const res = await fetch(endpoint, { method: 'GET' });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || 'Failed to fetch interaction models');
            }

            const successText = json.message || 'Success';
            this.loadingMessage.setText(successText, {
                gradient: LoadingMessageGradient.ocean
            }, () => {
                this.loader.stopLoading();
                const interactionModels = json.interaction_models || [];
                this.renderInteractionModelList(interactionModels);
            });
            //    this.loader.stopLoading();
            //    const interactionModels = json.interaction_models || [];
            //    this.renderInteractionModelList(interactionModels);
 
        } catch (err) {
            this.loadingMessage.setText(String(err.message || err), { alert: true });
            throw err;
        } finally {
            //this.loader.stopLoading();
            this.$interactionModelListContainer.style.display = 'block';
        }
    }

    /**
     * Renders the list of interaction models.
     * Each item includes:
     *   - <h4> for the title
     *   - <span> for the createdStr
     *   - <span> for the voicsetName
     */
    renderInteractionModelList(interactionModels) {
        // Clear old items, if any
        this.$interactionModelsList.innerHTML = '';

        interactionModels.forEach(model => {
            // Create one <li> per model
            const $interactionmodel = document.createElement('li');
            $interactionmodel.classList.add('InteractionModel');

            const title        = model.title || '(no title)';
            const createdStr   = model.created_str || '(no time)';
            const voicsetName  = model.voiceset?.name || '(no voice)';

            // 1) <h4> for title
            const $titleEl = document.createElement('h4');
            $titleEl.classList.add('title');
            $titleEl.textContent = title;

            // 2) <span> for created_str
            const $createdSpan = document.createElement('span');
            $createdSpan.classList.add('createdStr');
            $createdSpan.textContent = createdStr;

            // 3) <span> for voicsetName
            const $voicsetSpan = document.createElement('span');
            $voicsetSpan.classList.add('voicesetName');
            $voicsetSpan.textContent = voicsetName;

            // Append them to the <li>
            $interactionmodel.appendChild($titleEl);
            $interactionmodel.appendChild($createdSpan);
            $interactionmodel.appendChild($voicsetSpan);

            // Add click handler
            $interactionmodel.addEventListener('click', () => {
                console.log('[CreateStartView] Interaction model clicked:', model);
                if (typeof this.onInteractionModelClick === 'function') {
                    this.onInteractionModelClick(model);
                }
            });

            // Finally, add the <li> to the <ul>
            this.$interactionModelsList.appendChild($interactionmodel);
        });
    }
}
