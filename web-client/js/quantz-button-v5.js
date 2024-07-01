(function(ns) {
    ns.Config = {
        host: 'quantz.thinkxinc.com',
        sampleRate: 24000,
        prefix: 'QBTN-',
        buttonId: 'quantz-button',
        buttonLoaderClassName: 'quantz-button-loader',
        buttonContainerId: 'quantz-button-container',
        buttonContainerClassName: 'button-container',
        buttonControlId: 'quantz-button-control',
        signClassName: 'sign',
        buttonTextContainerId: 'button-text-container',
        buttonTextContainerClassName: 'button-text-container',
        buttonTextClassName: 'button-text',
        defaultButtonTextContent: 'Connecting...',
        indicatorClassName: 'indicator',
        indicatorDiameterRate: 0.8,
        glowLightId: 'glowlight',
        iconWrapperClassName: 'icon-wrapper',
        defaultIconImgSrc: 'https://quantz.thinkxinc.com/img/quantz_button/standby-icon-white.svg',
        iconImageClassName: 'button-icon',
        spacerClassName: 'spacer',
        balloonId: 'quantz-balloon',
        balloonDialogueId: 'dialogue',
        balloonPowerdByImageSrc: 'https://quantz.thinkxinc.com/img/quantz_button/powerdby.svg',
        balloonLegImgSrc: 'https://quantz.thinkxinc.com/img/quantz_button/balloonleg.png',
        balloonLegImgSrcset: 'https://quantz.thinkxinc.com/img/quantz_button/balloonleg@2x.png 2x',
        localeIconSrc: 'https://quantz.thinkxinc.com/img/quantz_button/locale-icon.svg',
        arrowDownIconSrc: 'https://quantz.thinkxinc.com/img/quantz_button/arrow-down.svg',
        N: 40, // Number of lines
        dialLength: 4, // Length of each dial
        dialColorUp: '#2F7A7C',//'#334d4e',//'#2F7A7C', // dial color
        dialColorDown: '#205354',//'#334d4e',//'#2F7A7C', // dial color
        dialThickness: '1px', // dial thickness
        animationDuration: 0.3,
        animationDelay: 0,
        animationCurve: 'cubic-bezier(.65,0,.34,1)',
        languages: [
            new ns.Language("English", ns.LanguageCode.en),
            new ns.Language("日本語", ns.LanguageCode.ja)
        ],
        messageReceiveEventName: 'quantz-messageReceived',
        endTurnEventName: 'quantz-endTurn',
        reachToLimitEventName: 'quantz-reachToLimit',
        languageChangeEventName: 'quantz-languageChange',
        failedToGetTokenEventName: 'quantz-failedToGetToken'
    };

    ns.indicatorController = null;
    ns.locale = null;
    ns.balloon = null;
    ns.sign = null;
    ns.core = null;

    ns.setupIndicator = function(button, buttonWidth) {
        const indicator = button.querySelector(`.${ns.Config.prefix}indicator`);
        const icon = button.querySelector(`.${ns.Config.prefix}button-icon`);
        const diameter = parseFloat(buttonWidth) * ns.Config.indicatorDiameterRate; // Diameter is 80% of the button size
        const radius = diameter / 2;
        const centerX = parseFloat(buttonWidth) / 2;
        const centerY = parseFloat(buttonWidth) / 2;

        // Scale the icon size relative to the button size (assumed 50px is for 144px button size)
        const iconSize = (buttonWidth / 144) * 50; // Scaling factor for the icon
        icon.style.width = `${iconSize}px`;
        icon.style.height = `${iconSize}px`;

        for (let i = 0; i < ns.Config.N; i++) {
            let dial = document.createElement('div');
            dial.className = `${ns.Config.prefix}dial ${ns.Config.prefix}dial_${i}`;
            dial.style.position = 'absolute';
            dial.style.width = `${ns.Config.dialLength}px`;
            dial.style.height = ns.Config.dialThickness;
            dial.style.backgroundColor = ns.Config.dialColor;
            dial.style.borderRadius = '1px';

            const angle = (i / ns.Config.N) * 2 * Math.PI - Math.PI / 2;
            const dialX = centerX + radius * Math.cos(angle) - (ns.Config.dialLength / 2);
            const dialY = centerY + radius * Math.sin(angle) - (parseFloat(ns.Config.dialThickness) / 2);

            dial.style.left = `${dialX}px`;
            dial.style.top = `${dialY}px`;
            dial.style.transform = `rotate(${i * (360 / ns.Config.N) + 90}deg)`;
            dial.style.transformOrigin = `${ns.Config.dialLength / 2}px 1px`;

            indicator.appendChild(dial);
        }

        // Now that all dials are created and added to the DOM, instantiate the IndicatorController
        ns.indicatorController = new ns.IndicatorController(indicator);

    }

    ns.loadCSS = function(href, callback) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href
        link.onload = () => callback();
        document.head.appendChild(link);
    }

    ns.setupConfig = function(config) {
        ns.Config.buttonType = config.buttonType;
        ns.Config.buttonWidth = config.buttonWidth;
        ns.Config.buttonHeight = config.buttonHeight;
        ns.Config.buttonColor = config.buttonColor;
        ns.Config.iconSize = config.iconSize;
        ns.Config.fontSize = config.fontSize;
        ns.Config.borderRadius = config.borderRadius;
        ns.Config.displayLocale = config.displayLocale;
        ns.Config.balloonRectWidth = config.balloonRectWidth;
        ns.Config.balloonRectHeight = config.balloonRectHeight;
        ns.Config.defaultLang = config.defaultLang;
    }

    ns.createDOMElements = function(config, loaderDiv) {
        while (loaderDiv.firstChild) {
            loaderDiv.removeChild(loaderDiv.firstChild);
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.id = ns.Config.prefix + ns.Config.buttonContainerId;
        buttonContainer.className = `${ns.Config.prefix}${ns.Config.buttonContainerClassName}`;
        loaderDiv.appendChild(buttonContainer);

        if (config.buttonType === ns.ButtonType.A) {
            buttonContainer.classList.add('QBTN-TYPE-A');

            // Create button
            const button = document.createElement('button');
            button.id = ns.Config.prefix + ns.Config.buttonId;
            ns.insertIndicator(button);
            ns.insertGlowlight(button);
            ns.insertIconWrapper(button, config);
            buttonContainer.appendChild(button);

            // Create button control
            const buttonControl = document.createElement('div');
            buttonControl.id = ns.Config.prefix + ns.Config.buttonControlId;
            ns.insertSpacer(buttonControl, config);
            ns.insertButtonTextContainer(buttonControl, config);
            buttonContainer.appendChild(buttonControl);
        }

        if (config.buttonType === ns.ButtonType.B) {
            buttonContainer.classList.add('QBTN-TYPE-B');

            // Create button
            const button = document.createElement('button');
            button.id = ns.Config.prefix + ns.Config.buttonId;
            ns.insertButtonTextContainer(button, config);
            ns.insertIconWrapper(button, config);
            buttonContainer.appendChild(button);

            // Create button control
            const buttonControl = document.createElement('div');
            buttonControl.id = ns.Config.prefix + ns.Config.buttonControlId;
            ns.insertSpacer(buttonControl, config);
            buttonContainer.appendChild(buttonControl);
        }

        // Apply dynamic styles after creating the button
        ns.applyDynamicStyles(config);
    }

    ns.insertIndicator = function(container, config) {
        const indicator = document.createElement('div');
        indicator.className = ns.Config.prefix + ns.Config.indicatorClassName;
        container.appendChild(indicator);
        return indicator;
    }

    ns.insertGlowlight = function(container, config) {
        const svgHTML = `
            <svg id="${ns.Config.prefix}${ns.Config.glowLightId}" width="144px" height="144px" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
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

    ns.insertIconWrapper = function(container, config) {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = ns.Config.prefix + ns.Config.iconWrapperClassName;
        const iconImage = document.createElement('img');
        iconImage.src = ns.Config.defaultIconImgSrc;
        iconImage.className = ns.Config.prefix + ns.Config.iconImageClassName;
        iconImage.alt = 'Button Icon';
        iconWrapper.appendChild(iconImage);
        container.appendChild(iconWrapper);

        return iconWrapper;
    }

    ns.insertButtonTextContainer = function(container, config) {
        const buttonTextContainer = document.createElement('div');
        buttonTextContainer.id = ns.Config.prefix + ns.Config.buttonTextContainerId;
        buttonTextContainer.className = ns.Config.prefix + ns.Config.buttonTextContainerClassName;
        const buttonText = document.createElement('div');
        buttonText.className = ns.Config.prefix + ns.Config.buttonTextClassName;
        buttonText.textContent = ns.Config.defaultButtonTextContent;
        buttonTextContainer.appendChild(buttonText);
        container.appendChild(buttonTextContainer);

        return buttonTextContainer;
    }

    ns.insertSpacer = function(container, config) {
        const spacer = document.createElement('div');
        spacer.className = ns.Config.prefix + ns.Config.spacerClassName;
        container.appendChild(spacer);

        return spacer;
    }

    ns.applyDynamicStyles = function(config) {
        const button = document.getElementById(ns.Config.prefix + ns.Config.buttonId);
        if (!button) {
            console.error(`Button element not found by ID: ${ns.Config.prefix + ns.Config.buttonId}`);
            return;
        }
        const computedStyle = window.getComputedStyle(button);
        ns.Config.buttonWidth = config.buttonWidth ? config.buttonWidth : parseInt(computedStyle.width, 10);
        console.log(`Computed button width: ${ns.Config.buttonWidth}`);

        // Customize size and styles based on extracted configurations
        if (ns.Config.buttonType == ns.ButtonType.A) {
            button.style.width = `${ns.Config.buttonWidth}px`;
            button.style.height = `${ns.Config.buttonWidth}px`;
            ns.setupIndicator(button, ns.Config.buttonWidth);
        }

        // Customize size
        const styleGenerator = new ns.StyleGenerator(ns.Config.buttonType);
        if (ns.Config.buttonType == ns.ButtonType.B) {
            styleGenerator.generate({
                iconSize: ns.Config.iconSize,
                fontSize: ns.Config.fontSize,
                buttonWidth: ns.Config.buttonWidth,
                buttonHeight: ns.Config.buttonHeight,
                buttonColor: ns.Config.buttonColor,
                borderRadius: ns.Config.borderRadius,
                displayLocale: ns.Config.displayLocale,
                balloonRectWidth: ns.Config.balloonRectWidth,
                balloonRectHeight: ns.Config.balloonRectHeight
            });
        }
        if (ns.Config.buttonType == ns.ButtonType.A) {
            styleGenerator.generate({
                // buttonWidth has already been applied
                buttonWidth: ns.Config.buttonWidth,
                fontSize: ns.Config.fontSize,
                displayLocale: ns.Config.displayLocale,
                balloonRectWidth: ns.Config.balloonRectWidth,
                balloonRectHeight: ns.Config.balloonRectHeight
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
                console.log(`[Quantz Button] Node added with class: ${node.className} and id: ${node.id}`);
                if (node.matches(`.${ns.Config.prefix}${ns.Config.buttonLoaderClassName}`)) {
                    console.log('[Quantz Button] Matching button loader node found');
                    ns.initializeButton(node);
                } else {
                    console.log('[Quantz Button] Added node did not match expected selector');
                    // Recursively check child nodes
                    node.querySelectorAll(`.${ns.Config.prefix}${ns.Config.buttonLoaderClassName}`).forEach(innerNode => {
                        console.log('[Quantz Button] Found matching node inside added parent');
                        ns.initializeButton(innerNode);
                    });
                }
            }
        }


        // Start observing the body for added elements.
        observer.observe(document.body, { childList: true, subtree: true });

        // Ensure setup is idempotent if elements already exist on page load
        const loaderDivs = document.querySelectorAll(`.${ns.Config.prefix}${ns.Config.buttonLoaderClassName}`);
        loaderDivs.forEach(buttonLoaderElement => {
            console.log(`[Quantz Button] Found ${loaderDivs.length} existing loader elements.`);
            ns.initializeButton(buttonLoaderElement);
        });
    }

    ns.initializeButton = function(loaderElement) {
        console.log(`[Quantz Button] Start initializing button with id ${loaderElement.id}`);
        let config;
        try {
            console.log('[Quantz Button] try parsing config attributes from data-quantz-config')
            const configString = loaderElement.getAttribute('data-quantz-config');
            config = JSON.parse(configString);
            console.log(`[Quantz Button] Configuration parsed: ${JSON.stringify(config)}`);
        } catch (error) {
            console.error('Error parsing quantz config data:', error);
            return;
        }

        // Load CSS dynamically based on the button type
        const cssPath = `https://${ns.Config.host}/css/quantz-${config.buttonType}-medium.css`;
        console.log(`[Quantz Button] try loading css from the path: ${cssPath}`)
        ns.loadCSS(cssPath, () => {
            console.log(`[Quantz Button] CSS loaded for button type ${config.buttonType} from path ${cssPath}`);
            ns.setupConfig(config);
            ns.createDOMElements(config, loaderElement);

            // Initialize components after ensuring CSS is loaded
            locale = new ns.Locale(ns.Config.buttonControlId, loaderElement.id, ns.Config.languages, ns.Config.defaultLang);
            balloon = new ns.Balloon({containerId: loaderElement.id, defaultLang: ns.Config.defaultLang, buttonType: config.buttonType});

            // Setup interactions for this button instance
            const animationController = new ns.AnimationController();
            const controller = new ns.ButtonController(ns.Config.buttonType, animationController, ns.indicatorController, locale.lang);
            const btn = loaderElement.querySelector(`#${ns.Config.prefix + ns.Config.buttonId}`);
            controller.switchToStandby();
            ns.setupInteractions(btn, controller);

            // Setup core engine
            core = new ns.Core(config.defaultLang);
        });
    }


    document.addEventListener('DOMContentLoaded', ns.setup);

    /* Interactions */



    ns.setupInteractions = function(btn, controller) {
        // Define event handlers
        const onMouseEnter = () => {
            console.log('Start button mouseenter');
        };

        const onMouseLeave = () => {
            console.log('Start button mouseleave');
        };

        const onMouseDown = () => {
            console.log(`Button pressed - buttonState ${controller.buttonState}`);

            switch (controller.buttonState) {
                case ns.ButtonState.standby:
                    // Connect to server
                    core.initializeAudio();
                    core.connect(() => {
                        console.log("Connection established.");
                        controller.switchToConnected(); // Switch to the connected state
                        setTimeout(() => {
                            controller.switchStandbyToPushSpeak(); // Switch to the speaking state
                        }, 1000);
                    });
                    break;
                
                case ns.ButtonState.pushSpeak:
                    // Speak
                    if (ns.Config.buttonType == ns.ButtonType.A) {
                        controller.rotateGlowLight();
                        ns.indicatorController.updateAllColor(ns.Config.dialColorDown, 0.1, 0, 'linear');
                    }
                    controller.switchToRecording(); // Switch to the recording state
                    core.startRecording();
                    break;
            }
        };

        const onMouseUp = () => {
            console.log(`Button released - buttonState ${controller.buttonState}`);
            switch (controller.buttonState) {
                case ns.ButtonState.standby:
                    break;
            
                case ns.ButtonState.listening:
                    // Start replying
                    core.stopRecording();
                    if (ns.Config.buttonType == ns.ButtonType.A) {
                        ns.indicatorController.updateAllColor(ns.Config.dialColorUp, 0.1, 0, 'linear');
                        controller.stopGlowLightRotation();
                    }
                    controller.switchToReplying();
                    balloon.show();
                    //setTimeout(() => {
                    //    controller.switchStandbyToPushSpeak();
                    //}, 5000);
                    //break;

            }
        };

        // Attach mouse events
        btn.addEventListener('mouseenter', onMouseEnter);
        btn.addEventListener('mouseleave', onMouseLeave);
        btn.addEventListener('mousedown', onMouseDown);
        btn.addEventListener('mouseup', onMouseUp);

        // Attach equivalent touch events
        btn.addEventListener('touchstart', (event) => {
            event.preventDefault(); // Prevent mouse events
            onMouseDown(); // Call the mousedown handler
        });
        btn.addEventListener('touchend', (event) => {
            event.preventDefault(); // Prevent mouse events
            onMouseUp(); // Call the mouseup handler
        });

        // Optionally handle touchmove or touchcancel if needed
        btn.addEventListener('touchmove', (event) => {
            event.preventDefault(); // You might want to prevent scrolling or other default actions
            // Handle touch move if necessary
        });
        btn.addEventListener('touchcancel', (event) => {
            event.preventDefault(); // Prevent mouse events
            onMouseUp(); // Handle it like a touchend or mouseup
        });

        document.addEventListener(ns.Config.messageReceiveEventName, function(event) {
            const { type, message } = event.detail;
            console.log('new message received:', type, message);
        
            balloon.insertMessage(type, message, core.lang);
        });

        document.addEventListener(ns.Config.endTurnEventName, function(event) {
            console.log('end turn event received');
            controller.switchToPushSpeak();
        });

        document.addEventListener(ns.Config.reachToLimitEventName, function(event) {
            console.log('reach to limit event received');
            controller.switchToStandby();
            core.disconnect();
        })

        document.addEventListener(ns.Config.languageChangeEventName, function(event) {
            const { lang } = event.detail;
            console.log('language change event received:', lang);
            controller.changeLanguage(lang);
            balloon.changeLanguage(lang);
        });

        document.addEventListener(ns.Config.failedToGetTokenEventName, function(event) {
            const { error } = event.detail;
            console.log('failed to get token event received:', error);
            controller.switchToBusy();
        });

        // Handling touch events for touch devices
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevents additional mouse events being fired on touch devices
            console.log('Start button touched - starting opacity sequence');
        });

        btn.addEventListener('touchend', () => {
            console.log('Start button touch ended - stopping opacity sequence');
        });
    }
})(Quantz);