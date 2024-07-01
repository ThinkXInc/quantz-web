const Config = {
    buttonId: 'quantz-button',
    buttonContainerId: 'quantz-button-container',
    buttonControlId: 'quantz-button-control',
    buttonTextContainerId: 'button-text-container',
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
};

let indicatorController = null;
let locale = null;
let balloon = null;
let sign = null;

function setupIndicator() {
    const button = document.getElementById(Config.buttonId);
    const indicator = button.querySelector('.indicator');
    const icon = button.querySelector('.button-icon');
    const radius = Config.diameter / 2;
    const centerX = Config.buttonWidth / 2;
    const centerY = Config.buttonWidth / 2;

    // Scale the icon size relative to the button size (assumed 50px is for 144px button size)
    const iconSize = (Config.buttonWidth / 144) * 50; // Scaling factor for the icon
    icon.style.width = `${iconSize}px`;
    icon.style.height = `${iconSize}px`;

    for (let i = 0; i < Config.N; i++) {
        let dial = document.createElement('div');
        dial.className = `dial dial_${i}`;
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
}

function createDOMElements(config, loaderDiv) {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = Config.buttonContainerId;
    buttonContainer.className = 'button-container';
    loaderDiv.appendChild(buttonContainer);

    if (config.buttonType === ButtonType.A) {
        // Create button
        const button = document.createElement('button');
        button.id = Config.buttonId;
        insertIndicator(button);
        insertGlowlight(button);
        insertIconWrapper(button, config);
        buttonContainer.appendChild(button);

        // Create button control
        const buttonControl = document.createElement('div');
        buttonControl.id = Config.buttonControlId;
        insertSpacer(buttonControl, config);
        insertButtonTextContainer(buttonControl, config);
        buttonContainer.appendChild(buttonControl);
    }

    if (config.buttonType === ButtonType.B) {
        // Create button
        const button = document.createElement('button');
        button.id = Config.buttonId;
        insertIconWrapper(button, config);
        insertButtonTextContainer(button, config);
        buttonContainer.appendChild(button);

        // Create button control
        const buttonControl = document.createElement('div');
        buttonControl.id = Config.buttonControlId;
        insertSpacer(buttonControl, config);
        buttonContainer.appendChild(buttonControl);
    }

    // Apply dynamic styles after creating the button
    applyDynamicStyles(config);
}

function insertIndicator(container, config) {
    const indicator = document.createElement('div');
    indicator.className = 'indicator';
    container.appendChild(indicator);
    return indicator;
}

function insertGlowlight(container, config) {
    const svgHTML = `
        <svg id="glowlight" width="144px" height="144px" viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gradient1" gradientUnits="objectBoundingBox" x1="0" y1="0.5" x2="1" y2="0.5">
                    <stop offset="0%" stop-color="#33D6BB" />
                    <stop offset="33%" stop-color="#33D6BB" />
                    <stop offset="66%" stop-color="#316480" stop-opacity="1" />
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
    iconWrapper.className = 'icon-wrapper';
    const iconImage = document.createElement('img');
    iconImage.src = './images/standby-icon-white.svg';
    iconImage.className = 'button-icon';
    iconImage.alt = 'Button Icon';
    iconWrapper.appendChild(iconImage);
    container.appendChild(iconWrapper);

    return iconWrapper;
}

function insertButtonTextContainer(container, config) {
    const buttonTextContainer = document.createElement('div');
    buttonTextContainer.id = 'button-text-container';
    buttonTextContainer.className = 'button-text-container';
    const buttonText = document.createElement('div');
    buttonText.className = 'button-text';
    buttonText.textContent = 'Connecting...';
    buttonTextContainer.appendChild(buttonText);
    container.appendChild(buttonTextContainer);

    return buttonTextContainer;
}

function insertSpacer(container, config) {
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    container.appendChild(spacer);

    return spacer;
}

function applyDynamicStyles(config) {
    // Customize size and styles based on extracted configurations
    if (Config.buttonType == ButtonType.A) {
        // Set button size based on Config
        const button = document.getElementById(Config.buttonId);
        Config.diameter = Config.buttonWidth * 0.8; // Diameter is 80% of the button size
        button.style.width = `${Config.buttonWidth}px`;
        button.style.height = `${Config.buttonWidth}px`;
        setupIndicator();
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
            fontSize: Config.fontSize,
            displayLocale: Config.displayLocale,
            balloonRectWidth: Config.balloonRectWidth,
            balloonRectHeight: Config.balloonRectHeight
        })
    }
}

function setup() {
    console.log('setup')

    const loaderDiv = document.getElementById('quantz-button-loader');
    if (!loaderDiv) {
        console.error('Quantz button loader div not found');
        return;
    }

    const configScript = document.getElementById('quantz-config-script');
    if (!configScript) {
        console.error('Quantz config script not found');
        return;
    }

    let config;
    try {
        const configString = configScript.getAttribute('data-quantz-config');
        config = JSON.parse(configString);
    } catch (error) {
        console.error('Error parsing quantz config data:', error);
        return;
    }

    // Load CSS dynamically based on the button type
    const cssPath = `./css/quantz-${config.buttonType}-medium.css`;
    loadCSS(cssPath, () => {
        console.log(`[Quantz Button] Loaded CSS: ${cssPath}`);

        setupConfig(config);
        createDOMElements(config, loaderDiv);

        // Initialize components after ensuring CSS is loaded
        locale = new Locale(Config.buttonControlId, Config.buttonContainerId, Config.languages);
        balloon = new Balloon(Config.buttonContainerId);

        // Setup interactions
        const animationController = new AnimationController();
        const controller = new ButtonController(Config.buttonType, animationController, indicatorController);
        const btn = document.getElementById(Config.buttonId);
        setupInteractions(btn, controller);

        // demo
        setTimeout(() => {
            setTimeout(()=>{
                controller.switchToConnected();
            }, 100)
            setTimeout(() => {
                controller.switchStandbyToSpeak();
                controller.updateButtonText('Speak while pushing.')
            }, 1000)
        }, 500);
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
        console.log('Start button pressed - starting opacity sequence');

        if (Config.buttonType == ButtonType.A) {
            controller.rotateGlowLight();
            indicatorController.updateAllColor(Config.dialColorDown, 0.1, 0, 'linear');
        }
        controller.switchToRecording();
    });

    btn.addEventListener('mouseup', () => {
        console.log('Start button released - stopping opacity sequence');
        if (Config.buttonType == ButtonType.A) {
            indicatorController.updateAllColor(Config.dialColorUp, 0.1, 0, 'linear');
            controller.stopGlowLightRotation();
        }
        controller.switchToReplying();
        balloon.show();
        setTimeout(() => {
            controller.switchStandbyToSpeak();
            controller.updateButtonText('Speak while pushing.');
        }, 5000);
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