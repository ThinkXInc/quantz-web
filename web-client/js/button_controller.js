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
            this.buttonElement = document.getElementById(ns.configs[buttonId].buttonElementId);
            this.iconElement = this.buttonElement.querySelector(`.${ns.configs[buttonId].prefix + ns.configs[buttonId].iconImageClassName}`);
            this.textContainer = document.getElementById(ns.configs[buttonId].buttonTextContainerId);
            this.buttonControlElement = document.getElementById(`QBTN-button-control-${buttonId}`)
            this.sign = new ns.Sign({
                buttonId: buttonId,
                containerId: ns.configs[buttonId].buttonTextContainerId,
                signType: ns.SignType.busy}); 
            this.signElement = this.buttonElement.querySelector(`.QBTN-sign`);
            this.iconWrapperElement = this.buttonElement.querySelector(`.QBTN-icon-wrapper`);
            this.textElement = this.textContainer.querySelector(`.${ns.configs[buttonId].prefix + ns.configs[buttonId].buttonTextClassName}`);

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

            if (buttonType == ns.ButtonType.A) {
                this.indicatorController = indicatorController;
                this.glowLight = document.getElementById(ns.configs[buttonId].glowLightId);
                this.isGlowLightRotating = false;
                if (!this.glowLight) {
                    console.error('Glow light element not found.');
                }
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
            });

            // Add the new state as a class to the button element
            if (Object.values(ns.ButtonState).includes(buttonState)) {
                this.buttonElement.classList.add(ns.configs[this.buttonId].prefix + buttonState);
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
            this.sign.changeTo(ns.SignType.start);
        }

        switchToRestart() {
            console.log(`[ButtonController] switch to restart.`)
            this.toggleButtonState(ns.ButtonState.restart);
            this.updateButtonText('restart');
            this.setIcon(ns.IconType.RESTART);
            this.sign.changeTo(ns.SignType.restart);
        }

        switchToStandby() {
            console.log(`[ButtonController] switch to standby.`)
            this.toggleButtonState(ns.ButtonState.standby);
            this.updateButtonText('standby');
            this.setIcon(ns.IconType.STANDBY);
            this.sign.changeTo(ns.SignType.standby);
        }

        switchToConnected() {
            console.log(`[ButtonController] switch to connected.`)
            this.toggleButtonState(ns.ButtonState.connected);
            this.updateButtonText('connected');
            this.sign.changeTo(ns.SignType.active);
        }

        switchToLeave() {
            console.log(`[ButtonController] switch to leave.`)
            this.toggleButtonState(ns.ButtonState.leave);
            this.updateButtonText('leave');
            this.buttonControlElement.style.display = 'none';
            this.signElement.style.display = 'none';
            //this.textElement.style.setProperty('width', 'max-content', 'important');
            this.textElement.style.display = 'none';
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
            this.sign.changeTo(ns.SignType.leave);
        }

        switchStandbyToPushSpeak() {
            console.log(`[ButtonController] switch standby to pushSpeak.`)
            this.toggleButtonState(ns.ButtonState.pushSpeak);
            this.switchIcon(ns.IconType.STANDBY, ns.IconType.PUSHSPEAK, ns.AnimationType.flipOut, ns.AnimationType.flipIn, 0, 0.3, 0, 0.3);
            this.updateButtonText('pushSpeak');
        }

        switchToRecording() {
            console.log(`[ButtonController] switch to listening.`)
            this.toggleButtonState(ns.ButtonState.listening);
            this.setIcon(ns.IconType.RECORDING);
            this.updateButtonText('listening');
        }

        switchToPushSpeak() {
            console.log(`[ButtonController] switch to pushSpeak.`)
            this.toggleButtonState(ns.ButtonState.pushSpeak);
            this.setIcon(ns.IconType.PUSHSPEAK);
            this.updateButtonText('pushSpeak');
        }

        switchToReplying() {
            console.log(`[ButtonController] switch to replying.`)
            this.toggleButtonState(ns.ButtonState.replying);
            this.setIcon(ns.IconType.REPLYING);
            this.updateButtonText('replying');
        }

        switchToBusy() {
            console.log(`[ButtonController] switch to busy.`)
            this.toggleButtonState(ns.ButtonState.busy);
            this.setIcon(ns.IconType.STANDBY);
            this.updateButtonText('busy');
            this.sign.changeTo(ns.SignType.busy);
        }

        switchToLimitReached() {
            console.log(`[ButtonController] switch to reach limit.`)
            this.toggleButtonState(ns.ButtonState.busy);
            this.setIcon(ns.IconType.STANDBY);
            this.updateButtonText('limitReached');
            this.sign.changeTo(ns.SignType.busy);
        }

        updateButtonText(key) {
            if (this.textElement) {
                const translation = ns.ButtonTextLocales[this.lang][key];
                this.textElement.textContent = translation || `Text not found by ${key} ${this.lang}`;
            } else {
                console.error(`Text element not found.`);
            }
        }

        isGlowLightVisible(visible) {
            if (!this.glowLight) {
                console.error('Glow light element not found.');
                return;
            }
            this.glowLight.style.opacity = visible ? '1' : '0';
        }

        rotateGlowLight() {
            this.isGlowLightVisible(true);

            const _this = this;
            function extendLineGradient() {
                const stops = _this.glowLight.querySelectorAll('#gradient1 stop');
            
                // Define the initial and final stop offsets and opacities for the short and middle states
                const initialStops = [
                    { offset: '0%', opacity: '1' },
                    { offset: '2%', opacity: '1' },
                    { offset: '10%', opacity: '1' },
                    { offset: '20%', opacity: '0' }
                ];
            
                const finalStops = [
                    { offset: '0%', opacity: '1' },
                    { offset: '34%', opacity: '1' },
                    { offset: '67%', opacity: '1' },
                    { offset: '100%', opacity: '0' }
                ];
            
                // A simple linear interpolation for the gradient stops' transition
                const interpolate = (start, end, progress) => start + (end - start) * progress;
            
                const animateStops = (progress) => {
                    stops.forEach((stop, index) => {
                        stop.setAttribute('offset', interpolate(parseFloat(initialStops[index].offset), parseFloat(finalStops[index].offset), progress) + '%');
                        stop.setAttribute('stop-opacity', interpolate(parseFloat(initialStops[index].opacity), parseFloat(finalStops[index].opacity), progress).toString());
                    });
                };
            
                // Assume this animation function gets called over 0.5s
                let progress = 0;
                const animationDuration = 50; // in ms
                const step = () => {
                    progress += 10 / animationDuration; // increment based on a 10ms interval
                    animateStops(progress);
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    }
                };
                step();
            }

            if (!this.isGlowLightRotating) {
                extendLineGradient();

                if (this.glowLight) {
                    this.glowLight.classList.add(ns.configs[_this.buttonId].prefix + 'rotating-svg');
                    this.isGlowLightRotating = true;
                } else {
                    console.error('Glow light element not found.');
                }
            }
        }

        stopGlowLightRotation() {
            // Remove the rotating animation class
            if (this.glowLight) {
                this.glowLight.classList.remove(ns.configs[this.buttonId].prefix + 'rotating-svg');
                this.isGlowLightVisible(false);
                this.isGlowLightRotating = false;
            } else {
                console.error('Glow light element not found.');
            }
        }

        changeLanguage(lang) {
            this.lang = lang;
            if (Object.values(ButtonState).includes(this.buttonState)) {
                console.log(`Button text change lang:`, lang);
                this.updateButtonText(this.buttonState);
            } else {
                console.error(`Invalid button state: "${buttonState}".`);
            }
        }

        lightDownIndicator() {
            // TODO:
        }

        stopIndicator() {
            // TODO:
        }

        trigerIndicator() {
            // TODO:
        }
    }
})(Quantz); 