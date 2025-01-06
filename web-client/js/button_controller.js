(function(ns) {
    ns.IconType = {
        START: 'https://quantz.thinkxinc.com/img/quantz_button/standby-icon-white.svg',
        STANDBY: 'https://quantz.thinkxinc.com/img/quantz_button/standby-icon-white.svg',
        PUSHSPEAK: 'https://quantz.thinkxinc.com/img/quantz_button/push-speak-icon-white.svg',
        RECORDING: 'https://quantz.thinkxinc.com/img/quantz_button/recording-icon-white.svg',
        REPLYING: 'https://quantz.thinkxinc.com/img/quantz_button/replying-icon-white.svg',
        RESTART: '',
        LEAVE: 'https://quantz.thinkxinc.com/img/quantz_button/leave-icon-white.svg',
    };

    ns.ButtonState = {
        start: 'start',
        standby: 'standby',
        connected: 'connected',
        pushSpeak: 'pushSpeak',
        listening: 'listening',
        loading: 'loading',
        replying: 'replying',
        busy: 'busy',
        restart: 'restart',
        leave: 'leave'
    }

    ns.ButtonController = class {
        constructor({buttonId, buttonType, animationController, indicatorController, lang, defaultState = ns.ButtonState.standby}) {
            this.buttonId = buttonId;
            this.buttonType = buttonType;
            this.buttonState = defaultState;
            this.lang = lang;
            this.animationController = animationController;
            this.buttonContainerElement = document.getElementById(ns.configs[buttonId].buttonContainerId);
            this.buttonElement = document.getElementById(ns.configs[buttonId].buttonElementId);
            this.textContainer = document.getElementById(ns.configs[buttonId].buttonTextContainerId);
            this.iconElement = this.buttonElement.querySelector(`.${ns.configs[buttonId].prefix + ns.configs[buttonId].iconImageClassName}`);
            this.buttonControlElement = document.getElementById(`QBTN-button-control-${buttonId}`)
            this.iconWrapperElement = this.buttonElement.querySelector(`.QBTN-icon-wrapper`);
            this.textElement = this.textContainer.querySelector(`.${ns.configs[buttonId].prefix + ns.configs[buttonId].buttonTextClassName}`);

            if (!this.buttonContainerElement) {
                console.error('Button element not found.');
                return;
            }
            if (!this.buttonElement) {
                console.error('Button element not found.');
                return;
            }
            if (!this.textContainer) {
                console.error('Button text container not found.');
            }
            if (!this.iconElement) {
                console.error('Icon element not found.');
            }
            if (!this.textElement) {
                console.error('Text element not found.');
            }
            if (!this.buttonControlElement) {
                console.error('ButtonControl element not found.');
            }
        }

        switchIcon(prevIconType, nextIconType, hideAnimationType, showAnimationType, hideDelay, hideDuration, showDelay, showDuration) {
            console.log(`Switching icon from ${prevIconType} to ${nextIconType}`);
        
            if (!this.iconElement) {
              console.error('Icon element not found.');
              return;
            }
        
            // Hide the current icon with the specified animation and delay/duration
            this.animationController.animate(this.iconElement, hideAnimationType, hideDelay, hideDuration, null, () => {
                // Show the next icon with the specified animation and delay/duration
                this.toggleIconVisibility(false);
                this.animationController.animate(this.iconElement, showAnimationType, showDelay, showDuration, () => {
                    this.animationController.animate(this.iconElement, showAnimationType, showDelay, showDuration, () => {
                        // pre animation
                        this.toggleIconVisibility(true)
                        this.setIcon(nextIconType);
                    }, () => {
                        console.log(`Switched to: ${nextIconType}`);
                    });
                });
            });
        }

        setIcon(iconType) {
            console.log('Set Icon:', iconType);
            if (iconType) {
                this.iconElement.src = iconType;
            } else {
                console.error('Icon type is undefined:', iconType);
            }
        }

        toggleIconVisibility(isVisible) {
            if (!this.iconElement) {
                console.error('Icon element not found.');
                return;
            }
            this.iconElement.style.visibility = isVisible ? 'visible' : 'hidden';
            console.log(`Icon visibility set to: ${isVisible ? 'visible' : 'hidden'}`);
        }

        toggleButtonState(buttonState) {
            // Remove all possible button state classes first
            Object.values(ns.ButtonState).forEach(state => {
                this.buttonElement.classList.remove(ns.configs[this.buttonId].prefix + state);
                this.buttonContainerElement.classList.remove(ns.configs[this.buttonId].prefix + state);
            });

            // Add the new state as a class to the button element
            if (Object.values(ns.ButtonState).includes(buttonState)) {
                this.buttonElement.classList.add(ns.configs[this.buttonId].prefix + buttonState);
                this.buttonContainerElement.classList.add(ns.configs[this.buttonId].prefix + buttonState);
                this.buttonState = buttonState;
                console.log(`Button state changed to "${buttonState}".`);
            } else {
                console.error(`Invalid button state: "${buttonState}".`);
            }
        }

        switchToStart() {
            console.log(`[ButtonController] switch to start.`)
            this.toggleButtonState(ns.ButtonState.start);
            this.updateButtonText('start');
            this.setIcon(ns.IconType.START);
        }

        switchToRestart() {
            console.log(`[ButtonController] switch to restart.`)
            this.toggleButtonState(ns.ButtonState.restart);
            this.updateButtonText('restart');
            this.setIcon(ns.IconType.RESTART);
        }

        switchToStandby() {
            console.log(`[ButtonController] switch to standby.`)
            this.toggleButtonState(ns.ButtonState.standby);
            this.updateButtonText('standby');
            this.setIcon(ns.IconType.STANDBY);
        }

        switchToConnected() {
            console.log(`[ButtonController] switch to connected.`)
            if (ns.configs[this.buttonId].buttonType != ns.ButtonType.Default) {
                this.updateButtonText('connected');
            }
            this.toggleButtonState(ns.ButtonState.connected);
        }

        switchToLeave() {
            console.log(`[ButtonController] switch to leave.`)
            this.toggleButtonState(ns.ButtonState.leave);
            this.updateButtonText('leave');
            this.buttonControlElement.style.display = 'none';
            if (this.buttonElement) {
                this.buttonElement.style.setProperty('width', '145px', 'important');
                this.buttonElement.style.setProperty('background-image', 'linear-gradient(to left, rgb(226, 54, 54), rgb(186, 51, 51))', 'important');
                this.buttonElement.style.setProperty('border-radius', '50px', 'important');
                this.buttonElement.style.setProperty('border', '1px solid rgb(60, 8, 8)', 'important');
                this.iconWrapperElement.style.setProperty('width', '100%', 'important');
            } else {
                console.error('Button element not found for styling.');
            }
            this.setIcon(ns.IconType.LEAVE);
        }

        switchStandbyToPushSpeak() {
            console.log(`[ButtonController] switch standby to pushSpeak.`)
            this.toggleButtonState(ns.ButtonState.pushSpeak);
            this.updateButtonText('pushSpeak');
            this.switchIcon(ns.IconType.STANDBY, ns.IconType.PUSHSPEAK, ns.AnimationType.flipOut, ns.AnimationType.flipIn, 0, 0.3, 0, 0.3);
        }

        switchToRecording() {
            console.log(`[ButtonController] switch to listening.`)
            this.toggleButtonState(ns.ButtonState.listening);
            this.updateButtonText('listening');
            this.setIcon(ns.IconType.RECORDING);
        }

        switchToPushSpeak() {
            console.log(`[ButtonController] switch to pushSpeak.`)
            this.toggleButtonState(ns.ButtonState.pushSpeak);
            this.updateButtonText('pushSpeak');
            this.setIcon(ns.IconType.PUSHSPEAK);
        }

        switchToReplying() {
            console.log(`[ButtonController] switch to replying.`)
            this.toggleButtonState(ns.ButtonState.replying);
            this.updateButtonText('replying');
            this.setIcon(ns.IconType.REPLYING);
        }

        switchToBusy() {
            console.log(`[ButtonController] switch to busy.`)
            this.toggleButtonState(ns.ButtonState.busy);
            this.updateButtonText('busy');
            this.setIcon(ns.IconType.STANDBY);
        }

        switchToLimitReached() {
            console.log(`[ButtonController] switch to reach limit.`)
            this.toggleButtonState(ns.ButtonState.busy);
            this.updateButtonText('limitReached');
            this.setIcon(ns.IconType.STANDBY);
        }

        updateButtonText(key) {
            if (this.textElement) {
                const translation = ns.ButtonTextLocales[this.lang][key];
                this.textElement.textContent = translation || `Text not found by ${key} ${this.lang}`;
            } else {
                console.error(`Text element not found.`);
            }
        }

        changeLanguage(lang) {
            this.lang = lang;
            console.log(`Button text change lang:`, lang, ' with state:', this.buttonState);
            this.updateButtonText(this.buttonState);
        }
    }
})(Quantz); 