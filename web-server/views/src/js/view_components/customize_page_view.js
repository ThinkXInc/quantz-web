class CustomizePageView {
    constructor({ user, lang, locale }) {
        this.user = user;
        this.lang = lang;
        this.locale = locale;

        this.createCustomizePage();
        this.handleEventCustomizePage();
    }

    mount($parent) {
        $parent.appendChild(this.$customizeContainer);
    }

    createCustomizePage() {
        const $customizePageTitle = document.createElement('h3');
        $customizePageTitle.classList.add('title', 'customize');
        $customizePageTitle.textContent = this.locale.get('settings_customize_page_title', this.lang);
        this.$customizePageTitle = $customizePageTitle;

        const $customizeContainer = document.createElement('div');
        $customizeContainer.classList.add('CustomizeContainer', 'container');

        const $customizeAlert = document.createElement('p');
        $customizeAlert.classList.add('alertMessage');

        const $items = document.createElement('div');
        $items.classList.add('CustomizeItems');

        const $preview = document.createElement('div');
        $preview.classList.add('CustomizePreview');

        // Add your item creation methods here
        this.$customizeAlert = $customizeAlert;

        this.createButtonTypeView($items);
        this.createButtonSizeView($items);
        this.createButtonColorView($items);
        this.createButtonFontSizeView($items);
        this.createButtonBalloonSizeView($items);

        $items.appendChild($customizeAlert);
        $customizeContainer.appendChild($items);

        this.createPreviewView($preview);
        this.createCodeView($preview);

        $customizeContainer.appendChild($preview);
        this.$view = $customizeContainer;

        this.updateQuantzButton();
        this.updateCodeView();
    }

    handleEventCustomizePage() {
        // Attach event handlers for customize page elements
        // For example:
        this.buttonTypeSelector.$view.addEventListener('valuechanged', (e) => {
            e.preventDefault();
            const { newValue } = e.detail;
            this.submitCustomize({ 'button_type': newValue });
        });

        // Similar event attachments for other fields...
    }

    // === The following methods are extracted from the original code ===
    // createOperatorNameView() { ... }
    // createFirstMessageView() { ... }
    createButtonTypeView($items) {
        const buttonTypeSelector = new RadioButton({
            id: "ButtonType",
            fieldName: "button_type",
            hasTitle: true,
            defaultValue: this.user.customize.button_type,
            title: this.locale.get("settings_customize_button_type_title", lang),
            items: [
                new RadioButtonItem({value: "A", name: this.locale.get("settings_customize_button_type_item_A", lang)}),
                new RadioButtonItem({value: "B", name: this.locale.get("settings_customize_button_type_item_B", lang)}),
            ]
        })

        $items.appendChild(buttonTypeSelector.$view);
        this.buttonTypeSelector = buttonTypeSelector;
 
    }

    createButtonSizeView($items) {
        const $wrapper = document.createElement('div');
        $wrapper.classList.add('ButtonSizeWrapper');
        $wrapper.classList.add('CustomizeItemWrapper');

        const $buttonSizeTitle = document.createElement('h4');
        $buttonSizeTitle.classList.add('subtitle');
        $buttonSizeTitle.textContent = locale.get('settings_customize_button_size_title', lang)

        const min = 40;
        const max = 2000;
 
        const buttonWidthForm = new TextField({
            id: 'ButtonWidthForm',
            fieldName: 'button_width',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.positiveIntegerFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, lang),
                    min: min,
                    max: max
                })
            ],
            defaultValue: String(this.user.customize.button_width),
            hasTitle: true,
            title: this.locale.get('settings_customize_button_width_title', lang),
            hasUnit: true,
            unit: "px",
            unitPlace: TextFieldPlaceTo.inputOuter,
            placeholder: this.locale.get('settings_customize_button_height_placeholder', lang),
            isCounter: false,
            isIncrementer: true,
            incrementButtonPlace: TextFieldPlaceTo.inputAfter,
            incrementUpImgSrc: '/img/up.svg',
            incrementDownImgSrc: '/img/down.svg',
        });

        const buttonHeightForm = new TextField({
            id: 'ButtonHeightForm',
            fieldName: 'button_height',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.positiveIntegerFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, lang),
                    min: min,
                    max: max
                })
            ],
            defaultValue: String(this.user.customize.button_height),
            hasTitle: true,
            title: this.locale.get('settings_customize_button_height_title', lang),
            hasUnit: true,
            unit: "px",
            unitPlace: TextFieldPlaceTo.inputOuter,
            placeholder: this.locale.get('settings_customize_button_height_placeholder', lang),
            isCounter: false,
            isIncrementer: true,
            incrementButtonPlace: TextFieldPlaceTo.inputAfter,
            incrementUpImgSrc: '/img/up.svg',
            incrementDownImgSrc: '/img/down.svg',
        });

        const $forms = document.createElement('div');
        $forms.classList.add('ButtonSizeForms');
        $forms.classList.add('SizeForms');

        $forms.appendChild(buttonWidthForm.$view);
        $forms.appendChild(buttonHeightForm.$view);

        $wrapper.appendChild($buttonSizeTitle);
        $wrapper.appendChild($forms);

        $items.appendChild($wrapper);

        this.buttonWidthForm = buttonWidthForm;
        this.buttonHeightForm = buttonHeightForm;

    }

    createButtonColorView($items) {
        const $wrapper = document.createElement('div');
        $wrapper.classList.add('ButtonColorWrapper');
        $wrapper.classList.add('CustomizeItemWrapper');

        const $buttonColorTitle = document.createElement('h4');
        $buttonColorTitle.classList.add('subtitle');
        $buttonColorTitle.textContent = locale.get('settings_customize_button_color_title', lang)

        const buttonColorPicker = new ColorPicker({
            id: "ButtonColorPicker",
            defaultColor: this.user.customize.button_color
        })

        $wrapper.appendChild($buttonColorTitle);
        $wrapper.appendChild(buttonColorPicker.$view);

        $items.appendChild($wrapper);

        this.buttonColorPicker = buttonColorPicker;
 
    }

    createButtonFontSizeView($items) {
        const $wrapper = document.createElement('div');
        $wrapper.classList.add('ButtonFontSizeWrapper');
        $wrapper.classList.add('CustomizeItemWrapper');

        const min = "0.0";
        const max = "100.0";
        const fontSizeForm = new TextField({
            id: 'FontSizeForm',
            fieldName: 'font_size',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.positiveFloatFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveFloatFormat, lang),
                    min: min,
                    max: max
                })
            ],
            defaultValue: String(this.user.customize.font_size),
            hasTitle: true,
            title: this.locale.get('settings_customize_font_size_title', lang),
            hasUnit: true,
            unit: this.locale.get('settings_customize_px_unit', lang),
            placeholder: this.locale.get('settings_customize_font_size_placeholder', lang),
            isCounter: false,
        });

        $wrapper.appendChild(fontSizeForm.$view);

        $items.appendChild($wrapper);

        this.fontSizeForm = fontSizeForm;
 
    }

    createButtonBalloonSizeView($items) {
        const $wrapper = document.createElement('div');
        $wrapper.classList.add('BalloonSizeWrapper');
        $wrapper.classList.add('CustomizeItemWrapper');

        const $balloonSizeTitle = document.createElement('h4');
        $balloonSizeTitle.classList.add('subtitle');
        $balloonSizeTitle.textContent = locale.get('settings_customize_balloon_size_title', lang)

        const min = 1;
        const max = 100;
 
        const balloonWidthForm = new TextField({
            id: 'BalloonWidthForm',
            fieldName: 'balloon_width',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.positiveIntegerFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, lang),
                    min: min,
                    max: max
                })
            ],
            defaultValue: String(this.user.customize.balloon_width),
            hasTitle: true,
            title: this.locale.get('settings_customize_balloon_width_title', lang),
            hasUnit: true,
            unit: "vw",
            unitPlace: TextFieldPlaceTo.inputOuter,
            placeholder: this.locale.get('settings_customize_balloon_height_placeholder', lang),
            isCounter: false,
            isIncrementer: true,
            incrementButtonPlace: TextFieldPlaceTo.inputAfter,
            incrementUpImgSrc: '/img/up.svg',
            incrementDownImgSrc: '/img/down.svg',
        });

        const balloonHeightForm = new TextField({
            id: 'BalloonHeightForm',
            fieldName: 'balloon_height',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.positiveIntegerFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, lang),
                    min: min,
                    max: max
                })
            ],
            defaultValue: String(this.user.customize.balloon_height),
            hasTitle: true,
            title: this.locale.get('settings_customize_balloon_height_title', lang),
            hasUnit: true,
            unit: "vh",
            unitPlace: TextFieldPlaceTo.inputOuter,
            placeholder: this.locale.get('settings_customize_balloon_height_placeholder', lang),
            isCounter: false,
            isIncrementer: true,
            incrementButtonPlace: TextFieldPlaceTo.inputAfter,
            incrementUpImgSrc: '/img/up.svg',
            incrementDownImgSrc: '/img/down.svg',
        });


        const $forms = document.createElement('div');
        $forms.classList.add('BalloonSizeForms');
        $forms.classList.add('SizeForms');

        $forms.appendChild(balloonWidthForm.$view);
        $forms.appendChild(balloonHeightForm.$view);

        $wrapper.appendChild($balloonSizeTitle);
        $wrapper.appendChild($forms);

        $items.appendChild($wrapper);

        this.balloonWidthForm = balloonWidthForm;
        this.balloonHeightForm = balloonHeightForm;

    }

    createPreviewView($preview) {
        const $previewWrapper = document.createElement('div');
        $previewWrapper.classList.add('PreviewWrapper');

        // FIXME: not work
        //const script = document.createElement('script');
        //script.src = "https://quantz.thinkxinc.com/js/dist/quantz-button.min.js";
        //$previewWrapper.appendChild(script);
    
        this.$previewWrapper = $previewWrapper;
        $preview.appendChild($previewWrapper);
 
    }

    createCodeView($preview) {
        const $codeViewWrapper = document.createElement('div');
        $codeViewWrapper.classList.add('CodeViewWrapper');

        const $codeView = document.createElement('pre');
        $codeView.classList.add('CodeView');

        const $code = document.createElement('code');
        $code.id = 'QBTN-code';
        $code.textContent = this.generateCodeSnippet(); // Generate initial code snippet
        $code.classList.add('language-javascript');
    
        // Create the copy button
        const $copyButton = document.createElement('img');
        $copyButton.src = '/img/copy-icon.svg';
        $copyButton.classList.add('CopyButton');

        const $toolTip = document.createElement('span');
        $toolTip.classList.add('tooltip');
        $toolTip.textContent = this.locale.get("settings_preview_code_copy_tooltip", lang);

        $copyButton.addEventListener('mouseenter', () => {
            $toolTip.classList.add('visible');
            $toolTip.classList.remove('fade-out');
        });

        $copyButton.addEventListener('mouseleave', () => {
            $toolTip.classList.add('fade-out');
        });

        $copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText($code.textContent).then(() => {
                $toolTip.textContent = this.locale.get("settings_preview_code_copy_done_tooltip", lang);
                $toolTip.classList.add('copied');
                setTimeout(() => {
                    $toolTip.classList.add('fade-out');
                    setTimeout(() => {
                        $toolTip.classList.remove('visible', 'fade-out', 'copied');
                        $toolTip.textContent = this.locale.get("settings_preview_code_copy_tooltip", lang);
                    }, 1000);
                }, 2000);
            }, err => {
                console.error('Failed to copy text: ', err);
            });
        });

        $codeView.appendChild($code);
        $codeView.appendChild($copyButton);
        $codeView.appendChild($toolTip);
        $codeViewWrapper.appendChild($codeView);

        $preview.appendChild($codeViewWrapper);

        this.$codeView = $codeView;
        this.$code = $code;
    }

    updateQuantzButton() {
        const buttonKey = `QBTN-preview`;//`QBTN-${this.user._id}`;
        console.log(`Find quantz button with key ${buttonKey}`);

        let $buttonLoader = document.querySelector(`[data-button-key='${buttonKey}']`);

        if (!$buttonLoader) {
            console.log(`Create new button loader.`)
            $buttonLoader = document.createElement('div');
            $buttonLoader.classList.add('QBTN-button-loader');
            $buttonLoader.setAttribute('data-button-key', buttonKey);
            $buttonLoader.setAttribute('data-publisher-id', `${this.user._id}`);

            const configString = this.configStringFromLatestValues();
            $buttonLoader.setAttribute('data-quantz-config', configString);

            // Once DOM is appended, the addition is observed by script and setup starts
            this.$previewWrapper.appendChild($buttonLoader)

        } else {
            // FIXME: response doubles if not removed
            $buttonLoader.remove()
            console.log(`Create new button loader.`)
            $buttonLoader = document.createElement('div');
            $buttonLoader.classList.add('QBTN-button-loader');
            $buttonLoader.setAttribute('data-button-key', buttonKey);
            $buttonLoader.setAttribute('data-publisher-id', `${this.user._id}`);
            const configString = this.configStringFromLatestValues();
            $buttonLoader.setAttribute('data-quantz-config', configString);
            this.$previewWrapper.appendChild($buttonLoader)

            // FIXME: if we explicitly call initializeButton since it is called automatically when node added
            //        and event duplicates and response doubles
            //const configString = this.configStringFromLatestValues();
            //$buttonLoader.setAttribute('data-quantz-config', configString);
            //Quantz.initializeButton({$buttonLoader: $buttonLoader});
        }
    }

    configStringFromLatestValues() {
        const configString = JSON.stringify({
            buttonType: this.buttonTypeSelector.value,
            iconSize: 30,
            fontSize: Number(this.fontSizeForm.value),
            buttonWidth: Number(this.buttonWidthForm.value),
            buttonHeight: Number(this.buttonHeightForm.value),
            buttonColor: this.buttonColorPicker.value,
            borderRadius: 20,
            displayLocale: true,
            balloonRectWidth: `${this.balloonWidthForm.value}vw`,
            balloonRectHeight: `${this.balloonHeightForm.value}vh`,
            defaultLang: this.lang,
            responseMode: 0
        });
        return configString
    }

    generateCodeSnippet() {
        const scriptCode = `<script src="https://quantz.thinkxinc.com/js/dist/quantz-button.min.js"></script>`;

        const config = JSON.stringify({
            buttonType: this.buttonTypeSelector.value,
            iconSize: 30,
            fontSize: Number(this.fontSizeForm.value),
            buttonWidth: Number(this.buttonWidthForm.value),
            buttonHeight: Number(this.buttonHeightForm.value),
            buttonColor: this.buttonColorPicker.value,
            borderRadius: 20,
            displayLocale: true,
            balloonRectWidth: `${this.balloonWidthForm.value}vw`,
            balloonRectHeight: `${this.balloonHeightForm.value}vh`,
            defaultLang: this.lang,
            responseMode: 0  // FAST
        });
    
        const loaderCode = `<div class="QBTN-button-loader" data-publisher-id="${this.user._id}" data-quantz-config='${config}'></div>`;
        return `${scriptCode}${loaderCode}`
    }

    updateCodeView() {
        if (this.$code) {
            this.$code.remove();

            const $code = document.createElement('code');
            $code.id = 'QBTN-code';
            $code.textContent = this.generateCodeSnippet(); // Generate initial code snippet
            $code.classList.add('language-html');
            $code.textContent = this.generateCodeSnippet();

            this.$codeView.appendChild($code)
            this.$code = $code;

            hljs.highlightElement(this.$code);
        }
    }

    handleEventCustomizePage() {
        const _this = this;

        // Button Type
        this.buttonTypeSelector.$view.addEventListener('valuechanged', (e) => {
            e.preventDefault();
            const {newValue} = e.detail;
            console.warn(`button type: ${newValue}`)
            this.submitCustomize({'button_type': newValue})
        })
        // Button Size
        this.buttonWidthForm.$view.addEventListener('textchanged', (e)=> {
            e.preventDefault();
            const {newValue} = e.detail;
            console.warn(`button width: ${newValue}`)
            if(!this.buttonWidthForm.validate()) {
                this.submitCustomize({'button_width': Number(newValue)})
            }

        })
        this.buttonHeightForm.$view.addEventListener('textchanged', (e)=> {
            e.preventDefault();
            const {newValue} = e.detail;
            console.warn(`button height: ${newValue}`)
            if(!this.buttonHeightForm.validate()) {
                this.submitCustomize({'button_height': Number(newValue)})
            }
        })
        // Button Color
        this.buttonColorPicker.$view.addEventListener('valuechanged', (e)=> {
            e.preventDefault();
            const {newValue} = e.detail;
            console.warn(`button color: ${newValue}`)
            this.submitCustomize({'button_color': newValue})

        })
        // Font Size
        this.fontSizeForm.$view.addEventListener('textchanged', (e)=> {
            e.preventDefault();
            const {newValue} = e.detail;
            const parsedFontSize = parseFloat(newValue);
            console.warn(`font size: ${parsedFontSize}`)
            if(!this.fontSizeForm.validate()) {
                this.submitCustomize({'font_size': parsedFontSize.toFixed(2)}) // NOTE: string (javascript convert float 11.0 to int 11 automatically) 
            }
        })
        // Balloon Size
        this.balloonWidthForm.$view.addEventListener('textchanged', (e)=> {
            e.preventDefault();
            const {newValue} = e.detail;
            console.warn(`balloon width: ${newValue}`)
            if(!this.balloonWidthForm.validate()) {
                this.submitCustomize({'balloon_width': Number(newValue)})
            }
        })
        this.balloonHeightForm.$view.addEventListener('textchanged', (e)=> {
            e.preventDefault();
            const {newValue} = e.detail;
            console.warn(`balloon height: ${newValue}`)
            if(!this.balloonHeightForm.validate()) {
                this.submitCustomize({'balloon_height': newValue})
            }
        })
    }

    submitCustomize(updates) {
        const _this = this;
        //this.clearAllCustomizeAlert();
        Http.post(`/v1/${this.lang}/users/update/customize`, updates,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.updateQuantzButton();
                this.updateCodeView();
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
                    const { errors, message } = error; 
                    if (errors) {
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'button_type':
                                    this.buttonTypeSelector.alert(message);
                                    break;
                                case 'button_width':
                                    this.buttonWidthForm.alert(message);
                                    break;
                                case 'button_height':
                                    this.buttonHeightForm.alert(message);
                                    break;
                                case 'font_size':
                                    this.fontSizeForm.alert(message);
                                    break;
                                case 'balloon_width':
                                    this.balloonWidthForm.alert(message);
                                    break;
                                case 'balloon_height':
                                    this.balloonHeightForm.alert(message);
                                    break;
                            }
                        });
                    } else if (message) {
                        _this.$customizeAlert.textContent = message;
                    }
                } else {
                    console.error(error);
                }
            },
            () => {
            }
        );
    }

    clearAllCustomizeAlert() {
        this.buttonTypeSelector.alert(false);
        this.buttonWidthForm.alert(false);
        this.buttonHeightForm.alert(false);
        this.fontSizeForm.alert(false);
        this.balloonWidthForm.alert(false);
        this.balloonHeightForm.alert(false);
        this.$customizeAlert.textContent = "";
    }

}