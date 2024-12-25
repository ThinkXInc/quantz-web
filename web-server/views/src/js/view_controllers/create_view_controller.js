/* global PageView, ProgramView, defaults */

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

        // The main container where we mount the PageView
        this.$mainContent = document.getElementById('MainContent');

        this.user = user;
        this.interactionModelId = interactionModelId;
        this.interactionModel = interactionModel || defaults;

        // Create a PageView with 3 pages: 0=Start, 1=Voice, 2=Program
        this.pageView = new PageView({
            id: 'CreatePageView',
            numPages: 3,
        });

        // For showing any global messages (optional)
        this.$message = document.getElementById('Message');

        // Set up the view (build the pages, mount them, etc.)
        this.setupView();
    }

    setupView() {
        console.log('[CreateViewController] setupView called.');

        // --- Page 0: Start Page ---
        const startPageElement = this.createStartPage();
        this.pageView.appendChild(startPageElement, 0);

        // --- Page 1: Voice Page ---
        const voicePageElement = this.createVoicePage();
        this.pageView.appendChild(voicePageElement, 1);

        // --- Page 2: Program Page ---
        console.log('[CreateViewController] Creating ProgramView...');
        this.programView = new ProgramView({
            id: 'ProgramView',
            locale: this.locale,
            lang: this.lang,
            user: this.user,
            interactionModelId: this.interactionModelId,
            interactionModel: this.interactionModel,
            $message: this.$message,
            onInteractionModelCreated: (id) => {
                this.handleInteractionModelCreated(id);
            }
        });
        console.log('[CreateViewController] ProgramView created.');

        // Create a container to mount the ProgramView
        const programPageElement = document.createElement('div');
        programPageElement.classList.add('ProgramPageWrapper');
        this.programView.mount(programPageElement);

        this.pageView.appendChild(programPageElement, 2);

        // Finally, mount the entire PageView into the main content area
        this.pageView.mount(this.$mainContent);
        console.log('[CreateViewController] PageView mounted to MainContent.');
    }

    // ================
    // Page 0: Start Page
    // ================
    createStartPage() {
        console.log('[CreateViewController] createStartPage called.');
        const $container = document.createElement('div');
        $container.classList.add('StartPageWrapper');

        // A button in the center to go to the next page
        const $button = document.createElement('button');
        $button.classList.add('StartPageButton');

        // Example usage of locale JSON to get the button label
        const $startButtonText = document.createElement('span');
        $startButtonText.textContent = this.locale.get("create_start_button", this.lang) 
            || "Start Creating your Conversation System";
        $button.appendChild($startButtonText);

        // When clicked, go to the Voice page (index=1)
        $button.addEventListener('click', () => {
            console.log('[CreateViewController] Start page button clicked. Moving to Voice page.');
            $button.classList.add('action');
            setTimeout(() => {
                $button.classList.remove('action');
                this.pageView.show(1);
            }, 300);
        });

        $container.appendChild($button);
        return $container;
    }

    // ================
    // Page 1: Voice Page
    // ================
    createVoicePage() {
        console.log('[CreateViewController] createVoicePage called.');
        const $container = document.createElement('div');
        $container.classList.add('VoicePageWrapper');

        // We’ll build a sample VoiceGroupList. 
        // Example voice data—replace or extend as needed:
        const voiceGroups = this.getVoiceGroupList();

        // The main wrapper for the voice group list
        const $voiceGroupList = document.createElement('div');
        $voiceGroupList.classList.add('VoiceGroupList');

        voiceGroups.forEach((voiceGroup) => {
            const $voiceGroupWrapper = this.createVoiceGroupDOM(voiceGroup);
            $voiceGroupList.appendChild($voiceGroupWrapper);
        });

        // Language selector (as in your snippet)
        // Typically, you might do an include of `lang_selector.html`,
        // but for demonstration, we’ll just create a container
        const $localeWrapper = document.createElement('div');
        $localeWrapper.classList.add('locale');
        // For actual usage, you might do server-side injection or simply:
        // $localeWrapper.innerHTML = `{% include 'common/lang_selector.html' %}`;

        $container.appendChild($voiceGroupList);
        $container.appendChild($localeWrapper);

        return $container;
    }

    /**
     * Example function that returns an array of voice groups.
     * Normally, you'd fetch or define these from a data source.
     */
    getVoiceGroupList() {
        console.log('[CreateViewController] getVoiceGroupList called.');
        const lang = this.lang;

        // For demonstration, we use your sample snippet:
        // (In real usage, fill in `en` or other locales as well)
        const japaneseCategoryLabel = this.locale.get("create_voice_category_japanese", lang);
        const femaleCategoryLabel   = this.locale.get("create_voice_category_female", lang);
        const maleCategoryLabel     = this.locale.get("create_voice_category_male", lang);
        const conversationalLabel   = this.locale.get("create_voice_category_conversational", lang);

        return [
            {
                "id": "fo",
                "ja": {
                    "name": "fo-JA",
                    "url": "/audio/voice_set_samples/fo_sample.wav",
                    "categories": [
                        japaneseCategoryLabel,
                        femaleCategoryLabel,
                        conversationalLabel
                    ]
                },
                "en": {
                    "name": "fo-EN",
                    "url": "/audio/voice_set_samples/fo_sample_en.wav",
                    "categories": [
                        "English",
                        "Female",
                        "Conversational"
                    ]
                }
            },
            // ... Add more voice items as needed
        ];
    }

    /**
     * Creates the DOM structure for a single "VoiceGroup"
     */
    createVoiceGroupDOM(voiceGroup) {
        console.log('[CreateViewController] createVoiceGroupDOM called. voiceGroup.id:', voiceGroup.id);
        const $voiceGroup = document.createElement('div');
        $voiceGroup.classList.add('VoiceGroup');

        const $voiceGroupWrapper = document.createElement('div');
        $voiceGroupWrapper.classList.add('VoiceGroupWrapper');

        // VoiceOptionsWrapper
        const $voiceOptionsWrapper = document.createElement('div');
        $voiceOptionsWrapper.classList.add('VoiceOptionsWrapper');

        // VoiceOptions
        const $voiceOptions = document.createElement('div');
        $voiceOptions.classList.add('VoiceOptions');

        // For each language in the voiceGroup, create a .VoiceOption
        Object.keys(voiceGroup).forEach((langKey) => {
            // We skip 'id' since it's not a locale object
            if (langKey === 'id') return;

            const data = voiceGroup[langKey];
            const $voiceOption = document.createElement('div');
            if (langKey === this.lang) {
                $voiceOption.classList.add('VoiceOption', 'show');
            } else {
                $voiceOption.classList.add('VoiceOption', 'hide');
            }

            $voiceOption.setAttribute('data-lang', langKey);

            // Create the PlayButton
            const $playButton = document.createElement('button');
            $playButton.classList.add('PlayButton');
            const $playButtonImg = document.createElement('img');
            $playButtonImg.src = '/img/create/play-voice.svg';
            $playButton.appendChild($playButtonImg);

            // Toggle the audio and image upon click
            $playButton.addEventListener('click', () => {
                console.log(`[CreateViewController] PlayButton clicked for voiceGroup "${voiceGroup.id}", lang="${langKey}".`);
                $playButtonImg.src = '/img/create/playing-voice.svg';
                this.playVoice(data.url, () => {
                    $playButtonImg.src = '/img/create/play-voice.svg';
                });
            });

            $voiceOption.appendChild($playButton);

            // Voice name
            const $name = document.createElement('span');
            $name.classList.add('name');
            $name.textContent = data.name || `Unnamed(${langKey})`;
            $voiceOption.appendChild($name);

            // Categories
            if (data.categories && data.categories.length > 0) {
                const $categories = document.createElement('ul');
                $categories.classList.add('categories');
                data.categories.forEach(cat => {
                    const $li = document.createElement('li');
                    $li.classList.add('category');
                    $li.textContent = cat;
                    $categories.appendChild($li);
                });
                $voiceOption.appendChild($categories);
            }

            $voiceOptions.appendChild($voiceOption);
        });

        $voiceOptionsWrapper.appendChild($voiceOptions);

        const $localeSelectorDiv = document.createElement('div');
        $localeSelectorDiv.classList.add('locale');
        $voiceOptionsWrapper.appendChild($localeSelectorDiv);

        $voiceGroupWrapper.appendChild($voiceOptionsWrapper);

        const $buttonWrapper = document.createElement('div');
        $buttonWrapper.classList.add('buttonWrapper');

        const $selectButton = document.createElement('button');
        $selectButton.classList.add('SelectButton');

        const $selectButtonLabel = document.createElement('span');
        $selectButtonLabel.textContent = this.locale.get("create_voice_group_select_button", this.lang);

        $selectButton.addEventListener('click', () => {
            console.log(`[CreateViewController] SelectButton clicked for voiceGroup "${voiceGroup.id}".`);
            this.submitVoiceSet(voiceGroup);
        });

        $buttonWrapper.appendChild($selectButton);
        $voiceGroupWrapper.appendChild($buttonWrapper);

        $voiceGroup.appendChild($voiceGroupWrapper);
        return $voiceGroup;
    }

    // Utility function to play audio
    playVoice(url, onEnd) {
        console.log(`[CreateViewController] playVoice: url="${url}"`);
        if (!url) {
            console.warn('[CreateViewController] No URL provided to playVoice.');
            return;
        }
        const audio = new Audio(url);
        audio.play().then(() => {
            console.log('[CreateViewController] Audio playing...');
        }).catch(err => {
            console.error('[CreateViewController] Audio play failed:', err);
        });
        audio.addEventListener('ended', () => {
            console.log('[CreateViewController] Audio ended.');
            if (typeof onEnd === 'function') {
                onEnd();
            }
        });
    }

    /**
     * Submits the entire voiceset for the currently selected languages
     */
    submitVoiceSet() {
        console.log('[CreateViewController] submitVoiceSet called with voiceset:', this.voiceset);
        const endpoint = `/v1/${this.lang}/interaction_model/${this.interactionModelId}/update`;

        // Clear old message
        if (this.$message) {
            this.$message.textContent = '';
            this.$message.classList.remove('success', 'error');
        }

        const requestBody = {
            voiceset: this.voiceset
            // Add any other fields you'd like to update (title, steps, etc.)
        };

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        })
        .then(async (res) => {
            const result = await res.json();
            if (!res.ok) {
                // For 4xx or 5xx errors
                console.error('[CreateViewController] voiceset update error:', result);
                this.displayMessage(result.message || 'Update failed.', true);
                return;
            }
            // Success
            console.log('[CreateViewController] Voice set updated:', result);
            this.displayMessage(result.message || 'Voiceset update succeeded!', false);

            // Optionally move to the next page
            this.pageView.show(2);
        })
        .catch((err) => {
            console.error('[CreateViewController] fetch error:', err);
            this.displayMessage('Update failed. Network or server error.', true);
        });
    }

    /**
     * Displays messages in the DOM (success/error)
     */
    displayMessage(text, isError) {
        if (!this.$message) {
            console.warn('[CreateViewController] No $message element to display user feedback.');
            return;
        }
        this.$message.textContent = text;
        this.$message.classList.toggle('error', !!isError);
        this.$message.classList.toggle('success', !isError);
    }

    /**
     * Callback for ProgramView creation
     */
    handleInteractionModelCreated(id) {
        console.log('[CreateViewController] handleInteractionModelCreated called. ID:', id);
        // Possibly show success or move to a new route.
    }
}

