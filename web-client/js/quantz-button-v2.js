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

function setupConfig(buttonContainer) {
    Config.buttonType = buttonContainer.getAttribute('data-button-type');
    Config.buttonWidth = parseInt(buttonContainer.getAttribute('data-button-width'), 10);
    Config.buttonHeight = parseInt(buttonContainer.getAttribute('data-button-height'), 10);
    Config.iconSize = parseFloat(buttonContainer.getAttribute('data-icon-size'));
    Config.fontSize = parseFloat(buttonContainer.getAttribute('data-font-size'));
    Config.borderRadius = parseInt(buttonContainer.getAttribute('data-border-radius'), 10);
    Config.displayLocale = buttonContainer.getAttribute('data-display-locale') === 'true';
    Config.balloonRectWidth = buttonContainer.getAttribute('data-balloon-rect-width');
    Config.balloonRectHeight = buttonContainer.getAttribute('data-balloon-rect-height');
}

function applyDynamicStyles() {
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
    const buttonContainer = document.getElementById('quantz-button-container');
    const buttonType = buttonContainer.getAttribute('data-button-type');
    const cssPath = `./css/quantz-${buttonType}-medium.css`;

    loadCSS(cssPath, () => {
        console.log('[Launch Script] Base CSS loaded. Proceeding with setup.');

        document.getElementById('quantz-button-container').style.display = 'flex';

        // Extract configuration from data attributes after CSS is loaded
        setupConfig(buttonContainer);

        // Once all configurations are extracted, proceed to apply styles
        applyDynamicStyles();

        // Initialize components after ensuring CSS is loaded
        locale = new Locale(Config.buttonControlId, Config.buttonContainerId, Config.languages);
        balloon = new Balloon(Config.buttonContainerId);
    });
}

/* Setup */

setTimeout(() => {
    setTimeout(()=>{
        controller.switchToConnected();
    }, 100)
    setTimeout(() => {
        controller.switchStandbyToSpeak();
        controller.updateButtonText('Speak while pushing.')
    }, 1000)
}, 500);

document.addEventListener('DOMContentLoaded', setup);

/* Interactions */

const animationController = new AnimationController();
const controller = new ButtonController(Config.buttonType, animationController, indicatorController);
const btn = document.getElementById(Config.buttonId);
const btnContainer = document.getElementById(Config.buttonContainerId);


btn.addEventListener('mouseenter', () => {
    console.log('Start button mouseenter');
});

btn.addEventListener('mouseleave', () => {
    console.log('Start button mouseleave');
})

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
    setTimeout(()=>{
        controller.switchStandbyToSpeak();
        controller.updateButtonText('Speak while pushing.')
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