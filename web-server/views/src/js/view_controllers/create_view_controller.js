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

        document.body.classList.add('dark'); // TODO: switch
        document.body.style.overflow = 'hidden';

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

        this.pageView.show(2); // DEBUG
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

        const $voicePageTitle = document.createElement('h2');
        $voicePageTitle.classList.add('VoicePageTitle');
        $voicePageTitle.textContent = this.locale.get('create_voice_page_title', this.lang);
        $container.appendChild($voicePageTitle);
        setTimeout(()=> {
            $voicePageTitle.style.transform = 'translateY(0)';
            $voicePageTitle.style.opacity = '1.0';
        }, 0)

        // --- ADD THE LOADING MESSAGE UNDER THE TITLE ---
        const $loadingMessageWrapper = document.createElement('div');
        $loadingMessageWrapper.classList.add('LoadingMessageWrapper');
        $container.appendChild($loadingMessageWrapper);

        // Instantiate our LoadingMessage
        this.loadingMessage = new LoadingMessage({
            id: 'VoiceLoadingMessage',
            classList: 'hover-grad-txt',
            gradientStart: '#00ff00',
            gradientEnd: '#0000ff',
            alertColor: '#ff3333',
            pattern: LoadingMessagePattern.B
        });

     
        //this.loadingMessage.setText('Loading...', true, false, '#fafafa', '#aaa');
        //this.loadingMessage.setText('Data loaded successfully! All good.', true, false, '#00ff00', '#0000ff');

        $loadingMessageWrapper.appendChild(this.loadingMessage.$view);
        // -----------------------------------------------

        const $voiceGroupListScrollWrapper = document.createElement('div');
        $voiceGroupListScrollWrapper.classList.add('VoiceGroupListScrollWrapper');

        $voiceGroupListScrollWrapper.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            $voiceGroupListScrollWrapper.scrollLeft += evt.deltaY;
        }, { passive: false });

        // We’ll build a sample VoiceGroupList. 
        // Example voice data—replace or extend as needed:
        const voiceGroups = this.getVoiceGroupList();

        // The main wrapper for the voice group list
        const $voiceGroupList = document.createElement('div');
        $voiceGroupList.classList.add('VoiceGroupList');
        $voiceGroupListScrollWrapper.appendChild($voiceGroupList);

        voiceGroups.forEach((voiceGroup) => {
            const $voiceGroupWrapper = this.createVoiceGroupDOM(voiceGroup);
            $voiceGroupList.appendChild($voiceGroupWrapper);
        });

        $voiceGroupList.classList.add('slideIn')
        setTimeout(()=> {
            $voiceGroupList.style.transform = 'translateX(0)';
            $voiceGroupList.style.opacity = '1.0';
        }, 0)

        // Language selector (as in your snippet)
        // Typically, you might do an include of `lang_selector.html`,
        // but for demonstration, we’ll just create a container
        const $localeWrapper = document.createElement('div');
        $localeWrapper.classList.add('locale');
        // For actual usage, you might do server-side injection or simply:
        // $localeWrapper.innerHTML = `{% include 'common/lang_selector.html' %}`;

        $container.appendChild($voiceGroupListScrollWrapper);
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
        const englishCategoryLabel  = this.locale.get("create_voice_category_english", lang);
        const chineseCategoryLabel  = this.locale.get("create_voice_category_chinese", lang);
        const spanishCategoryLabel  = this.locale.get("create_voice_category_spanish", lang);
        const frenchCategoryLabel   = this.locale.get("create_voice_category_french", lang);
        const femaleCategoryLabel   = this.locale.get("create_voice_category_female", lang);
        const maleCategoryLabel     = this.locale.get("create_voice_category_male", lang);
        const conversationalCategoryLabel   = this.locale.get("create_voice_category_conversational", lang);

        return [
            {
                "id": "fo",
                "name": "Fo",
                "ja": {
                    "name": "fo-JA",
                    "url": "/audio/voice_set_samples/fo-JA.wav",
                    "categories": [
                        japaneseCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                "en": {
                    "name": "fo-EN",
                    "url": "/audio/voice_set_samples/fo-EN.wav",
                    "categories": [
                        englishCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                es: {
                    name: "fo-ES",
                    url: "/audio/voice_set_samples/fo-ES.wav",
                    categories: [
                        spanishCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                zh: {
                    name: "fo-ZH",
                    url: "/audio/voice_set_samples/fo-ZH.wav",
                    categories: [
                        chineseCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                fr: {
                    name: "fo-FR",
                    url: "/audio/voice_set_samples/fo-FR.wav",
                    categories: [
                        frenchCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                }
            },
            {
                "id": "f1",
                "name": "F1",
                "ja": {
                    "name": "f1-JA",
                    "url": "/audio/voice_set_samples/f1-JA.wav",
                    "categories": [
                        japaneseCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                "en": {
                    "name": "fo-EN",
                    "url": "/audio/voice_set_samples/fo-EN.wav",
                    "categories": [
                        englishCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                es: {
                    name: "f1-ES",
                    url: "/audio/voice_set_samples/f1-ES.wav",
                    categories: [
                        spanishCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                zh: {
                    name: "f1-ZH",
                    url: "/audio/voice_set_samples/f1-ZH.wav",
                    categories: [
                        chineseCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                fr: {
                    name: "f1-FR",
                    url: "/audio/voice_set_samples/f1-FR.wav",
                    categories: [
                        frenchCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                }
            },
            {
                "id": "f2",
                "name": "F2",
                "ja": {
                    "name": "f1-JA",
                    "url": "/audio/voice_set_samples/f1-JA.wav",
                    "categories": [
                        japaneseCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                "en": {
                    "name": "fo-EN",
                    "url": "/audio/voice_set_samples/fo-EN.wav",
                    "categories": [
                        englishCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                es: {
                    name: "f1-ES",
                    url: "/audio/voice_set_samples/f1-ES.wav",
                    categories: [
                        spanishCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                zh: {
                    name: "f1-ZH",
                    url: "/audio/voice_set_samples/f1-ZH.wav",
                    categories: [
                        chineseCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
                    ]
                },
                fr: {
                    name: "f1-FR",
                    url: "/audio/voice_set_samples/f1-FR.wav",
                    categories: [
                        frenchCategoryLabel,
                        femaleCategoryLabel,
                        conversationalCategoryLabel
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

        const $voiceGroupName = document.createElement('label');
        $voiceGroupName.textContent = voiceGroup.name;
        $voiceGroupName.classList.add('VoiceGroupName');
        $voiceGroupWrapper.appendChild($voiceGroupName);

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
            const $inlineSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            $inlineSvg.setAttribute("viewBox", "0 0 60 60");
            $inlineSvg.setAttribute("width", "60");
            $inlineSvg.setAttribute("height", "60");
            const playPath = "M44.4,31.7 l-19,10.9 c-1.3,0.8 -3,-0.2 -3,-1.7 l0,-21.9 c0,-1.5 1.7,-2.5 3,-1.7 l19,10.9 c1.4,0.8 1.4,2.8 0,3.5 l0,0 c0,0 0,0 0,0 z";
            const pausePath = "M39.8,41.8 l-19.5,0 c-1.1,0 -2,-0.9 -2,-2 l0,-19.5 c0,-1.1 0.9,-2 2,-2 l19.5,0 c1.1,0 2,0.9 2,2 l0,19.5 c0,1.1 -0.9,2 -2,2 z";
            const playIconColor = "#30688d";// "#2f9aed"; //"#32677A"
            $inlineSvg.innerHTML = `
              <circle fill="#FFFFFF" cx="30" cy="30" r="28.8"/>
              <path
                id="playPausePath"
                fill="${playIconColor}"
                d="${playPath}"
              />
            `;
            $playButton.appendChild($inlineSvg);
            const $playButtonTooltip = document.createElement('span');
            $playButtonTooltip.classList.add('tooltip');
            $playButtonTooltip.textContent = this.locale.get('create_voice_playbutton_tooltip_play', this.lang);
            $playButton.appendChild($playButtonTooltip);

            const pathEl = $playButton.querySelector('#playPausePath'); // or another method
            let isPlaying = false;

            $playButton.addEventListener('click', () => {
                isPlaying = !isPlaying;
            
                console.log('Animate the SVG path', pathEl);
                $playButtonTooltip.textContent = this.locale.get('create_voice_playbutton_tooltip_play', this.lang);
                anime({
                    targets: pathEl,
                    d: [{ value: isPlaying ? pausePath : playPath }],
                    duration: 400,
                    easing: 'cubicBezier(0.645, 0.045, 0.355, 1.000)'
                });
                this.loadingMessage.setText(this.locale.get('create_voice_message_playing', this.lang), {gradient: LoadingMessageGradient.ocean});
          
                const audio = new Audio(data.url);
                const $scaleElem = $voiceGroup;

                if (isPlaying) {
                    // 1) Create or reuse the Audio if you want to keep it around
                    console.log('audio load from url', data.url);
                    //const circleEl = $playButton.querySelector('circle');
                    // 2) Create a VolumeMeter (or reuse a stored instance).
                    this.volumeMeter = new VolumeMeter({
                        audioElement: audio,
                        options: {
                            minScale: 1.0,
                            maxScale: 1.3,
                            smoothing: 0.8,
                        },
                        onVolumeChange: (scale) => {
                            // Use transform to scale the circle in real time
                            //circleEl.style.transformOrigin = 'center center';
                            //circleEl.style.transform = `scale(${scale})`;
                            $scaleElem.style.transformOrigin = 'center center';
                            $scaleElem.style.transform = `scale(${scale})`;
                            
                        },
                    });
                    // 3) Start playback, then start measuring volume
                    audio.play()
                    .then(() => {
                        console.log('[CreateViewController] Audio started. Starting volume meter...');
                        this.volumeMeter.start();
                    })
                    .catch(err => {
                        console.error('[CreateViewController] Audio play failed:', err);
                    })
                    .finally(()=> {
                    });
                    // 4) Stop the volume meter if the audio ends
                    audio.addEventListener('ended', () => {
                        console.log('[CreateViewController] Audio ended.');
                        isPlaying = false;
                        $playButtonTooltip.textContent = this.locale.get('create_voice_playbutton_tooltip_pause', this.lang);
                        this.loadingMessage.stop();
                        anime({
                            targets: pathEl,
                            d: [{ value: playPath }],
                            duration: 400,
                            easing: 'cubicBezier(0.645, 0.045, 0.355, 1.000)'
                        });

                        this.volumeMeter.stop();
                        $scaleElem.style.transform = `scale(1.0)`;
                    });
                    //this.playVoice(data.url, () => {
                    //    // When the audio ends, revert the path?
                    //    isPlaying = false;
                    //    $playButtonTooltip.textContent = this.locale.get('create_voice_playbutton_tooltip_pause', this.lang);
                    //    anime({
                    //        targets: pathEl,
                    //        d: [{ value: playPath }],
                    //        duration: 400,
                    //        easing: 'cubicBezier(0.645, 0.045, 0.355, 1.000)'
                    //    });
                    //});
                } else {
                    if (this.volumeMeter) {
                        this.volumeMeter.stop();
                        $scaleElem.style.transform = `scale(1.0)`;
                    }
                    if (audio) {
                        audio.stop();
                    }
                }
            });
            //// Toggle the audio and image upon click
            //$playButton.addEventListener('click', () => {
            //    console.log(`[CreateViewController] PlayButton clicked for voiceGroup "${voiceGroup.id}", lang="${langKey}".`);
            //    $playButtonImg.src = '/img/create/playing-voice.svg';
            //    this.playVoice(data.url, () => {
            //        $playButtonImg.src = '/img/create/play-voice.svg';
            //    });
            //});

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

    // ---- Create a 'locale' div just for this voice group
    const $localeSelectorDiv = document.createElement('div');
    $localeSelectorDiv.classList.add('locale');

    const $localeSelectorTooltip = document.createElement('span');
    $localeSelectorTooltip.classList.add('tooltip');
    $localeSelectorTooltip.textContent = this.locale.get('create_voice_locale_tooltip', this.lang);
    $localeSelectorDiv.appendChild($localeSelectorTooltip);

    // Here’s the key part: each voice group gets its own LangSelector instance
    const langSelector = new LangSelector({
        container: $localeSelectorDiv,
        langs: {
            en: 'English',
            ja: '日本語',
            es: 'Español',
            zh: '中文',
            fr: 'Français'
        },
        currentLang: this.lang,  // or you can store a separate per-group default
        onLangChange: (newLang) => {
            // Only update .VoiceOption within *this* voiceGroup
            this.updateVoiceOptionsForGroup($voiceOptions, newLang);
        }
    });
    // Optionally store on the instance if you need to reference later:
    // voiceGroup._langSelector = langSelector;

    $voiceOptionsWrapper.appendChild($localeSelectorDiv);

        $voiceGroupWrapper.appendChild($voiceOptionsWrapper);

        const $buttonWrapper = document.createElement('div');
        $buttonWrapper.classList.add('buttonWrapper');

        const selectButton = new LoadButton({
            id: `SelectButton-${voiceGroup.id}`,
            labelText: this.locale.get("create_voice_group_select_button", this.lang),
            loaderSrc: '/img/common/button-loader.svg',
            onClick: (btn, id) => {
                console.log(`[CreateViewController] SelectButton clicked for voiceGroup "${voiceGroup.id}".`);
                this.onSelectButtonClicked(voiceGroup, btn);
            },
        });
        selectButton.$view.classList.add('SelectButton')
        selectButton.$view.classList.add('commonV1Small')

        $buttonWrapper.appendChild(selectButton.$view);
        $voiceGroupWrapper.appendChild($buttonWrapper);

        $voiceGroup.appendChild($voiceGroupWrapper);
        return $voiceGroup;
    }

    updateVoiceOptionsForGroup($voiceOptionsContainer, newLang) {
        // Find each .VoiceOption inside $voiceOptionsContainer
        const options = $voiceOptionsContainer.querySelectorAll('.VoiceOption');
        options.forEach(option => {
            const langKey = option.getAttribute('data-lang');
            if (langKey === newLang) {
                option.classList.add('show');
                option.classList.remove('hide');
            } else {
                option.classList.remove('show');
                option.classList.add('hide');
            }
        });
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

    onSelectButtonClicked(voiceGroup, loadButton) {
        // 1. Lock the screen
        ScreenLock.lock();

        loadButton.load(true);
        this.loadingMessage.setText(this.locale.get('create_processing', this.lang), {gradient: LoadingMessageGradient.ocean});

        this.voiceset = voiceGroup;

        // 4. Check if we already have an ID:
        if (this.interactionModelId) {
            // --- CASE: Interaction Model already exists => just do an update. ---
            console.log('[CreateViewController] Updating existing interaction model:', this.interactionModelId);
            this.loadingMessage.setText(this.locale.get('create_creating_new_interaction_model', this.lang), {gradient: LoadingMessageGradient.ocean});
 
            this.updateInteractionModel()
                .then(() => {
                    // After update, we can optionally call submitVoiceSet (which is also an update)
                    return this.submitVoiceSet();
                })
                .then(() => {
                    // Done => stop loading & go next
                    loadButton.load(false);
                    setTimeout(() => {
                        this.pageView.show(2);
                    }, 2000)
                })
                .catch((err) => {
                    console.error('[CreateViewController] Error in update:', err);
                    this.loadingMessage.setText(`${err.message || err}`, {alert: true});
                    loadButton.load(false);
                }).finally(()=> {
                    ScreenLock.lock(false);
                });
        } else {
            // --- CASE: No interactionModelId => we must create first, then update. ---
            console.log('[CreateViewController] Creating new interaction model...');
            this.loadingMessage.setText(this.locale.get('create_updating_interaction_model', this.lang), {gradient: LoadingMessageGradient.ocean});
            setTimeout(() => {
                this.createInteractionModel()
                    .then((newId) => {
                        // We have a newly created ID
                        this.interactionModelId = newId;
                        return this.submitVoiceSet(); 
                    })
                    .then(() => {
                        // (Per instructions, possibly call submitVoiceSet again)
                        return this.submitVoiceSet();
                    })
                    .then(() => {
                        // Finally, stop loading, go next
                        loadButton.load(false);
                        setTimeout(() => {
                            this.pageView.show(2);
                        }, 2000)
                    })
                    .catch((err) => {
                        console.error('[CreateViewController] Error in create+submit:', err);
                        this.loadingMessage.setText(`${err.message || err}`, {alert: true});
                        loadButton.load(false);
                    })
                    .finally(()=> {
                        ScreenLock.lock(false);
                    });
            }, 2000);
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
        if (!res.ok) {
            this.loadingMessage.setText(result.message, {alert: true})
            throw new Error(result.message || 'Create failed.');
        }
        // Show success
        this.loadingMessage.setText(result.message || 'Create succeeded!', {gradient: LoadingMessageGradient.bluegreen});
        this.loadingMessage.setError(false);

        // Suppose the backend returns { id: 'xxx', message: '...' }
        return result.id; 
    }

    async updateInteractionModel() {
        const endpoint = `/v1/${this.lang}/interaction_model/${this.interactionModelId}/update`;
        const body = { voiceset: this.voiceset };
        console.log('[CreateViewController] PATCH =>', endpoint, body);

        const res = await fetch(endpoint, {
            method: 'PATCH',  // or POST if your update is a POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        if (!res.ok) {
            this.loadingMessage.setText(result.message, {alert: true});
            throw new Error(result.message || 'Update failed.');
        }
        // Show success
        this.loadingMessage.setText(result.message, {gradient: LoadingMessageGradient.ocean});
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
                this.loadingMessage.setText(result.message, {alert: true});
                throw new Error(result.message || 'Update failed.');
            }
            console.log('[CreateViewController] Voice set updated:', result);
            this.loadingMessage.setText(result.message, {gradient: LoadingMessageGradient.bluegreen});

            // Possibly go to next page automatically, or not:
            // this.pageView.show(2);
        })
        .catch((err) => {
            console.error('[CreateViewController] submitVoiceSet error:', err);
            this.loadingMessage.setText(`${err.message || 'Submit voiceset failed.'}`, {alert: true});
            throw err;
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

