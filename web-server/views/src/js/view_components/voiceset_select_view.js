/* global LoadingMessage, LoadingMessagePattern, LoadingMessageGradient,
          VolumeMeter, ScreenLock, LoadButton, LangSelector, anime */

const VOICE_SET_CATEGORY_COLOR_PATTERNS = [
    'var(--voiceset-category-bg-blue)',
    'var(--voiceset-category-bg-green)',
    'var(--voiceset-category-bg-yellow)',
    'var(--voiceset-category-bg-red)',
    'var(--voiceset-category-bg-purple)'
];

class VoiceSetSelectView {
    constructor({
        locale,
        lang,
        interactionModelId,
        interactionModel,
        onVoiceSelected,     // Callback when user hits “Select” on a voice
        getInteractionModelId,  // Optionally let us read the current interactionModelId
        createInteractionModel, // Callbacks from the parent if we need to create
        updateInteractionModel, // ...
        submitVoiceSet,         // ...
    }) {
        this.locale = locale;
        this.lang = lang;

        this.interactionModelId = interactionModelId;
        this.interactionModel = interactionModel;

        // The parent (CreateViewController) can pass in callbacks:
        this.onVoiceSelected = onVoiceSelected;
        this.getInteractionModelId = getInteractionModelId;
        this.createInteractionModel = createInteractionModel;
        this.updateInteractionModel = updateInteractionModel;
        this.submitVoiceSet = submitVoiceSet;

        // Example: We create the loadingMessage here
        this.loadingMessage = new LoadingMessage({
            id: 'VoiceLoadingMessage',
            classList: 'hover-grad-txt',
            gradientStart: '#00ff00',
            gradientEnd: '#0000ff',
            alertColor: '#ff3333',
            pattern: LoadingMessagePattern.B
        });

        this.$view = this.createView()
    }

    createView() {
        const $container = document.createElement('div');
        $container.classList.add('VoicePageWrapper');

        // --- Title ---
        const $voicePageTitle = document.createElement('h2');
        $voicePageTitle.classList.add('VoicePageTitle');
        $voicePageTitle.textContent = this.locale.get('create_voice_page_title', this.lang);
        $container.appendChild($voicePageTitle);
        setTimeout(() => {
            $voicePageTitle.style.transform = 'translateY(0)';
            $voicePageTitle.style.opacity = '1.0';
        }, 0);

        // --- LoadingMessage ---
        const $loadingMessageWrapper = document.createElement('div');
        $loadingMessageWrapper.classList.add('LoadingMessageWrapper');
        $loadingMessageWrapper.appendChild(this.loadingMessage.$view);
        $container.appendChild($loadingMessageWrapper);

        // --- Voice Groups Scroll Wrapper ---
        const $voiceGroupListScrollWrapper = document.createElement('div');
        $voiceGroupListScrollWrapper.classList.add('VoiceGroupListScrollWrapper');
        $voiceGroupListScrollWrapper.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            $voiceGroupListScrollWrapper.scrollLeft += evt.deltaY;
        }, { passive: false });

        // The main list
        const $voiceGroupList = document.createElement('div');
        $voiceGroupList.classList.add('VoiceGroupList');
        $voiceGroupListScrollWrapper.appendChild($voiceGroupList);
        $voiceGroupList.classList.add('slideIn');
        this.$voiceGroupList = $voiceGroupList;

        // Populate the list from the voiceGroups we define (or fetch):
        const voiceGroups = this.getVoiceGroupList();
        voiceGroups.forEach((voiceGroup) => {
            const $voiceGroupDOM = this.createVoiceGroupDOM(voiceGroup);
            if (this.interactionModelId && voiceGroup.id === this.interactionModel?.voiceset?.id) {
                $voiceGroupDOM.classList.add('selected');
            }
            $voiceGroupList.appendChild($voiceGroupDOM);
        });

        $container.appendChild($voiceGroupListScrollWrapper);

        // --- Possibly a global “locale” wrapper (like your snippet) ---
        const $localeWrapper = document.createElement('div');
        $localeWrapper.classList.add('locale');
        // $localeWrapper.innerHTML = `{% include 'common/lang_selector.html' %}`; // Example
        $container.appendChild($localeWrapper);

        return $container;
    }

    openAnimation() {
        this.$voiceGroupList.classList.add('slideIn');
        setTimeout(() => {
            this.$voiceGroupList.style.transform = 'translateX(0)';
            this.$voiceGroupList.style.opacity = '1.0';
        }, 0);
    }

    /**
     * Example function that returns an array of voice groups.
     * Pulled directly from your original code, but simplified.
     */
    getVoiceGroupList() {
        const lang = this.lang;
        const japaneseCategoryLabel = this.locale.get("create_voice_category_japanese", lang);
        const englishCategoryLabel  = this.locale.get("create_voice_category_english", lang);
        const chineseCategoryLabel  = this.locale.get("create_voice_category_chinese", lang);
        const spanishCategoryLabel  = this.locale.get("create_voice_category_spanish", lang);
        const frenchCategoryLabel   = this.locale.get("create_voice_category_french", lang);
        const femaleCategoryLabel   = this.locale.get("create_voice_category_female", lang);
        const maleCategoryLabel     = this.locale.get("create_voice_category_male", lang);
        const conversationalCategoryLabel = this.locale.get("create_voice_category_conversational", lang);

        // Return as many objects as you like:
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
     * A simple hash function for distributing label colors.
     */
        hashVoicesetName(str) {
            let hashValue = 0;
            for (let i = 0; i < str.length; i++) {
                hashValue = (hashValue << 5) - hashValue + str.charCodeAt(i);
                hashValue |= 0; // convert to 32-bit integer
            }
            // Make sure it's positive and within array bounds
            return Math.abs(hashValue) % VOICE_SET_CATEGORY_COLOR_PATTERNS.length;
    }

    /**
     * Create the DOM for a single voiceGroup.
     */
    createVoiceGroupDOM(voiceGroup) {
        const $voiceGroup = document.createElement('div');
        $voiceGroup.classList.add('VoiceGroup');

        const $voiceGroupWrapper = document.createElement('div');
        $voiceGroupWrapper.classList.add('VoiceGroupWrapper');

        // VoiceGroup Name
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

        // For each language in the voiceGroup
        Object.keys(voiceGroup).forEach((langKey) => {
            if (langKey === 'id' || langKey === 'name') return; // skip
            const data = voiceGroup[langKey];
            const $voiceOption = document.createElement('div');
            if (langKey === this.lang) {
                $voiceOption.classList.add('VoiceOption', 'show');
            } else {
                $voiceOption.classList.add('VoiceOption', 'hide');
            }
            $voiceOption.setAttribute('data-lang', langKey);

            // --- Create the play button / audio logic ---
            const $playButton = this.createPlayButton(data, $voiceGroup);
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
                    const colorIndex = this.hashVoicesetName(cat);
                    $li.style.background = VOICE_SET_CATEGORY_COLOR_PATTERNS[colorIndex];
                    $categories.appendChild($li);
                });
                $voiceOption.appendChild($categories);
            }

            $voiceOptions.appendChild($voiceOption);
        });

        $voiceOptionsWrapper.appendChild($voiceOptions);

        // --- Locale selector for each group, if desired ---
        const $localeSelectorDiv = document.createElement('div');
        $localeSelectorDiv.classList.add('locale');

        const $localeSelectorTooltip = document.createElement('span');
        $localeSelectorTooltip.classList.add('tooltip');
        $localeSelectorTooltip.textContent = this.locale.get('create_voice_locale_tooltip', this.lang);
        $localeSelectorDiv.appendChild($localeSelectorTooltip);

        const langSelector = new LangSelector({
            container: $localeSelectorDiv,
            langs: { en: 'English', ja: '日本語', es: 'Español', zh: '中文', fr: 'Français' },
            currentLang: this.lang,
            iconLocalePath: '/img/create/locale-icon.svg',
            onLangChange: (newLang) => {
                this.updateVoiceOptionsForGroup($voiceOptions, newLang);
            }
        });

        $voiceOptionsWrapper.appendChild($localeSelectorDiv);
        $voiceGroupWrapper.appendChild($voiceOptionsWrapper);

        // --- “Select” button ---
        const $selectButtonWrapper = document.createElement('div');
        $selectButtonWrapper.classList.add('selectButtonWrapper');

        const selectButton = new LoadButton({
            id: `SelectButton-${voiceGroup.id}`,
            labelText: this.locale.get("create_voice_group_select_button", this.lang),
            loaderSrc: '/img/common/button-loader.svg',
            onClick: (btn) => {
                // Let the parent handle it, or do something here:
                if (typeof this.onVoiceSelected === 'function') {
                    this.onVoiceSelected(voiceGroup, btn);
                }
            },
        });
        selectButton.$view.classList.add('SelectButton', 'commonV1Small');

        $selectButtonWrapper.appendChild(selectButton.$view);
        $voiceGroupWrapper.appendChild($selectButtonWrapper);

        $voiceGroup.appendChild($voiceGroupWrapper);
        return $voiceGroup;
    }

    /**
     * Create a “Play” button with a dynamic SVG path that toggles play/pause.
     */
    createPlayButton(voiceData, $scaleElem) {
        const $playButton = document.createElement('button');
        $playButton.classList.add('PlayButton');

        const $inlineSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        $inlineSvg.setAttribute("viewBox", "0 0 60 60");
        $inlineSvg.setAttribute("width", "60");
        $inlineSvg.setAttribute("height", "60");

        const playPath  = "M44.4,31.7 l-19,10.9 c-1.3,0.8 -3,-0.2 -3,-1.7 l0,-21.9 c0,-1.5 1.7,-2.5 3,-1.7 l19,10.9 c1.4,0.8 1.4,2.8 0,3.5 z";
        const pausePath = "M39.8,41.8 l-19.5,0 c-1.1,0 -2,-0.9 -2,-2 l0,-19.5 c0,-1.1 0.9,-2 2,-2 l19.5,0 c1.1,0 2,0.9 2,2 l0,19.5 c0,1.1 -0.9,2 -2,2 z";

        const fill = "#000";// "#30688d";

        $inlineSvg.innerHTML = `
          <circle fill="#FFFFFF" cx="30" cy="30" r="28.8"/>
          <path
            id="playPausePath"
            fill="${fill}"
            d="${playPath}"
          />
        `;
        $playButton.appendChild($inlineSvg);

        const $playButtonTooltip = document.createElement('span');
        $playButtonTooltip.classList.add('tooltip');
        $playButtonTooltip.textContent = this.locale.get('create_voice_playbutton_tooltip_play', this.lang);
        $playButton.appendChild($playButtonTooltip);

        const pathEl = $inlineSvg.querySelector('#playPausePath');
        let isPlaying = false;
        let audioInstance;
        let volumeMeter;

        $playButton.addEventListener('click', () => {
            isPlaying = !isPlaying;
            anime({
                targets: pathEl,
                d: [{ value: isPlaying ? pausePath : playPath }],
                duration: 400,
                easing: 'cubicBezier(0.645, 0.045, 0.355, 1.000)'
            });

            if (isPlaying) {
                $playButtonTooltip.textContent = this.locale.get('create_voice_playbutton_tooltip_pause', this.lang);
                this.loadingMessage.setText(
                    this.locale.get('create_voice_message_playing', this.lang),
                    { gradient: LoadingMessageGradient.ocean }
                );
                audioInstance = new Audio(voiceData.url);
                volumeMeter = new VolumeMeter({
                    audioElement: audioInstance,
                    options: { minScale: 1.0, maxScale: 1.3, smoothing: 0.8 },
                    onVolumeChange: (scale) => {
                        $scaleElem.style.transform = `scale(${scale})`;
                    },
                });
                audioInstance.play().then(() => {
                    volumeMeter.start();
                }).catch(err => {
                    console.error('[VoiceSetSelect] Audio play failed:', err);
                });
                audioInstance.addEventListener('ended', () => {
                    isPlaying = false;
                    volumeMeter.stop();
                    $scaleElem.style.transform = `scale(1.0)`;
                    anime({
                        targets: pathEl,
                        d: [{ value: playPath }],
                        duration: 400,
                        easing: 'cubicBezier(0.645, 0.045, 0.355, 1.000)'
                    });
                    this.loadingMessage.stop();
                });
            } else {
                $playButtonTooltip.textContent = this.locale.get('create_voice_playbutton_tooltip_play', this.lang);
                this.loadingMessage.stop();
                if (volumeMeter) {
                    volumeMeter.stop();
                    $scaleElem.style.transform = `scale(1.0)`;
                }
                if (audioInstance) {
                    audioInstance.pause();
                    audioInstance.currentTime = 0;
                }
            }
        });

        return $playButton;
    }

    /**
     * Show/hide the correct VoiceOption element for a new language selection.
     */
    updateVoiceOptionsForGroup($voiceOptionsContainer, newLang) {
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
}