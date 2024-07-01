(function(ns) {
    ns.IconType = {
        STANDBY: 'https://quantz.thinkxinc.com/img/quantz_button/standby-icon-white.svg',
        PUSHSPEAK: 'https://quantz.thinkxinc.com/img/quantz_button/push-speak-icon-white.svg',
        RECORDING: 'https://quantz.thinkxinc.com/img/quantz_button/recording-icon-white.svg',
        REPLYING: 'https://quantz.thinkxinc.com/img/quantz_button/replying-icon-white.svg',
    };

    ns.ButtonState = {
        standby: 'standby',
        connected: 'connected',
        pushSpeak: 'pushSpeak',
        listening: 'listening',
        loading: 'loading',
        replying: 'replying',
        busy: 'busy',
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
            this.sign = new ns.Sign({
                buttonId: buttonId,
                containerId: ns.configs[buttonId].buttonTextContainerId,
                signType: ns.SignType.busy}); 
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

        switchToStandby() {
            this.toggleButtonState(ns.ButtonState.standby);
            this.updateButtonText('standby');
            this.sign.changeTo(ns.SignType.standby);
        }

        switchToConnected() {
            this.toggleButtonState(ns.ButtonState.connected);
            this.updateButtonText('connected');
            this.sign.changeTo(ns.SignType.active);
        }

        switchStandbyToPushSpeak() {
            this.toggleButtonState(ns.ButtonState.pushSpeak);
            this.switchIcon(ns.IconType.STANDBY, ns.IconType.PUSHSPEAK, ns.AnimationType.flipOut, ns.AnimationType.flipIn, 0, 0.3, 0, 0.3);
            this.updateButtonText('pushSpeak');
        }

        switchToRecording() {
            this.toggleButtonState(ns.ButtonState.listening);
            this.setIcon(ns.IconType.RECORDING);
            this.updateButtonText('listening');
        }

        switchToPushSpeak() {
            this.toggleButtonState(ns.ButtonState.pushSpeak);
            this.setIcon(ns.IconType.PUSHSPEAK);
            this.updateButtonText('pushSpeak');
        }

        switchToReplying() {
            this.toggleButtonState(ns.ButtonState.replying);
            this.setIcon(ns.IconType.REPLYING);
            this.updateButtonText('replying');
        }

        switchToBusy() {
            this.toggleButtonState(ns.ButtonState.busy);
            this.setIcon(ns.IconType.STANDBY);
            this.updateButtonText('busy');
            this.sign.changeTo(ns.SignType.busy);
        }

        switchToLimitReached() {
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