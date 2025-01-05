/*
// Usage example
document.addEventListener('DOMContentLoaded', () => {
    const styleGenerator = new StyleGenerator(ButtonType.B);
    styleGenerator.generate({
        iconSize: 50,  // Set the size of icons
        fontSize: 1.4,  // Set the font size for the button text
        buttonWidth: 600,  // Set the width of the button
        buttonHeight: 100,  // Set the height of the button
        borderRadius: 20,  // Set the border radius of the button
        displayLocale: false,  // Control the display of the locale
        balloonRectWidth: '70vw',  // Optionally override the balloon rectangle width
        balloonRectHeight: '45vh'  // Optionally override the balloon rectangle height
    });
});
*/

(function(ns) {
    ns.LayoutSize = {
        small: 'small',
        medium: 'medium',
        large: 'large',
        custom: 'custom'
    };

    ns.StyleGenerator = class {
        constructor({buttonId, buttonType}) {
            this.buttonId = buttonId;

            this.buttonElement = document.getElementById(ns.configs[buttonId].buttonElementId);
            this.buttonContainer = document.getElementById(ns.configs[buttonId].buttonContainerId);
            this.iconElement = this.buttonElement.querySelector(`.${ns.configs[buttonId].prefix + ns.configs[buttonId].iconImageClassName}`);
            this.buttonControlElement = document.getElementById(`QBTN-button-control-${buttonId}`)
            this.iconWrapperElement = this.buttonElement.querySelector(`.QBTN-icon-wrapper`);
            this.selectorButtonType = `#QBTN-button-container-${buttonId}.QBTN-TYPE-${this.buttonType}`;
            this.selectorButtonTypeBalloon = `.QBTN-balloon-container.QBTN-TYPE-${this.buttonType}`;

            this.buttonType = buttonType;
            this.baseCssSelector = `link[href="./css/quantz-${buttonType}-medium.css"]`

            this.defaultValues = {
                buttonPaddingLeft: 10,
                buttonPaddingRight: 10,
                iconWidth: 30,
                localeButtonWidth: 29,
                buttonControlMarginLeft: 8,
                balloonRectWidth: '64vw',
                balloonRectHeight: '40vh',
            };
            console.log('[StyleGenerator] Initialized with default values:', this.defaultValues);
        }

        applyDynamicStyles(config) {
            const link = document.querySelector(this.baseCssSelector);
        
            const isCssLoaded = link => link.sheet;
        
            if (link) {
                if (isCssLoaded(link)) {
                    console.log(`[StyleGenerator] Base CSS ${this.baseCssSelector} already loaded. Applying dynamic styles immediately.`);
                    this.generate(config);
                } else {
                    link.addEventListener('load', () => {
                        console.log('[StyleGenerator] Base CSS loaded after adding listener. Applying dynamic styles.');
                        this.generate(config);
                    });
                }
            } else {
                console.error('[StyleGenerator] Base CSS link not found. Dynamic styles might not apply correctly.');
            }
        }

        generate(config) {
            console.log('[StyleGenerator] Generating styles with configuration:', config);
        
            if (this.buttonType == ns.ButtonType.A) {
                if (config.fontSize !== undefined) {
                    this.applyFontSize(config.fontSize);
                }
                if (config.buttonWidth !== undefined) {
                    this.applyBalloonPosition(config.buttonWidth);
                    this.applyGlowLightSize(config.buttonWidth);
                }
                if (config.balloonRectWidth !== undefined && config.balloonRectHeight !== undefined) {
                    this.applyBalloonRectSize(config.balloonRectWidth, config.balloonRectHeight);
                }
                if (config.displayLocale !== undefined) {
                    this.toggleLocaleDisplay(config.displayLocale);
                }
            }
        
            if (this.buttonType == ns.ButtonType.B || this.buttonType == ns.ButtonType.C) {
                if (config.iconSize !== undefined) {
                    this.applyIconSize(config.iconSize);
                }
                if (config.buttonWidth !== undefined && config.buttonHeight !== undefined) {
                    this.applyButtonSize(config.buttonWidth, config.buttonHeight);
                }
                if (config.buttonColor !== undefined) {
                    this.applyButtonColor(config.buttonColor);
                }
                if (config.borderRadius !== undefined) {
                    this.applyBorderRadius(config.borderRadius);
                }
                if (config.buttonHeight !== undefined) {
                    this.applyBalloonPosition(config.buttonHeight);
                }
                if (config.balloonRectWidth !== undefined && config.balloonRectHeight !== undefined) {
                    this.applyBalloonRectSize(config.balloonRectWidth, config.balloonRectHeight);
                }
                if (config.displayLocale !== undefined) {
                    this.toggleLocaleDisplay(config.displayLocale);
                }
            }
        }

        calculateButtonSize(width, height) {
            const totalPaddingAndMargins = this.defaultValues.localeButtonWidth + this.defaultValues.buttonControlMarginLeft;
            const buttonWidth = width - totalPaddingAndMargins;

            const sizeInfo = {
                buttonWidth: buttonWidth > 0 ? buttonWidth : null,
                buttonContainerWidth: width,
            };

            console.log('[StyleGenerator] Calculated button size:', sizeInfo);
            return sizeInfo;
        }

        applyButtonSize(width, height) {
            const sizes = this.calculateButtonSize(width, height);
            if (sizes.buttonWidth && sizes.buttonTextWidth) {
                if (this.buttonElement) {
                    this.buttonElement.style.width = `${sizes.buttonWidth}px`;
                    this.buttonElement.style.height = `${height}px`;
                } else {
                    console.error('[applyButtonSize] No buttonElement with id:', ns.configs[this.buttonId].buttonElementId)
                }
        
                if (this.buttonContainer) {
                    this.buttonContainer.style.width = `${sizes.buttonContainerWidth}px`;
                } else {
                    console.error('[applyButtonSize] No buttonContainer with id:', ns.configs[this.buttonId].buttonContainerId )
                }
        
                console.log('[StyleGenerator] Applied button size via inline styles.');
            } else {
                console.error('[StyleGenerator] Calculated button or text width is non-positive. Check input width and existing paddings/margins.');
            }
        }

        generateButtonColorCode(mainColorHex) {
            function adjustColor(color, amount) {
                return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
            }
        
            const lighterColor = adjustColor(mainColorHex, 40); // Lighten the main color for gradient start
            const darkerColor = mainColorHex; // Main color for gradient end
            const borderColor = adjustColor(mainColorHex, -20); // Darken the main color for the border
        
            return {
                backgroundImage: `linear-gradient(to left, ${lighterColor}, ${darkerColor})`,
                border: `1px solid ${borderColor}`
            };
        }

        applyButtonColor(mainColorHex) {
            const { backgroundImage, border } = this.generateButtonColorCode(mainColorHex);
        
            if (this.buttonElement) {
                this.buttonElement.style.backgroundImage = backgroundImage;
                this.buttonElement.style.border = border;
                console.log(`[StyleGenerator] Applied button color via inline styles.`);
            } else {
                console.error('[applyButtonColor] No buttonElement with id:', ns.configs[this.buttonId].buttonElementId);
            }
        }

        calculateBalloonPosition(buttonHeight) {
            const offset = 12;
            const balloonTop = buttonHeight + offset; // 12px offset from the button's bottom
            console.log(`[StyleGenerator] Calculated balloon position: ${balloonTop}px from buttonHeight ${buttonHeight} + offset ${offset}.`);
            return balloonTop;
        }

        applyBalloonPosition(buttonHeight) {
            const balloonTop = this.calculateBalloonPosition(buttonHeight);
            this.balloonElement = document.getElementById(ns.configs[this.buttonId].balloonId);
 
            if (this.balloonElement) {
                this.balloonElement.style.top = `${balloonTop}px`;
                console.log('[StyleGenerator] Applied balloon position via inline styles.');
            } else {
                console.error('[applyBalloonPosition] No balloonElement with id:', ns.configs[this.buttonId].balloonId);
            }
        }

        applyIconSize(iconSize) {
            if (this.iconWrapperElement && this.iconElement) {
                this.iconWrapperElement.style.width = `${iconSize}px`;
                this.iconWrapperElement.style.height = `${iconSize}px`;
                this.iconElement.style.width = `${iconSize}px`;
                this.iconElement.style.height = `${iconSize}px`;
                console.log(`[StyleGenerator] Applied icon size via inline styles.`);
            } else {
                if (!this.iconWrapperElement) console.error('[applyIconSize] No iconWrapperElement found.');
                if (!this.iconElement) console.error('[applyIconSize] No iconElement found.');
            }
        }

        applyBorderRadius(radius) {
            if (this.buttonElement) {
                this.buttonElement.style.borderRadius = `${radius}px`;
                console.log(`[StyleGenerator] Applied border radius via inline styles.`);
            } else {
                console.error('[applyBorderRadius] No buttonElement with id:', ns.configs[this.buttonId].buttonElementId);
            }
        }

        applyBalloonRectSize(balloonRectWidth, balloonRectHeight) {
            const width = balloonRectWidth || this.defaultValues.balloonRectWidth;
            const height = balloonRectHeight || this.defaultValues.balloonRectHeight;

            this.balloonElement = document.getElementById(ns.configs[this.buttonId].balloonId);
            this.balloonRectElement = this.balloonElement.querySelector(`.${ns.configs[this.buttonId].prefix}balloon-rect`);
 
            if (this.balloonRectElement) {
                this.balloonRectElement.style.width = `${width}`;
                this.balloonRectElement.style.height = `${height}`;
                console.log(`[StyleGenerator] Applied balloon rectangle size via inline styles.`);
            } else {
                console.error('[applyBalloonRectSize] No balloonRectElement found.');
            }
        }

        toggleLocaleDisplay(display) {
            this.localeElements = this.buttonControlElement.querySelectorAll(`.${ns.configs[this.buttonId].prefix}locale`);
            if (this.localeElements && this.localeElements.length > 0) {
                if (this.buttonType == ns.ButtonType.B) {
                    const displayValue = display ? 'flex' : 'none';
                    this.localeElements.forEach(element => {
                        element.style.display = displayValue;
                    });
                }
                if (this.buttonType == ns.ButtonType.A) {
                    const visibilityValue = display ? 'visible' : 'hidden';
                    this.localeElements.forEach(element => {
                        element.style.visibility = visibilityValue;
                    });
                }
                console.log(`[StyleGenerator] Toggled locale display via inline styles.`);
            } else {
                console.error('[toggleLocaleDisplay] No localeElements found.');
            }
        }
    }
})(Quantz); 