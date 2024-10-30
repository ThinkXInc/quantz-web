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
    ns.ButtonType = {
        A: 'A',
        B: 'B',
        C: 'C',
    }

    ns.LayoutSize = {
        small: 'small',
        medium: 'medium',
        large: 'large',
        custom: 'custom'
    };

    ns.StyleGenerator = class {
        constructor({buttonId, buttonType}) {
            this.buttonId = buttonId;
            this.buttonType = buttonType;
            this.selectorButtonType = `#QBTN-button-container-${buttonId}.QBTN-TYPE-${this.buttonType}`;
            this.selectorButtonTypeBalloon = `.QBTN-balloon-container.QBTN-TYPE-${this.buttonType}`;
            this.baseCssSelector = `link[href="./css/quantz-${buttonType}-medium.css"]`
            // this.baseCssPath = './css/';
            this.styleElement = this.createStyleElement();
            this.defaultValues = {
                buttonPaddingLeft: 10,
                buttonPaddingRight: 10,
                iconWidth: 30,
                signWidth: 10,
                signMarginRight: 5,
                localeButtonWidth: 29,
                buttonControlMarginLeft: 8,
                balloonRectWidth: '64vw',
                balloonRectHeight: '40vh',
            };
            console.log('[StyleGenerator] Initialized with default values:', this.defaultValues);
        }

        createStyleElement() {
            const style = document.createElement('style');
            document.head.appendChild(style);
            console.log('[StyleGenerator] Style element created and appended to the head.');
            return style;
        }

        injectBaseCssLink() {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.baseCssPath;
            document.head.insertBefore(link, document.head.firstChild);
            console.log(`[StyleGenerator] Base CSS injected: ${link.href}`);
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
        //loadBaseCss(buttonType, layoutSize) {
        //    const link = document.createElement('link');
        //    link.rel = 'stylesheet';
        //    link.href = `${this.baseCssPath}quantz-${buttonType}-${layoutSize}.css`;
        //    document.head.appendChild(link);
        //    console.log(`[StyleGenerator] Base CSS loaded: ${link.href}`);
        //}

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
                if (config.fontSize !== undefined) {
                    this.applyFontSize(config.fontSize);
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
            const buttonTextWidth = buttonWidth - this.defaultValues.buttonPaddingLeft - this.defaultValues.buttonPaddingRight - this.defaultValues.iconWidth - this.defaultValues.signWidth - this.defaultValues.signMarginRight;

            const sizeInfo = {
                buttonWidth: buttonWidth > 0 ? buttonWidth : null,
                buttonContainerWidth: width,
                buttonTextWidth: buttonTextWidth > 0 ? buttonTextWidth : null,
            };

            console.log('[StyleGenerator] Calculated button size:', sizeInfo);
            return sizeInfo;
        }

        applyButtonSize(width, height) {
            const sizes = this.calculateButtonSize(width, height);
            if (sizes.buttonWidth && sizes.buttonTextWidth) {
                this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonElementId} { width: ${sizes.buttonWidth}px !important; height: ${height}px !important; }`);
                this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonContainerId} { width: ${sizes.buttonContainerWidth}px !important; }`);
                this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonElementId} .${ns.configs[this.buttonId].prefix}button-text { width: ${sizes.buttonTextWidth}px !important; }`);
                console.log('[StyleGenerator] Applied button size rules.');
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
            this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonElementId} { background-image: ${backgroundImage} !important; border: ${border} !important; }`);
            console.log(`[StyleGenerator] Applied button color styles: background image and border.`);
        }

        calculateBalloonPosition(buttonHeight) {
            const offset = 12;
            const balloonTop = buttonHeight + offset; // 12px offset from the button's bottom
            console.log(`[StyleGenerator] Calculated balloon position: ${balloonTop}px from buttonHeight ${buttonHeight} + offset ${offset}.`);
            return balloonTop;
        }

        applyBalloonPosition(buttonHeight) {
            const balloonTop = this.calculateBalloonPosition(buttonHeight);
            this.insertRule(`#${ns.configs[this.buttonId].balloonId} { top: ${balloonTop}px !important; }`);
            console.log('[StyleGenerator] Applied balloon position rule.');
        }

        applyIconSize(iconSize) {
            this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonElementId} .${ns.configs[this.buttonId].prefix}icon-wrapper, ${this.selectorButtonType} .${ns.configs[this.buttonId].prefix}icon-wrapper img { width: ${iconSize}px !important; height: ${iconSize}px !important; }`);
            console.log(`[StyleGenerator] Applied icon size: ${iconSize}px.`);
        }

        applyGlowLightSize(buttonWidth) {
            const glowLightWidth = parseFloat(buttonWidth) * 0.7;
            this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].glowLightId} { width: ${glowLightWidth}px !important; height: ${glowLightWidth}px !important; }`);
        }

        applyFontSize(fontSize) {
            this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonElementId} .${ns.configs[this.buttonId].prefix}button-text { font-size: ${fontSize}px !important; }`);

            const signSize = fontSize * this.defaultValues.signWidth;
            this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonElementId} .${ns.configs[this.buttonId].prefix}button-text-container .sign { width: ${signSize}px !important; height: ${signSize}px !important; }`);

            console.log(`[StyleGenerator] Applied font size: ${fontSize}px sign size ${signSize}.`);
        }

        applyBorderRadius(radius) {
            this.insertRule(`${this.selectorButtonType} #${ns.configs[this.buttonId].buttonElementId} { border-radius: ${radius}px !important; }`);
            console.log(`[StyleGenerator] Applied border radius: ${radius}px.`);
        }

        applyBalloonRectSize(balloonRectWidth, balloonRectHeight) {
            const width = balloonRectWidth || this.defaultValues.balloonRectWidth;
            const height = balloonRectHeight || this.defaultValues.balloonRectHeight;

            this.insertRule(`#${ns.configs[this.buttonId].balloonId} .${ns.configs[this.buttonId].prefix}balloon-rect { width: ${width} !important; height: ${height} !important; }`);
            console.log(`[StyleGenerator] Applied balloon rectangle size: width ${width}, height ${height}`);
        }

        toggleLocaleDisplay(display) {
            if (this.buttonType == ns.ButtonType.B) {
                const displayValue = display ? 'flex' : 'none';
                this.insertRule(`#${ns.configs[this.buttonId].buttonControlId} .${ns.configs[this.buttonId].prefix}locale { display: ${displayValue} !important; }`);
            }
            if (this.buttonType == ns.ButtonType.A) {
                const displayValue = display ? 'flex' : 'hidden';
                this.insertRule(`#${ns.configs[this.buttonId].buttonControlId} .${ns.configs[this.buttonId].prefix}locale { visibility: ${displayValue} !important; }`);
            }
            console.log(`[StyleGenerator] Toggled locale display: ${display ? 'shown' : 'hidden'}.`);
        }

        insertRule(rule) {
            this.styleElement.sheet.insertRule(rule, this.styleElement.sheet.cssRules.length);
            console.log(`[StyleGenerator] Inserted rule: ${rule}`);
        }
    }
})(Quantz); 