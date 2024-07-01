const Config = {
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
    defaultIconImgSrc: './images/standby-icon-white.svg',
    iconImageClassName: 'button-icon',
    spacerClassName: 'spacer',
    balloonId: 'quantz-balloon',
    balloonDialogueId: 'dialogue',
    balloonPowerdByImageSrc: './images/powerdby.svg',
    N: 40, // Number of lines
    dialLength: 4, // Length of each dial
    dialColorUp: '#2F7A7C',//'#334d4e',//'#2F7A7C', // dial color
    dialColorDown: '#205354',//'#334d4e',//'#2F7A7C', // dial color
    dialThickness: '1px', // dial thickness
    animationDuration: 0.3,
    animationDelay: 0,
    animationCurve: 'cubic-bezier(.65,0,.34,1)',
    languages: [
        new Language("English", LanguageCode.en),
        new Language("日本語", LanguageCode.ja)
    ],
    messageReceiveEventName: 'quantz-messageReceived',
    endTurnEventName: 'quantz-endTurn',
    reachToLimitEventName: 'quantz-reachToLimit',
    languageChangeEventName: 'quantz-languageChange',
    failedToGetTokenEventName: 'quantz-failedToGetToken'
};

let indicatorController = null;
let locale = null;
let balloon = null;
let sign = null;
let core = null;

function setupIndicator(button, buttonWidth) {
    const indicator = button.querySelector(`.${Config.prefix}indicator`);
    const icon = button.querySelector(`.${Config.prefix}button-icon`);
    const diameter = parseFloat(buttonWidth) * Config.indicatorDiameterRate; // Diameter is 80% of the button size
    const radius = diameter / 2;
    const centerX = parseFloat(buttonWidth) / 2;
    const centerY = parseFloat(buttonWidth) / 2;

    // Scale the icon size relative to the button size (assumed 50px is for 144px button size)
    const iconSize = (buttonWidth / 144) * 50; // Scaling factor for the icon
    icon.style.width = `${iconSize}px`;
    icon.style.height = `${iconSize}px`;

    for (let i = 0; i < Config.N; i++) {
        let dial = document.createElement('div');
        dial.className = `${Config.prefix}dial ${Config.prefix}dial_${i}`;
        dial.style.position = 'absolute';
        dial.style.width = `${Config.dialLength}px`;
        dial.style.height = Config.dialThickness;
        dial.style.backgroundColor = Config.dialColor;
        dial.style.borderRadius = '1px';

        const angle = (i / Config.N) * 2 * Math.PI - Math.PI / 2;
        const dialX = centerX + radius * Math.cos(angle) - (Config.dialLength / 2);
        const dialY = centerY + radius * Math.sin(angle) - (parseFloat(Config.dialThickness) / 2);

        dial.style.left = `${dialX}px`;
        dial.style.top = `${dialY}px`;
        dial.style.transform = `rotate(${i * (360 / Config.N) + 90}deg)`;
        dial.style.transformOrigin = `${Config.dialLength / 2}px 1px`;

        indicator.appendChild(dial);
    }

    // Now that all dials are created and added to the DOM, instantiate the IndicatorController
    indicatorController = new IndicatorController(indicator);

}

function loadCSS(href, callback) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => callback();
    document.head.appendChild(link);
}

function setupConfig(config) {
    Config.buttonType = config.buttonType;
    Config.buttonWidth = config.buttonWidth;
    Config.buttonHeight = config.buttonHeight;
    Config.iconSize = config.iconSize;
    Config.fontSize = config.fontSize;
    Config.borderRadius = config.borderRadius;
    Config.displayLocale = config.displayLocale;
    Config.balloonRectWidth = config.balloonRectWidth;
    Config.balloonRectHeight = config.balloonRectHeight;
    Config.defaultLang = config.defaultLang;
}

function createDOMElements(config, loaderDiv) {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = Config.prefix + Config.buttonContainerId;
    buttonContainer.className = `${Config.prefix}${Config.buttonContainerClassName}`;
    loaderDiv.appendChild(buttonContainer);

    if (config.buttonType === ButtonType.A) {
        // Create button
        const button = document.createElement('button');
        button.id = Config.prefix + Config.buttonId;
        insertIndicator(button);
        insertGlowlight(button);
        insertIconWrapper(button, config);
        buttonContainer.appendChild(button);

        // Create button control
        const buttonControl = document.createElement('div');
        buttonControl.id = Config.prefix + Config.buttonControlId;
        insertSpacer(buttonControl, config);
        insertButtonTextContainer(buttonControl, config);
        buttonContainer.appendChild(buttonControl);
    }

    if (config.buttonType === ButtonType.B) {
        // Create button
        const button = document.createElement('button');
        button.id = Config.prefix + Config.buttonId;
        insertButtonTextContainer(button, config);
        insertIconWrapper(button, config);
        buttonContainer.appendChild(button);

        // Create button control
        const buttonControl = document.createElement('div');
        buttonControl.id = Config.prefix + Config.buttonControlId;
        insertSpacer(buttonControl, config);
        buttonContainer.appendChild(buttonControl);
    }

    // Apply dynamic styles after creating the button
    applyDynamicStyles(config);
}

function insertIndicator(container, config) {
    const indicator = document.createElement('div');
    indicator.className = Config.prefix + Config.indicatorClassName;
    container.appendChild(indicator);
    return indicator;
}

function insertGlowlight(container, config) {
    const svgHTML = `
        <svg id="${Config.prefix}${Config.glowLightId}" width="144px" height="144px" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
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

function insertIconWrapper(container, config) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = Config.prefix + Config.iconWrapperClassName;
    const iconImage = document.createElement('img');
    iconImage.src = Config.defaultIconImgSrc;
    iconImage.className = Config.prefix + Config.iconImageClassName;
    iconImage.alt = 'Button Icon';
    iconWrapper.appendChild(iconImage);
    container.appendChild(iconWrapper);

    return iconWrapper;
}

function insertButtonTextContainer(container, config) {
    const buttonTextContainer = document.createElement('div');
    buttonTextContainer.id = Config.prefix + Config.buttonTextContainerId;
    buttonTextContainer.className = Config.prefix + Config.buttonTextContainerClassName;
    const buttonText = document.createElement('div');
    buttonText.className = Config.prefix + Config.buttonTextClassName;
    buttonText.textContent = Config.defaultButtonTextContent;
    buttonTextContainer.appendChild(buttonText);
    container.appendChild(buttonTextContainer);

    return buttonTextContainer;
}

function insertSpacer(container, config) {
    const spacer = document.createElement('div');
    spacer.className = Config.prefix + Config.spacerClassName;
    container.appendChild(spacer);

    return spacer;
}

function applyDynamicStyles(config) {
    const button = document.getElementById(Config.prefix + Config.buttonId);
    if (!button) {
        console.error(`Button element not found by ID: ${Config.prefix + Config.buttonId}`);
        return;
    }
    const computedStyle = window.getComputedStyle(button);
    Config.buttonWidth = config.buttonWidth ? config.buttonWidth : parseInt(computedStyle.width, 10);
    console.log(`Computed button width: ${Config.buttonWidth}`);

    // Customize size and styles based on extracted configurations
    if (Config.buttonType == ButtonType.A) {
        button.style.width = `${Config.buttonWidth}px`;
        button.style.height = `${Config.buttonWidth}px`;
        setupIndicator(button, Config.buttonWidth);
    }

    // Customize size
    const styleGenerator = new StyleGenerator(Config.buttonType);
    if (Config.buttonType == ButtonType.B) {
        styleGenerator.generate({
            iconSize: Config.iconSize,
            fontSize: Config.fontSize,
            buttonWidth: Config.buttonWidth,
            buttonHeight: Config.buttonHeight,
            borderRadius: Config.borderRadius,
            displayLocale: Config.displayLocale,
            balloonRectWidth: Config.balloonRectWidth,
            balloonRectHeight: Config.balloonRectHeight
        });
    }
    if (Config.buttonType == ButtonType.A) {
        styleGenerator.generate({
            // buttonWidth has already been applied
            buttonWidth: Config.buttonWidth,
            fontSize: Config.fontSize,
            displayLocale: Config.displayLocale,
            balloonRectWidth: Config.balloonRectWidth,
            balloonRectHeight: Config.balloonRectHeight
        })
    }
}

function setup() {
    console.log('setup')
    const selector = `.${Config.prefix}${Config.buttonLoaderClassName}`;
    const quantsButtonElements = document.querySelectorAll(selector);
    console.log(`${quantsButtonElements.length} quantz button found for selector '${selector}'`);
    quantsButtonElements.forEach(loaderDiv => {
        let config;
        try {
            console.log('try parsing config attributes from data-quantz-config')
            const configString = loaderDiv.getAttribute('data-quantz-config');
            config = JSON.parse(configString);
            console.log(`parsed button config: ${config}`)
        } catch (error) {
            console.error('Error parsing quantz config data:', error);
            return;
        }

        // Load CSS dynamically based on the button type
        const cssPath = `./css/quantz-${config.buttonType}-medium.css`;
        console.log(`try loading css from the path: ${cssPath}`)
        loadCSS(cssPath, () => {
            console.log(`[Quantz Button] Loaded CSS: ${cssPath}`);
            setupConfig(config);
            createDOMElements(config, loaderDiv);

            // Initialize components after ensuring CSS is loaded
            locale = new Locale(Config.buttonControlId, loaderDiv.id, Config.languages, Config.defaultLang);
            balloon = new Balloon(loaderDiv.id, Config.defaultLang);

            // Setup interactions for this button instance
            const animationController = new AnimationController();
            const controller = new ButtonController(Config.buttonType, animationController, indicatorController, locale.lang);
            const btn = loaderDiv.querySelector(`#${Config.prefix + Config.buttonId}`);
            controller.switchToStandby();
            setupInteractions(btn, controller);

            // Setup core engine
            core = new Core(config.defaultLang);
        });
    });
}


document.addEventListener('DOMContentLoaded', setup);

/* Interactions */

function setupInteractions(btn, controller) {
    btn.addEventListener('mouseenter', () => {
        console.log('Start button mouseenter');
    });

    btn.addEventListener('mouseleave', () => {
        console.log('Start button mouseleave');
    });

    btn.addEventListener('mousedown', () => {
        console.log(`Button pressed - buttonState ${controller.buttonState}`);

        switch (controller.buttonState) {
            case ButtonState.standby:
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
    
            case ButtonState.pushSpeak:
                // Speak
                if (Config.buttonType == ButtonType.A) {
                    controller.rotateGlowLight();
                    indicatorController.updateAllColor(Config.dialColorDown, 0.1, 0, 'linear');
                }
                controller.switchToRecording(); // Switch to the recording state
                core.startRecording();
                break;
        }
    });

    btn.addEventListener('mouseup', () => {
        console.log(`Button released - buttonState ${controller.buttonState}`);
        switch (controller.buttonState) {
            case ButtonState.standby:
                break;
 
            case ButtonState.listening:
                // Start replying
                core.stopRecording();
                if (Config.buttonType == ButtonType.A) {
                    indicatorController.updateAllColor(Config.dialColorUp, 0.1, 0, 'linear');
                    controller.stopGlowLightRotation();
                }
                controller.switchToReplying();
                balloon.show();
                //setTimeout(() => {
                //    controller.switchStandbyToPushSpeak();
                //}, 5000);
                //break;

        }
    });

    document.addEventListener(Config.messageReceiveEventName, function(event) {
        const { type, message } = event.detail;
        console.log('new message received:', type, message);
    
        balloon.insertMessage(type, message, core.lang);
    });

    document.addEventListener(Config.endTurnEventName, function(event) {
        console.log('end turn event received');
        controller.switchToPushSpeak();
    });

    document.addEventListener(Config.reachToLimitEventName, function(event) {
        console.log('reach to limit event received');
        controller.switchToStandby();
        core.disconnect();
    })

    document.addEventListener(Config.languageChangeEventName, function(event) {
        const { lang } = event.detail;
        console.log('language change event received:', lang);
        controller.changeLanguage(lang);
        balloon.changeLanguage(lang);
    });

    document.addEventListener(Config.failedToGetTokenEventName, function(event) {
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