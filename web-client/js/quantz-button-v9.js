(function(ns) {
    ns.DefaultConfig = {
        host: 'quantz.thinkxinc.com',
        sampleRate: 44100,//24000,
        decodeSampleRate: 24000,
        prefix: 'QBTN-',
        buttonId: '',
        buttonElementId: '',
        buttonElementClassName: 'button',
        buttonLoaderClassName: 'button-loader',
        buttonContainerId: '',
        buttonContainerClassName: 'button-container',
        buttonControlId: '',
        signClassName: 'sign',
        buttonTextContainerId: '',
        buttonTextContainerClassName: 'button-text-container',
        buttonTextClassName: 'button-text',
        defaultButtonTextContent: 'Connecting...',
        indicatorClassName: 'indicator',
        indicatorDiameterRate: 0.8,
        iconSizeScaleFactor: 44/144,
        glowLightId: '',
        iconWrapperClassName: 'icon-wrapper',
        defaultIconImgSrc: 'https://quantz.thinkxinc.com/img/quantz_button/standby-icon-white.svg',
        iconImageClassName: 'button-icon',
        spacerClassName: 'spacer',
        balloonId: '',
        balloonDialogueId: '',
        balloonPowerdByImageSrc: 'https://quantz.thinkxinc.com/img/quantz_button/powerdby.svg',
        balloonLegImgSrc: 'https://quantz.thinkxinc.com/img/quantz_button/balloonleg.png',
        balloonLegImgSrcset: 'https://quantz.thinkxinc.com/img/quantz_button/balloonleg@2x.png 2x',
        localeIconSrc: 'https://quantz.thinkxinc.com/img/quantz_button/locale-icon.svg',
        arrowDownIconSrc: 'https://quantz.thinkxinc.com/img/quantz_button/arrow-down.svg',
        N: 32, // Number of lines
        dialLength: 6, // Length of each dial
        dialSpectrumAnimationScaleFactor: 6,  // smaller is longer
        dialColorUp: '#2F7A7C',//'#334d4e',//'#2F7A7C', // dial color
        dialColorConnected: '#01a7ac',
        dialColorReplyStart: '#78acad',//'#334d4e',//'#2F7A7C', // dial color
        dialColorListening: '#205354',//'#334d4e',//'#2F7A7C', // dial color
        dialColorSpeaking: '#71f1f4',//'#2F7A7C', //'#a7ae54',//'#2F7A7C',//'#37afe8',//#2F7A7C',
        dialThickness: '1.4px', // dial thickness
        dialThicknessConnected: '2px', // dial thickness
        dialThicknessSpeaking: '5px', // dial thickness
        animationDuration: 0.3,
        animationDelay: 0,
        animationCurve: 'cubic-bezier(.65,0,.34,1)',
        spectrumFrequencyMs: 50,
        languages: [
            new ns.Language("English", ns.LanguageCode.en, true),
            new ns.Language("日本語", ns.LanguageCode.ja, true),
            new ns.Language("Español", ns.LanguageCode.es, true),
            new ns.Language("Français", ns.LanguageCode.fr, true),
            new ns.Language("中文", ns.LanguageCode.zh, true),
            new ns.Language("Русский", ns.LanguageCode.ru, false),
            new ns.Language("العربية", ns.LanguageCode.ar, false)
        ],
        tokenIssuedEventName: 'quantz-tokenIssued',
        failedToGetTokenEventName: 'quantz-failedToGetToken',
        basicConfigFetchedEventName: 'quantz-basicConfigFetched',
        failedToGetBasicConfigEventName: 'quantz-failedToGetBasicConfig',
        didClickStartEventName: 'quantz-didClickStart',
        didClickRestartEventName: 'quantz-didClickRestart',
        messageReceiveEventName: 'quantz-messageReceived',
        assistantResponseStartEventName: 'quantz-assistantStartResponse',
        assistantStartPlayingAudioBufferEventName: 'quantz-assistantStartPlayingAudioBuffer',
        assistantAudioSignalEventName: 'quantz-assistantAudioSignal',
        assistantEndAudioSignalEventName: 'quantz-assistantEndAudioSignal',
        assistantEndTurnEventName: 'quantz-assistantEndTurn',
        assistantSkipTurnEventName: 'quantz-assistantSkipTurn',
        assistantSpeechEnforcedStopEventName: 'quantz-assistantSpeechEnforcedStop',
        humanAudioSignalEventName: 'quantz-humanAudioSignal',
        humanStartSpeakingEventName: 'quantz-humanStartSpeaking',
        humanStopSpeakingEventName: 'quantz-humanStopSpeaking',
        humanStopRecordingEventName: 'quantz-humanStopRecording',
        signalDataUpdatedEventName: 'quantz-signalDataUpdated',
        conversationDataUpdatedEventName: 'quantz-conversationDataUpdated',
        reachToLimitEventName: 'quantz-reachToLimit',
        closeMessageReceivedEventName: 'quantz-closeMessageReceived',
        lastSpeechFinishedEventName: 'quantz-lastSpeechFinished',
        connectionClosedCleanlyEventName: 'quantz-connectionClosedCleanly',
        didClickLeaveButtonEventName: 'quantz-didClickLeaveButton',
        languageChangeEventName: 'quantz-languageChange',
        autoInteraction: true,
        enableRestart: true,
    };

    ns.configs = {};

    ns.indicatorControllers = {};
    ns.buttonControllers = {};
    ns.interactionControllers = {};
    ns.locales = {};
    ns.balloons = {};
    ns.signs = {};
    ns.cores = {};

    ns.isConversationEnd = false;

    ns.setupIndicator = function({buttonId, button, buttonWidth}) {
        const indicator = button.querySelector(`.${ns.configs[buttonId].prefix}indicator`);
        const icon = button.querySelector(`.${ns.configs[buttonId].prefix}button-icon`);
        const diameter = parseFloat(buttonWidth) * ns.configs[buttonId].indicatorDiameterRate; // Diameter is 80% of the button size
        const radius = diameter / 2;
        const centerX = parseFloat(buttonWidth) / 2;
        const centerY = parseFloat(buttonWidth) / 2;

        // Scale the icon size relative to the button size (assumed 50px is for 144px button size)
        //const iconSize = (buttonWidth / 144) * 50; // Scaling factor for the icon
        const iconSize = buttonWidth * ns.configs[buttonId].iconSizeScaleFactor;
        icon.style.width = `${iconSize}px`;
        icon.style.height = `${iconSize}px`;

        for (let i = 0; i < ns.configs[buttonId].N; i++) {
            let dial = document.createElement('div');
            dial.className = `${ns.configs[buttonId].prefix}dial ${ns.configs[buttonId].prefix}dial_${i}`;
            dial.style.position = 'absolute';
            dial.style.width = `${ns.configs[buttonId].dialLength}px`;
            dial.style.height = ns.configs[buttonId].dialThickness;
            dial.style.backgroundColor = ns.configs[buttonId].dialColorUp;
            dial.style.borderRadius = '1px';

            const angle = (i / ns.configs[buttonId].N) * 2 * Math.PI - Math.PI / 2;
            const dialX = centerX + radius * Math.cos(angle) - (ns.configs[buttonId].dialLength / 2);
            const dialY = centerY + radius * Math.sin(angle) - (parseFloat(ns.configs[buttonId].dialThickness) / 2);

            dial.style.left = `${dialX}px`;
            dial.style.top = `${dialY}px`;
            dial.style.transform = `rotate(${i * (360 / ns.configs[buttonId].N) + 90}deg)`;
            dial.style.transformOrigin = `${ns.configs[buttonId].dialLength / 2}px 1px`;

            indicator.appendChild(dial);
        }

        // Now that all dials are created and added to the DOM, instantiate the IndicatorController
        ns.indicatorControllers[buttonId] = new ns.IndicatorController({buttonId: buttonId, indicatorElement: indicator});

    }

    ns.loadCSS = function({cssPath, callback}) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath
        link.onload = () => callback();
        document.head.appendChild(link);
    }

    ns.setupConfig = function({buttonId, config}) {
        console.log(`Setting up config for buttonId: ${buttonId}`);

        // Copy all key-value pairs from ns.DefaultConfig as a baseline
        ns.configs[buttonId] = {...ns.DefaultConfig};

        // Override with specific settings from config parameter
        ns.configs[buttonId].buttonId = buttonId;
        ns.configs[buttonId].buttonType = config.buttonType;
        ns.configs[buttonId].buttonWidth = config.buttonWidth;
        ns.configs[buttonId].buttonHeight = config.buttonHeight;
        ns.configs[buttonId].buttonColor = config.buttonColor;
        ns.configs[buttonId].iconSize = config.iconSize;
        ns.configs[buttonId].fontSize = config.fontSize;
        ns.configs[buttonId].borderRadius = config.borderRadius;
        ns.configs[buttonId].displayLocale = config.displayLocale;
        ns.configs[buttonId].balloonRectWidth = config.balloonRectWidth;
        ns.configs[buttonId].balloonRectHeight = config.balloonRectHeight;
        ns.configs[buttonId].defaultLang = config.defaultLang;
        ns.configs[buttonId].lang = config.defaultLang;
        ns.configs[buttonId].responseMode = config.responseMode;
        ns.configs[buttonId].buttonElementId = `${ns.configs[buttonId].prefix}button-${buttonId}`;
        ns.configs[buttonId].buttonContainerId = `${ns.configs[buttonId].prefix}button-container-${buttonId}`;
        ns.configs[buttonId].buttonTextContainerId = `${ns.configs[buttonId].prefix}button-text-container-${buttonId}`;
        ns.configs[buttonId].buttonControlId = `${ns.configs[buttonId].prefix}button-control-${buttonId}`;
        ns.configs[buttonId].balloonId = `${ns.configs[buttonId].prefix}balloon-${buttonId}`;
        ns.configs[buttonId].balloonDialogueId = `${ns.configs[buttonId].prefix}dialogue-${buttonId}`;
        ns.configs[buttonId].glowLightId = `${ns.configs[buttonId].prefix}glowlight-${buttonId}`;

        console.log(`${buttonId} config is set as:`, ns.configs[buttonId]);
    }

    ns.createDOMElements = function({buttonId, config, loaderDiv}) {
        while (loaderDiv.firstChild) {
            loaderDiv.removeChild(loaderDiv.firstChild);
        }

        loaderDiv.id = `${ns.configs[buttonId].prefix}button-loader-${buttonId}`;
        loaderDiv.setAttribute("data-button-id", buttonId)

        const buttonContainer = document.createElement('div');
        buttonContainer.id = ns.configs[buttonId].buttonContainerId;
        buttonContainer.className = `${ns.configs[buttonId].prefix}${ns.configs[buttonId].buttonContainerClassName}`;
        loaderDiv.appendChild(buttonContainer);

        if (config.buttonType === ns.ButtonType.A) {
            buttonContainer.classList.add('QBTN-TYPE-A');

            // Create button
            const button = document.createElement('button');
            button.id = ns.configs[buttonId].buttonElementId;
            button.classList.add(ns.configs[buttonId].prefix + ns.configs[buttonId].buttonElementClassName);
            ns.insertIndicator({container: button, buttonId: buttonId});
            ns.insertGlowlight({container: button, buttonId: buttonId});
            ns.insertIconWrapper({container: button, buttonId: buttonId});
            buttonContainer.appendChild(button);

            // Create button control
            const buttonControl = document.createElement('div');
            buttonControl.id = ns.configs[buttonId].buttonControlId;
            buttonControl.classList.add(ns.configs[buttonId].prefix + 'button-control');
            ns.insertSpacer({container: buttonControl, buttonId: buttonId});
            ns.insertButtonTextContainer({container: buttonControl, buttonId: buttonId});
            buttonContainer.appendChild(buttonControl);
        }

        if (config.buttonType === ns.ButtonType.B) {
            buttonContainer.classList.add('QBTN-TYPE-B');

            // Create button
            const button = document.createElement('button');
            button.id = ns.configs[buttonId].buttonElementId;
            button.classList.add(ns.configs[buttonId].prefix + ns.configs[buttonId].buttonElementClassName);
            ns.insertButtonTextContainer({container: button, buttonId: buttonId});
            ns.insertIconWrapper({container: button, buttonId: buttonId});
            buttonContainer.appendChild(button);

            // Create button control
            const buttonControl = document.createElement('div');
            buttonControl.id = ns.configs[buttonId].buttonControlId;
            buttonControl.classList.add(ns.configs[buttonId].prefix + 'button-control');
            ns.insertSpacer({container: buttonControl, buttonId: buttonId});
            buttonContainer.appendChild(buttonControl);
        }

        if (config.buttonType === ns.ButtonType.C) {
            buttonContainer.classList.add('QBTN-TYPE-C');

            const button = document.createElement('button');
            button.id = ns.configs[buttonId].buttonElementId;
            button.classList.add(ns.configs[buttonId].prefix + ns.configs[buttonId].buttonElementClassName);
            ns.insertButtonTextContainer({container: button, buttonId: buttonId});
            ns.insertIconWrapper({container: button, buttonId: buttonId});
            buttonContainer.appendChild(button);

            // Create button control
            const buttonControl = document.createElement('div');
            buttonControl.id = ns.configs[buttonId].buttonControlId;
            buttonControl.classList.add(ns.configs[buttonId].prefix + 'button-control');
            ns.insertSpacer({container: buttonControl, buttonId: buttonId});
            buttonContainer.appendChild(buttonControl);
        }

        // Initialize components after ensuring CSS is loaded
        ns.locales[buttonId] = new ns.Locale({
            buttonId: buttonId,
            containerId: ns.configs[buttonId].buttonControlId,
            closeAreaId: loaderDiv.id,
            languages: ns.configs[buttonId].languages,
            defaultLang: ns.configs[buttonId].defaultLang})
        ns.balloons[buttonId] = new ns.Balloon({
            buttonId: buttonId,
            containerId: loaderDiv.id,
            defaultLang: ns.configs[buttonId].defaultLang,
            buttonType: config.buttonType});

        // Apply dynamic styles after creating the button
        ns.applyDynamicStyles({buttonId: buttonId, config: config});
    }

    ns.insertIndicator = function({container, buttonId}) {
        const indicator = document.createElement('div');
        indicator.className = ns.configs[buttonId].prefix + ns.configs[buttonId].indicatorClassName;
        container.appendChild(indicator);
        return indicator;
    }

    ns.insertGlowlight = function({container, buttonId}) {
        const svgHTML = `
            <svg id="${ns.configs[buttonId].glowLightId}" class="${ns.configs[buttonId].prefix}glowlight" width="144px" height="144px" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradient1" gradientUnits="objectBoundingBox" x1="1" y1="0.5" x2="0" y2="0.5">
                        <stop offset="0%" stop-color="#33D6BB" />
                        <stop offset="34%" stop-color="#33D6BB" />
                        <stop offset="67%" stop-color="#316480" stop-opacity="1" />
                        <stop offset="100%" stop-color="#316480" stop-opacity="0" />
                    </linearGradient>
                    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                    </filter>
                </defs>
                <g filter="url(#blur)">
                    <path d="M 12,72 A 60,60 0 0 1 132,72" stroke="url(#gradient1)" stroke-width="8" fill="none" stroke-linecap="round"/>
                </g>
            </svg>`;

        container.insertAdjacentHTML('afterbegin', svgHTML);
    }

    ns.insertIconWrapper = function({container, buttonId}) {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = ns.configs[buttonId].prefix + ns.configs[buttonId].iconWrapperClassName;
        const iconImage = document.createElement('img');
        iconImage.src = ns.configs[buttonId].defaultIconImgSrc;
        iconImage.className = ns.configs[buttonId].prefix + ns.configs[buttonId].iconImageClassName;
        iconImage.alt = 'Button Icon';
        iconWrapper.appendChild(iconImage);
        container.appendChild(iconWrapper);

        return iconWrapper;
    }

    ns.insertButtonTextContainer = function({container, buttonId}) {
        const buttonTextContainer = document.createElement('div');
        buttonTextContainer.id = ns.configs[buttonId].buttonTextContainerId;
        buttonTextContainer.className = ns.configs[buttonId].prefix + ns.configs[buttonId].buttonTextContainerClassName;
        const buttonText = document.createElement('div');
        buttonText.className = ns.configs[buttonId].prefix + ns.configs[buttonId].buttonTextClassName;
        buttonText.textContent = ns.configs[buttonId].prefix.defaultButtonTextContent;
        buttonTextContainer.appendChild(buttonText);
        container.appendChild(buttonTextContainer);

        return buttonTextContainer;
    }

    ns.insertSpacer = function({container, buttonId}) {
        const spacer = document.createElement('div');
        spacer.className = ns.configs[buttonId].prefix + ns.configs[buttonId].spacerClassName;
        container.appendChild(spacer);

        return spacer;
    }

    ns.applyDynamicStyles = function({buttonId, config}) {
        const button = document.getElementById(ns.configs[buttonId].buttonElementId);
        if (!button) {
            console.error(`Button element not found by ID: ${ns.configs[buttonId].buttonElementId}`);
            return;
        }
        const computedStyle = window.getComputedStyle(button);
        ns.configs[buttonId].buttonWidth = ns.configs[buttonId].buttonWidth ? ns.configs[buttonId].buttonWidth : parseInt(computedStyle.width, 10);
        console.log(`Computed button width: ${ns.configs[buttonId].buttonWidth}`);

        // Customize size and styles based on extracted configurations
        if (ns.configs[buttonId].buttonType == ns.ButtonType.A) {
            button.style.width = `${ns.configs[buttonId].buttonWidth}px`;
            button.style.height = `${ns.configs[buttonId].buttonWidth}px`;
            ns.setupIndicator({buttonId: buttonId, button: button, buttonWidth: ns.configs[buttonId].buttonWidth});
        }

        // Customize size
        const styleGenerator = new ns.StyleGenerator({buttonId: buttonId, buttonType: ns.configs[buttonId].buttonType});
        if (ns.configs[buttonId].buttonType == ns.ButtonType.B || ns.configs[buttonId].buttonType == ns.ButtonType.C) {
            styleGenerator.generate({
                iconSize: ns.configs[buttonId].iconSize,
                fontSize: ns.configs[buttonId].fontSize,
                buttonWidth: ns.configs[buttonId].buttonWidth,
                buttonHeight: ns.configs[buttonId].buttonHeight,
                buttonColor: ns.configs[buttonId].buttonColor,
                borderRadius: ns.configs[buttonId].borderRadius,
                displayLocale: ns.configs[buttonId].displayLocale,
                balloonRectWidth: ns.configs[buttonId].balloonRectWidth,
                balloonRectHeight: ns.configs[buttonId].balloonRectHeight
            });
        }
        if (ns.configs[buttonId].buttonType == ns.ButtonType.A) {
            styleGenerator.generate({
                // buttonWidth has already been applied
                buttonWidth: ns.configs[buttonId].buttonWidth,
                buttonHeight: ns.configs[buttonId].buttonHeight,
                fontSize: ns.configs[buttonId].fontSize,
                displayLocale: ns.configs[buttonId].displayLocale,
                balloonRectWidth: ns.configs[buttonId].balloonRectWidth,
                balloonRectHeight: ns.configs[buttonId].balloonRectHeight
            })
        }
    }

    ns.setup = function() {
        console.log('[Quantz Button] start mutation observer')

        const observer = new MutationObserver(function(mutations) {
            console.log('[Quantz Button] Mutation observed with changes');
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    console.log(`[Quantz Button] ${mutation.addedNodes.length} nodes added.`);
                    mutation.addedNodes.forEach(node => processNode(node));
                }
            });
        });

        // Recursive function to process each node and its children
        function processNode(node) {
            if (node.nodeType === 1) {  // Check if it's an element node
                //console.log(`[Quantz Button] Node added with class: ${node.className} and id: ${node.id}`);
                if (node.matches(`.${ns.DefaultConfig.prefix}${ns.DefaultConfig.buttonLoaderClassName}`)) {
                    console.log(`[Quantz Button] Node added with class: ${node.className} and id: ${node.id}. And node matchs button loader class.`);
                    console.log('[Quantz Button] Matching button loader node found');
                    ns.initializeButton({$buttonLoader: node});
                } else {
                    //console.log('[Quantz Button] Added node did not match expected selector');
                    // Recursively check child nodes
                    node.querySelectorAll(`.${ns.DefaultConfig.prefix}${ns.DefaultConfig.buttonLoaderClassName}`).forEach(innerNode => {
                        console.log(`[Quantz Button] Found matching node ${innerNode.className} inside added parent ${node.className}`);
                        ns.initializeButton({$buttonLoader: innerNode});
                    });
                }
            }
        }

        // Start observing the body for added elements.
        observer.observe(document.body, { childList: true, subtree: true });

        // Ensure setup is idempotent if elements already exist on page load
        const loaderDivs = document.querySelectorAll(`.${ns.DefaultConfig.prefix}${ns.DefaultConfig.buttonLoaderClassName}`);
        loaderDivs.forEach(buttonLoaderElement => {
            console.log(`[Quantz Button] Found ${loaderDivs.length} existing loader elements.`);
            ns.initializeButton({$buttonLoader: buttonLoaderElement});
        });
    }

    ns.generateButtonId = function(length = 6) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    ns.updateStyleFromAttributes = function({$buttonLoader, buttonId}) {
        // FIXME: not completed
        console.log(`[Quantz Button ${buttonId}] [updateStyleFromAttributes] try update style from data-quantz-config`)
        if (!$buttonLoader) {
            console.error('[Quantz Button] [updateStyle] Button loader element not found.');
        }
        console.log(`[Quantz Button ${buttonId}] [updateStyleFromAttributes] button found with attributes ${$buttonLoader.getAttribute('data-quantz-config')}`)
        let config = ns.parseConfig({buttonId: buttonId, $buttonLoader: $buttonLoader});
        ns.setupConfig({buttonId: buttonId, config: config});
        ns.applyDynamicStyles({buttonId: buttonId, config: config})
    }

    ns.parseConfig = function({buttonId, $buttonLoader}) {
        let config;
        try {
            console.log(`[Quantz Button ${buttonId}] try parsing config attributes from data-quantz-config`)
            const configString = $buttonLoader.getAttribute('data-quantz-config');
            console.log(`[Quantz Button ${buttonId}] Parse config string: ${configString}`);
            config = JSON.parse(configString);
            console.log(`[Quantz Button ${buttonId}] Configuration parsed: ${JSON.stringify(config)}`);
            return config;
        } catch (error) {
            console.error(`[Quantz Button ${buttonId}] Error parsing quantz config data:`, error);
            return;
        }
    }

    ns.initializeButton = function({$buttonLoader}) {
        const buttonId = ns.generateButtonId();
        console.log(`[Quantz Button ${buttonId}] Start initializing button with id ${buttonId}`);
        console.log(`[Quantz Button ${buttonId}] $buttonLoader:`, $buttonLoader);
        if (!$buttonLoader) {
            console.error(`[Quantz Button ${buttonId}] Button loader element not found.`);
        }
        let config = ns.parseConfig({buttonId: buttonId, $buttonLoader: $buttonLoader});

        // Load CSS dynamically based on the button type
        ns.setupConfig({buttonId: buttonId, config: config});
        const cssPathCommon = `https://${ns.configs[buttonId].host}/css/quantz-common.css`;
        ns.loadCSS({cssPath: cssPathCommon, callback: ()=> {
            const cssPath = `https://${ns.configs[buttonId].host}/css/quantz-${config.buttonType}-medium.css`;
            console.log(`[Quantz Button ${buttonId}] try loading css for button ${buttonId} from the path: ${cssPath}`)
            ns.loadCSS({cssPath: cssPath, callback: () => {
                console.log(`[Quantz Button ${buttonId}] CSS loaded for button ${buttonId} type ${ns.configs[buttonId].buttonType} from path ${cssPath}`);
                ns.createDOMElements({buttonId: buttonId, config: config, loaderDiv: $buttonLoader});

                //// Initialize components after ensuring CSS is loaded
                //ns.locales[buttonId] = new ns.Locale({
                //    buttonId: buttonId,
                //    containerId: ns.configs[buttonId].buttonControlId,
                //    closeAreaId: $buttonLoader.id,
                //    languages: ns.configs[buttonId].languages,
                //    defaultLang: ns.configs[buttonId].defaultLang})
                //ns.balloons[buttonId] = new ns.Balloon({
                //    buttonId: buttonId,
                //    containerId: $buttonLoader.id,
                //    defaultLang: ns.configs[buttonId].defaultLang,
                //    buttonType: config.buttonType});
                //console.warn('Balloon generated', ns.balloons[buttonId])

                // Setup interactions for this button instance
                const buttonController = new ns.ButtonController({
                    buttonId: buttonId,
                    buttonType: ns.configs[buttonId].buttonType,
                    animationController: new ns.AnimationController(),
                    indicatorController: ns.indicatorController,
                    lang: ns.locales[buttonId].lang});
                const $btn = $buttonLoader.querySelector(`#${ns.configs[buttonId].buttonElementId}`);
                if (ns.configs[buttonId].autoInteraction) {
                    buttonController.switchToStart();
                } else {
                    buttonController.switchToStandby();
                }
                ns.buttonControllers[buttonId] = buttonController;
                ns.setupInteractions({buttonId: buttonId, $buttonLoader: $buttonLoader, $btn: $btn});

                // Setup core engine
                ns.cores[buttonId] = new ns.Core({buttonId: buttonId, defaultLang: config.defaultLang});
                if (ns.configs[buttonId].autoInteraction) {
                    ns.setupAutoInteraction(buttonId, config)
                }
            }})
        }});
    }

    ns.setupAutoInteraction = function(buttonId, config) {
        console.log(`[Quantz Button] Setup auto interaction with responseMode => ${ns.configs[buttonId].responseMode}`)
        ns.interactionControllers[buttonId] = new ns.InteractionController({
            buttonId: buttonId,
            frequencyMs: ns.configs[buttonId].spectrumFrequencyMs,
            responseMode: parseInt(ns.configs[buttonId].responseMode) ?? ns.ResponseMode.NORMAL,
            defaultLang: config.defaultLang});
    }


    document.addEventListener('DOMContentLoaded', ns.setup);

    document.addEventListener('userInfoUpdated', (event) => {
        const { userInfo } = event.detail;
        ns.userInfo = userInfo;
        console.log(`[Quantz Button] userInfoUpdated event received.`)
        console.log(userInfo)
    })

    /* Interactions */



    ns.setupInteractions = function({buttonId, $buttonLoader, $btn}) {
        // Define event handlers
        const onMouseEnter = () => {
            console.log(`[Quantz Button ${buttonId}] Start button mouseenter`);
            //ns.buttonControllers[buttonId].switchToLeave()
        };

        const onMouseLeave = () => {
            console.log(`[Quantz Button ${buttonId}] Start button mouseleave`);
        };

        const onMouseDown = () => {
            console.log(`[Quantz Button ${buttonId}] Button pressed - buttonState ${ns.buttonControllers[buttonId].buttonState}`);

            switch (ns.buttonControllers[buttonId].buttonState) {
                case ns.ButtonState.start: // autoInteraction mode
                    // Connect to server
                    ns.cores[buttonId].initializeAudio();
                    ns.cores[buttonId].connect(() => {
                        ns.buttonControllers[buttonId].switchToConnected(); // Switch to the connected state
                        if (ns.cores[buttonId].connectionRetryCount > 0) {
                            console.log(`[Quantz Button ${buttonId}] Connection reestablished.`)
                            ns.buttonControllers[buttonId].switchToRecording(); // Switch to the recording state
                            ns.cores[buttonId].startRecording();
                        } else {
                            console.log(`[Quantz Button ${buttonId}] Connection established.`);
                            ns.cores[buttonId].sendStartMessage(ns.userInfo);
                            ns.interactionControllers[buttonId].start();
                        }
                    });
                    // Dispatch start event
                    document.dispatchEvent(new CustomEvent(ns.configs[buttonId].didClickStartEventName, {detail: {}}));
                    break;

                case ns.ButtonState.restart:
                    // Restart 
                    // TODO: Display "Are you sure" dialogue
                    ns.cores[buttonId].initializeAudio();
                    ns.cores[buttonId].connect(() => {
                        console.log(`[Quantz Button ${buttonId}] Connection established.`);
                        ns.buttonControllers[buttonId].switchToConnected(); // Switch to the connected state
                        if (ns.cores[buttonId].connectionRetryCount > 0) {
                            console.log(`[Quantz Button ${buttonId}] Connection reestablished.`)
                            ns.buttonControllers[buttonId].switchToRecording(); // Switch to the recording state
                            ns.cores[buttonId].startRecording();
                        } else {
                            console.log(`[Quantz Button ${buttonId}] Connection established.`);
                            ns.cores[buttonId].sendStartMessage(ns.userInfo);
                            ns.interactionControllers[buttonId].start();
                        }
                    });
                    // Dispatch restart event
                    document.dispatchEvent(new CustomEvent(ns.configs[buttonId].didClickRestartEventName, {detail: {}}));
                    break;
 
                case ns.ButtonState.standby:
                    // Connect to server
                    ns.cores[buttonId].initializeAudio();
                    ns.cores[buttonId].connect(() => {
                        console.log(`[Quantz Button ${buttonId}] Connection established.`);
                        if (ns.configs[buttonId].buttonType == ns.ButtonType.A) {
                            ns.indicatorControllers[buttonId].connectedAnimation();
                        }
                        ns.buttonControllers[buttonId].switchToConnected(); // Switch to the connected state
                        //setTimeout(() => {
                            ns.buttonControllers[buttonId].switchStandbyToPushSpeak(); // Switch to the speaking state
                        //}, 1000);
                        if (ns.cores[buttonId].connectionRetryCount > 0) {
                            console.log(`[Quantz Button ${buttonId}] Connection reestablished.`)
                            ns.buttonControllers[buttonId].switchToRecording(); // Switch to the recording state
                            ns.cores[buttonId].startRecording();
                        } else {
                            console.log(`[Quantz Button ${buttonId}] Connection established.`);
                            console.log('*****************************')
                            ns.cores[buttonId].sendStartMessage(ns.userInfo);
                            console.log('*****************************')
                        }
 
                    });
                    break;
                
                case ns.ButtonState.pushSpeak:
                    // Speak
                    if (ns.configs[buttonId].buttonType == ns.ButtonType.A) {
                        ns.buttonControllers[buttonId].rotateGlowLight();
                        //ns.indicatorController.updateAllColor(ns.Config.dialColorDown, 1, 0, 'linear', false);
                        //ns.indicatorController.updateAllColor('#00FFFF', 1, 0, 'linear', false);
                        ns.indicatorControllers[buttonId].listeningAnimation();
                    }
                    ns.buttonControllers[buttonId].switchToRecording(); // Switch to the recording state
                    ns.cores[buttonId].startRecording();
                    break;
            }
        };

        const onMouseUp = () => {
            console.log(`[Quantz Button ${buttonId}] Button released - buttonState ${ns.buttonControllers[buttonId].buttonState}`);
            switch (ns.buttonControllers[buttonId].buttonState) {
                case ns.ButtonState.standby:
                    break;
            
                case ns.ButtonState.listening:
                    // Start replying
                    ns.cores[buttonId].stopRecording();
                    if (ns.configs[buttonId].buttonType == ns.ButtonType.A) {
                        ns.indicatorControllers[buttonId].replyStartAnimation()
                        //ns.indicatorController.updateAllColor(ns.Config.dialColorUp, 1, 0, 'linear', false);
                        ns.buttonControllers[buttonId].stopGlowLightRotation();
                    }
                    ns.buttonControllers[buttonId].switchToReplying();
                    ns.balloons[buttonId].show();
                    //setTimeout(() => {
                    //    controller.switchStandbyToPushSpeak();
                    //}, 5000);
                    //break;
                    break;

                case ns.ButtonState.leave:
                    document.dispatchEvent(new CustomEvent(ns.configs[buttonId].didClickLeaveButtonEventName, {detail: {}}));
                    break;


            }
        };

        // Attach mouse events
        $btn.addEventListener('mouseenter', onMouseEnter);
        $btn.addEventListener('mouseleave', onMouseLeave);
        $btn.addEventListener('mousedown', onMouseDown);
        $btn.addEventListener('mouseup', onMouseUp);

        // Attach equivalent touch events
        $btn.addEventListener('touchstart', (event) => {
            event.preventDefault(); // Prevent mouse events
            onMouseDown(); // Call the mousedown handler
        });
        $btn.addEventListener('touchend', (event) => {
            event.preventDefault(); // Prevent mouse events
            onMouseUp(); // Call the mouseup handler
        });

        // Optionally handle touchmove or touchcancel if needed
        $btn.addEventListener('touchmove', (event) => {
            event.preventDefault(); // You might want to prevent scrolling or other default actions
            // Handle touch move if necessary
        });
        $btn.addEventListener('touchcancel', (event) => {
            event.preventDefault(); // Prevent mouse events
            onMouseUp(); // Handle it like a touchend or mouseup
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].assistantResponseStartEventName, function(event) {
            const { buttonId, message } = event.detail;
            console.log(`[Quantz Button ${buttonId}] assistant response started:`, message);
            //ns.indicatorController.sequentialColorUpdate(1, ['#fff'])
            if (ns.configs[buttonId].autoInteraction) {
                ns.interactionControllers[buttonId].didAssistantResponseStart(message);
                ns.balloons[buttonId].show();
            }
        })

        // FIXME: prevent multiple events added even when called initializeButton to the same buttonloader
        function handleMessageReceive(event) {
            const { buttonId, type, message } = event.detail;
            console.log(`[Quantz Button ${buttonId}] new message received:`, buttonId, type, message);
        
            ns.balloons[buttonId].insertMessage({
                buttonId: buttonId,
                type: type,
                text: message,
                lang: ns.cores[buttonId].lang});

            // Dispatch messageReceive event
            document.dispatchEvent(new CustomEvent(ns.configs[buttonId].messageReceiveEventName, {
                detail: {
                    buttonId: buttonId,
                    senderType: type, // 'system' 'user' 'announce'
                    message: message,
                }
            }))
            if (ns.configs[buttonId].autoInteraction) {
                switch (type) {
                    case "system":
                        ns.interactionControllers[buttonId].didAssistantMessageReceive(message);
                        break;
                    case "user":
                        ns.interactionControllers[buttonId].didHumanMessageReceive(message);
                        break;
                    case "announce":
                        ns.interactionControllers[buttonId].didAnnounceMessageReceive(message);
                        break;
                }
            }
        }
        $buttonLoader.removeEventListener(ns.configs[buttonId].messageReceiveEventName, handleMessageReceive);
        $buttonLoader.addEventListener(ns.configs[buttonId].messageReceiveEventName, handleMessageReceive);

        $buttonLoader.addEventListener(ns.configs[buttonId].assistantStartPlayingAudioBufferEventName, function(event) {
            const { buttonId } = event.detail;
            console.log(`[Quantz Button ${buttonId}] assistant start playing audio buffer event received`);
            ns.buttonControllers[buttonId].switchToReplying();

            if (ns.configs[buttonId].autoInteraction) {
                if(ns.cores[buttonId].hasSignificantSpeech) {
                    // keep recording and stop assistant speach

                } else {
                    // just stop recording (not submit)
                    console.warn(`[Quantz Button ${buttonId}] assistant start playing and no significant human speech -> juset stop recording`)
                    ns.cores[buttonId].stopRecording();
                }
                ns.interactionControllers[buttonId].didAssistantStartPlayingAudioBuffer();
            }
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].assistantAudioSignalEventName, function(event) {
            const { buttonId, spectrum, volume } = event.detail;
            //console.log(`[Quantz Button ${buttonId}] assistant spectrum size:`, spectrum.length, ' volume:', volume, 'received')
            if (ns.configs[buttonId].autoInteraction) {
                ns.interactionControllers[buttonId].appendAssistantSignalData(volume);
            }
            //console.log('**** spectrum', spectrum);
            if (ns.configs[buttonId].buttonType == ns.ButtonType.A) {
                ns.indicatorControllers[buttonId].speakingAnimation(spectrum);
            }

            // dispatch event
            document.dispatchEvent(new CustomEvent(ns.configs[buttonId].assistantAudioSignalEventName, {
                detail: {
                    buttonId: buttonId,
                    spectrum: spectrum,
                    volume: volume,
                }}))
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].assistantEndAudioSignalEventName, function(event) {
            console.log(`[Quantz Button ${buttonId}] **** (finish) assistant spectrum`);
            if (ns.configs[buttonId].autoInteraction) {
                ns.interactionControllers[buttonId].didAssistantEndPlayingAudio();
                // Delay to avoid catching assistant voice
                setTimeout(() => {
                    if (!ns.isConversationEnd) {
                        ns.buttonControllers[buttonId].switchToRecording(); // Switch to the recording state
                        ns.cores[buttonId].startRecording();
                    }
                }, 1000)
            }
            if (ns.configs[buttonId].buttonType === ns.ButtonType.A) {
                ns.indicatorControllers[buttonId].resetToConnectedAnimation();
            }
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].assistantSkipTurnEventName, function(event) {
            console.log(`[Quantz Button ${buttonId}] assistant skip turn event received`);
            if (ns.configs[buttonId].autoInteraction) {
                // Immediately switch turn to human
                if (!ns.isConversationEnd) {
                    ns.buttonControllers[buttonId].switchToRecording(); // Switch to the recording state
                    ns.cores[buttonId].startRecording();
                }
                ns.interactionControllers[buttonId].didAssistantEndTurn();
            } else {
                ns.buttonControllers[buttonId].switchToPushSpeak();
                if (ns.configs[buttonId].buttonType === ns.ButtonType.A) {
                    ns.indicatorControllers[buttonId].endTurnAnimation();
                }
            }
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].assistantEndTurnEventName, function(event) {
            console.log(`[Quantz Button ${buttonId}] assistant end turn event received`);
            if (ns.configs[buttonId].autoInteraction) {
                ns.interactionControllers[buttonId].didAssistantEndTurn();
                //ns.buttonControllers[buttonId].switchToRestart();
                //ns.buttonControllers[buttonId].switchToReplying();
            } else {
                ns.buttonControllers[buttonId].switchToPushSpeak();
                if (ns.configs[buttonId].buttonType === ns.ButtonType.A) {
                    ns.indicatorControllers[buttonId].endTurnAnimation();
                }
            }
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].assistantSpeechEnforcedStopEventName, (e) => {
            console.log(`[Quantz Button ${buttonId}] Assistant speech was enforced to stop:`, e.detail);
            // Handle the enforced stop accordingly
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].humanAudioSignalEventName, function(event) {
            const { buttonId, spectrum, volume, fundamentalFreq } = event.detail;
            //console.log(`[Quantz Button ${buttonId}] human spectrum size:`, spectrum.length, ' volume:', volume, ' fundamental freq:', fundamentalFreq, 'received')
            ns.interactionControllers[buttonId].appendHumanSignalData(volume, fundamentalFreq);
            //console.log('**** spectrum', spectrum);
            document.dispatchEvent(new CustomEvent(ns.configs[buttonId].humanAudioSignalEventName, {
                detail: {
                    buttonId: buttonId,
                    spectrum: spectrum,
                    volume: volume,
                    fundamentalFreq: fundamentalFreq
                }}))
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].humanStartSpeakingEventName, function(event) {
            const { buttonId } = event.detail;
            console.log(`[Quantz Button ${buttonId}] human start speaking.`)
            // **** [Experimental]
            // 人間が話し終えていないのに終了判定されることがあるのでそのまま話を拾いたい
            // しかしAssistantが発話しているとそれを拾ってしまうのでassistantの発話を止めることが必要
            //if (ns.interactionControllers[buttonId].isAssistantSpeaking) {
            //    console.warn(`[Quantz Button ${buttonId}] human start speaking while assistant is speaking. enforce stop assistant speach.`)
            //    ns.cores[buttonId].enforceStopAssistantSpeech();
            //}
            // **** [Experimental]

            // TODO: 
            // send \\STOP message in certain condition
            // ユーザーが話し終えてからisAssistantSpeaking=trueになるまでの間をwaitingHumanResponse状態と定義する
            // この間にこのイベントが発動したら\\STOPを送る
            // \\STOPを受信したサーバーはshould_force_listening=Trueをセットしこの間常にC: listeningとなる
            // 次回ユーザーのtranscribeを実行した際にshould_force_listeningはFalseにリセットされる
            // isHumanSpeaking=trueとなるのでこの間assistantは発話しない

            // このStartSpeakingEventがトリガーされるには
            // startRecording()されている状態で
            // hasSignificantData == trueのときhumanAudioSignalEventがdispatchされ
            // appendHumanSignalData内のcheckHumanSilence()が実行される
            // if(lastHumanDecibel >= THRESH)を満たすときisHumanSpeaking=trueに切り替わりこのイベントがdispatchされる

            // まずstopRecording()で自動的にsubmitするのをやめる
            // 代わりにdidRecordingStopEventをdispatchし条件を満たすときのみsubmitする
            // 条件はaudoInteractionなら一度でも発話がなされたかどうか
            // これはhasSignificantSpeech==trueかどうか
            // -> hasSignificantSpeechを見なくても現在有効なspeechがありかつ発話終了検出するとstopRecroding()が走る
            //      core.startRecording()
            //         interactionController.checkHumanSilence()
            //             -> 有効な発話がみつかる  interactionController.dispatchHumanStartSpeaking()
            //                  -> interactionController.isHumanSpeaking
            //             -> 発話停止判定true  interactionController.dispatchHumanStopSpeaking()
            //         core.startDispatchingHumanAudioSignalEvent()
            //             -> hasSignificantData -> core.humanAudioSignalEvent() 
            //                  -> 有効な発話がみつかる hasSignificantSpeech = true
            //                  -> interactionController.appendHumanSignalData()
            //               -> interactionController.dispatchHumanStopSpeaking()
            //                  -> core.stopRecoding()
            //                  -> core.dispatchHumanStopRecordingEvent()
            //                       -> if hasSignificantSpeech -> submit()
            //                       -> if not -> 
            // finishDispatchingHumanAudioSignalEvent()の直後に再度startRecording()を開始する
            // このとき
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].humanStopSpeakingEventName, function(event) {
            const { buttonId } = event.detail;
            console.log(`[Quantz Button ${buttonId}] human stop speaking.`)
            if (ns.configs[buttonId].autoInteraction) {
                switch (ns.interactionControllers[buttonId].assistantState) {
                    case ns.AssistantState.START_RESPONDING:
                        ns.cores[buttonId].stopRecording();
                        break;
                    case ns.AssistantState.SPEAKING:
                        ns.cores[buttonId].stopRecording();
                        break;
                    case ns.AssistantState.WAITING:
                        ns.cores[buttonId].stopRecording();
                        break;
                }
                switch (ns.buttonControllers[buttonId].buttonState) {
                    case ns.ButtonState.listening:
                        // Stop replying
                        ns.cores[buttonId].stopRecording();
                        ns.buttonControllers[buttonId].switchToReplying();
                        break;
                    case ns.ButtonState.replying:
                }
            }
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].humanStopRecordingEventName, function(event) {
            const { buttonId } = event.detail;
            console.log(`[Quantz Button ${buttonId}] human stop recording.`)
            if (ns.cores[buttonId].hasSignificantSpeech) {
                console.warn(`[Quantz Button ${buttonId}] has significant speech. submit.`)
                ns.cores[buttonId].submitHumanSpeach();
            } else {
                console.warn(`[Quantz Button ${buttonId}] no significant speech. skip.`)
            }
            // **** [Experimental]
            // 人間が話し終えていないのに終了判定されることがあるのでそのまま話を拾いたい
            // しかしAssistantが発話しているとそれを拾ってしまうのでassistantの発話を止めることが必要
            //if (ns.configs[buttonId].autoInteraction) {
            //    ns.cores[buttonId].startRecording();
            //}
            /// ********************

            //if (ns.configs[buttonId].autoInteraction) {
            //    switch (ns.buttonControllers[buttonId].buttonState) {
            //        case ns.ButtonState.listening:
            //            break;
            //    }
            //} else {

            //}
 
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].closeMessageReceivedEventName, function(event) {
            console.log(`[Quantz Button ${buttonId}] close message received event received`);

            ns.cores[buttonId].waitPlayingBufferAndDisconnect({
                onPlaybackFinished: () => {
                    document.dispatchEvent(new CustomEvent(ns.configs[buttonId].lastSpeechFinishedEventName, {detail: {}}));
                    // gracefully leave
                    setTimeout(() => {
                        ns.buttonControllers[buttonId].switchToLeave();
                        ns.isConversationEnd = true;
                        if (ns.configs[buttonId].autoInteraction) {
                            ns.interactionControllers[buttonId].didConversationEnd();
                        }
                    }, 1000)
                }}
            )

            //setTimeout(() => {
            //    ns.buttonControllers[buttonId].switchToLeave();
            //    ns.cores[buttonId].disconnect();

            //    if (ns.configs[buttonId].autoInteraction) {
            //        ns.interactionControllers[buttonId].didConversationEnd();
            //    }
            //}, 10000)

            // dispatch to interface
            document.dispatchEvent(new CustomEvent(ns.configs[buttonId].closeMessageReceivedEventName, {detail: {}}));
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].reachToLimitEventName, function(event) {
            console.log(`[Quantz Button ${buttonId}] reach to limit event received`);
            ns.isConversationEnd = true;
            ns.buttonControllers[buttonId].switchToStandby();
            ns.indicatorControllers[buttonId].resetToStandby();
            ns.cores[buttonId].disconnect();

            if (ns.configs[buttonId].autoInteraction) {
                ns.interactionControllers[buttonId].didReachToLimitReceived();
                ns.interactionControllers[buttonId].didConversationEnd();
            }
        })

        $buttonLoader.addEventListener(ns.configs[buttonId].languageChangeEventName, function(event) {
            const { buttonId, lang } = event.detail;
            console.log(`[Quantz Button ${buttonId}] language change event received:`, lang);
            ns.configs[buttonId].lang = lang;
            ns.cores[buttonId].lang = lang;
            ns.buttonControllers[buttonId].changeLanguage(lang);
            ns.balloons[buttonId].changeLanguage(lang);
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].tokenIssuedEventName, function(event) {
            const { buttonId, token, clientId } = event.detail;
            console.log(`[Quantz Button ${buttonId}] token and clientId issued event received.`);
            document.dispatchEvent(new CustomEvent(ns.configs[buttonId].tokenIssuedEventName, {
                detail: {
                    buttonId: buttonId,
                    //token: token,  // just in case not publish for security reason
                    clientId: clientId
                }
            }));
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].failedToGetBasicConfigEventName, function(event) {
            const { buttonId, error, status } = event.detail;
            console.log(`[Quantz Button ${buttonId}] failed to get basicConfig event received:`, error);
            ns.buttonControllers[buttonId].switchToBusy();
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].basicConfigFetchedEventName, function(event) {
            const { buttonId, basicConfig } = event.detail;
            console.log(`[Quantz Button ${buttonId}] basicConfig fetched event received.`);
            console.error(event.detail)
            console.error(basicConfig)
            const { host_id, languages, speaker_for_langs, interaction_model_id, response_mode, max_turns_default } = basicConfig;
            console.log(`[Quantz Button ${buttonId}] Host ID: ${host_id}`);
            console.log(`[Quantz Button ${buttonId}] Languages: ${languages.join(", ")}`);
            console.log(`[Quantz Button ${buttonId}] Speaker for Languages: ${JSON.stringify(speaker_for_langs)}`);
            console.log(`[Quantz Button ${buttonId}] Interaction Model ID: ${interaction_model_id}`);
            console.log(`[Quantz Button ${buttonId}] Response Mode: ${response_mode}`);
            console.log(`[Quantz Button ${buttonId}] Max Turns Default: ${max_turns_default}`);
            if (ns.configs[buttonId].autoInteraction) {
                ns.interactionControllers[buttonId].basicConfig = basicConfig;
                ns.interactionControllers[buttonId].setResponseMode(response_mode);
            }
 
            // NOTE: no need to tell?
            //document.dispatchEvent(new CustomEvent(ns.configs[buttonId].basicConfigFetchedEventName, {
            //    detail: {
            //        buttonId: buttonId,
            //        basicConfig: basicConfig
            //    }
            //}));
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].failedToGetTokenEventName, function(event) {
            const { buttonId, error, status } = event.detail;
            console.log(`[Quantz Button ${buttonId}] failed to get token event received:`, error);
            if (status == 429 || status == "429") {
                ns.buttonControllers[buttonId].switchToLimitReached();
            } else {
                ns.buttonControllers[buttonId].switchToBusy();
            }
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].signalDataUpdatedEventName, function(event) {
            const { humanDecibels, humanFundamentalFrequencies, assistantDecibels } = event.detail;
            //console.log(`[Quantz Button ${buttonId}] Human & Assistant signal data updated event received.`);
            //console.log(`[humanDecibels] ${humanDecibels}`);
            //console.log(`[humanFundamentalFrequencies] ${humanFundamentalFrequencies}`);
            // Dispatch signalDataUpdated event
            document.dispatchEvent(new CustomEvent(ns.configs[buttonId].signalDataUpdatedEventName, {
                detail: {
                    humanDecibels: humanDecibels,
                    humanFundamentalFrequencies: humanFundamentalFrequencies,
                    assistantDecibels: assistantDecibels
                }
            }));
        });

        $buttonLoader.addEventListener(ns.configs[buttonId].conversationDataUpdatedEventName, function(event) {
            const { buttonId, events } = event.detail; 
            document.dispatchEvent(new CustomEvent(ns.configs[buttonId].conversationDataUpdatedEventName, {
                detail: {
                    events: events
                }
            }))
        })

        // Handling touch events for touch devices
        $btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevents additional mouse events being fired on touch devices
            console.log('Start button touched - starting opacity sequence');
        });

        $btn.addEventListener('touchend', () => {
            console.log('Start button touch ended - stopping opacity sequence');
        });
    }
})(Quantz);