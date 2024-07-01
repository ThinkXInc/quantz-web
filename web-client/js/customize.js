(function(ns) {
    ns.LayoutSize = {
        SMALL: 'small',
        MEDIUM: 'medium',
        LARGE: 'large',
        CUSTOM: 'custom'
    };

    ns.Customize = class {
        constructor() {
            this.buttonContainer = document.querySelector('#quantz-button-container');
            if (!this.buttonContainer) console.error('Button container (#quantz-button-container) not found.');

            this.button = this.buttonContainer ? this.buttonContainer.querySelector('#quantz-button') : null;
            if (!this.button) console.error('Button (#quantz-button) not found.');

            this.iconWrapper = this.button ? this.button.querySelector('.icon-wrapper') : null;
            if (!this.iconWrapper) console.error('Icon wrapper (.icon-wrapper) not found.');

            this.buttonTextContainer = this.button ? this.button.querySelector('#button-text-container') : null;
            if (!this.buttonTextContainer) console.error('Button text container (#button-text-container) not found.');

            this.sign = this.buttonTextContainer ? this.buttonTextContainer.querySelector('.sign') : null;
            if (!this.sign) console.error('Sign (.sign) not found.');

            this.buttonText = this.buttonTextContainer ? this.buttonTextContainer.querySelector('.button-text') : null;
            if (!this.buttonText) console.error('Button text (.button-text) not found.');

            this.buttonControl = this.buttonContainer ? this.buttonContainer.querySelector('#quantz-button-control') : null;
            if (!this.buttonControl) console.error('Button control (#quantz-button-control) not found.');

            this.localeButton = this.buttonControl ? this.buttonControl.querySelector('.locale-button') : null;
            if (!this.localeButton) console.error('Locale button (.locale-button) not found.');

            if (!this.button || !this.buttonContainer || !this.iconWrapper || !this.buttonTextContainer || !this.sign || !this.buttonText || !this.buttonControl || !this.localeButton) {
                console.error('Customize class initialization aborted due to missing elements.');
                return; // Stop execution if any essential element is missing
            }

            this.localeElement = document.querySelector('#quantz-button-control .locale');
            if (!this.localeElement) console.error('Locale element (.locale) not found.');

            this.balloon = document.querySelector('#quantz-balloon');
            if (!this.balloon) console.error('Balloon element (#quantz-balloon) not found.');

            // If all elements are present, fetch their initial dimensions
            this.initButtonWidth = parseFloat(window.getComputedStyle(this.button).width);
            this.localeButtonWidth = parseFloat(window.getComputedStyle(this.localeButton).width);
            this.buttonControlMarginLeft = parseFloat(window.getComputedStyle(this.buttonControl).marginLeft);
            this.iconWidth = parseFloat(window.getComputedStyle(this.iconWrapper).width);
            this.buttonPaddingLeft = parseFloat(window.getComputedStyle(this.button).paddingLeft);
            this.buttonPaddingRight = parseFloat(window.getComputedStyle(this.button).paddingRight);
            this.signWidth = parseFloat(window.getComputedStyle(this.sign).width);
            this.signMarginRight = parseFloat(window.getComputedStyle(this.sign).marginRight);
        }

        setLayout(size) {
            switch (size) {
                case LayoutSize.SMALL:
                    // Define small size styles
                    break;
                case LayoutSize.MEDIUM:
                    // Define medium size styles
                    break;
                case LayoutSize.LARGE:
                    this.iconSize(50);
                    this.fontSize(1.4);
                    this.buttonSize(600, 100);  // Large button size
                    this.setRadius(20);
                    break;
                case LayoutSize.CUSTOM:
                    // Allow for custom configurations
                    break;
                default:
                    console.error(`Unknown layout size: ${size}`);
            }
        }

        setStyleImportant(element, property, value) {
            element.style.cssText += `${property}: ${value} !important;`;
        }

        iconSize(width) {
            // Set the icon wrapper size
            if (this.iconWrapper) {
                this.setStyleImportant(this.iconWrapper, 'width', `${width}px`);
                this.setStyleImportant(this.iconWrapper, 'height', `${width}px`);

                // Set each icon size inside the icon wrapper
                const iconImages = this.iconWrapper.querySelectorAll('img');
                iconImages.forEach(icon => {
                    this.setStyleImportant(icon, 'width', `${width}px`);
                    this.setStyleImportant(icon, 'height', `${width}px`);
                });
            } else {
                console.error('Icon wrapper or icon image not found.');
            }
        }

        fontSize(size) {
            if (this.buttonText) {
                this.setStyleImportant(this.buttonText, 'font-size', `${size}px`);
            } else {
                console.error('Button text element not found.');
            }
        }

        buttonSize(width, height) {
            const totalPaddingAndMargins = this.localeButtonWidth + this.buttonControlMarginLeft;
            const buttonWidth = width - totalPaddingAndMargins;

            if (buttonWidth > 0) {
                this.setStyleImportant(this.button, 'width', `${buttonWidth}px`);
                this.setStyleImportant(this.button, 'height', `${height}px`);
                this.setStyleImportant(this.buttonContainer, 'width', `${width}px`);

                // Calculate the new width for .button-text
                const buttonTextWidth = buttonWidth - this.buttonPaddingLeft - this.buttonPaddingRight - this.iconWidth - this.signWidth - this.signMarginRight;

                if (buttonTextWidth > 0) {
                    this.setStyleImportant(this.buttonText, 'width', `${buttonTextWidth}px`);
                } else {
                    console.error('Calculated button text width is non-positive. Check input width and existing paddings/margins.');
                }

                this.setBalloonPosition(height);
            } else {
                console.error('Calculated button width is non-positive, check input width and existing paddings/margins.');
            }
        }

        setBalloonPosition(buttonHeight) {
            if (this.balloon) {
                const balloonTop = buttonHeight + 12;  // 12px offset from the button's bottom
                this.setStyleImportant(this.balloon, 'top', `${balloonTop}px`);
            } else {
                console.error('Balloon element not found. Cannot set position.');
            }
        }

        setRadius(radius) {
            if (this.button) {
                this.setStyleImportant(this.button, 'border-radius', `${radius}px`);
            } else {
                console.error('Button element not found.');
            }
        }

        displayLocale(bool) {
            // TODO: button-container still includes locale width
            if (this.localeElement) {
                const displayValue = bool ? 'flex' : 'none'; // Assuming flex is the default display type for .locale
                this.setStyleImportant(this.localeElement, 'display', displayValue);
            } else {
                console.error('Locale element not found. Cannot change display property.');
            }
        }
    }
})(Quantz); 