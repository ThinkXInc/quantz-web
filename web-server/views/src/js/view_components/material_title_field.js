const materialTitleFieldCustomEventTitleSubmit = 'titleSubmit';
const materialTitleFieldOnEditClassName = 'onEdit';
const materialTitleFieldOnDisplayClassName = 'onDisplay';

class MaterialTitleField extends TextField {
    constructor({
        id,
        fieldName,
        maxTitleLength,
        locale,
        lang,
        validators = [],
        type = TextFieldType.singleline, // Assuming default is overridden to be singleline
        hasTitle = false, // Explicitly stated, assuming it needs to be false
        passwordMode = false, // Assuming it is different from the default or needs explicit mention
        isCounter = false, // Assuming default should be overridden
        shouldEnterKeySubmitDoneButton = true // Assuming it's an important behavior for title fields
    }) {
        super({
            id,
            fieldName,
            type,
            validators,
            maxTextLength: maxTitleLength, // Special property for title length
            hasTitle,
            passwordMode,
            isCounter,
            shouldEnterKeySubmitDoneButton,
            initRows: 1, // Assuming default, can be omitted if it's the default in TextField
            // Any other properties that need to be set to their defaults can be omitted
        });

        this.locale = locale;
        this.lang = lang;

        // These properties are specific to MaterialTitleField
        this.createElements();
        this._addEventHandlers();
        this._addLoader(); // Assuming there's an additional method to add loader functionality
        this.hide(); // Assuming you want to initially hide this field

        // Custom properties
        this.onEdit = false;
        this._previousTitle = "";
        this.materialId = null;
        this.flashIntervalId = null;
    }

    /**
     * Creates and appends the 'enterButton' and 'press' elements to the footer.
     * 
     * <button class="enterButton"></button>
     * <p class="press">press<strong>Enter ↵</strong></p>
     * 
     */
    createElements() {
        this.$textField.classList.add('MaterialTitleField');

        const $iconBox = document.createElement('div');
        $iconBox.id = 'IconBox';
        $iconBox.className = 'iconBox';

        // Create edit button
        const $editButton = document.createElement('button');
        $editButton.id = 'EditButton';
        $editButton.className = 'editButton';
        $editButton.innerHTML = SVGIcons.editIconSVG;
        debuglog("editIconSVG: ", SVGIcons.editIconSVG);
        this.$editButton = $editButton;
        $iconBox.appendChild($editButton);

        // Create done button
        const $doneButton = document.createElement('button');
        $doneButton.id = 'DoneButton';
        $doneButton.className = 'doneButton';
        $doneButton.innerHTML = SVGIcons.doneIconSVG;
        debuglog("doneIconSVG: ", SVGIcons.doneIconSVG);
        this.$doneButton = $doneButton;
        $iconBox.appendChild($doneButton);
 
        // Create cancel button
        const $cancelButton = document.createElement('button');
        $cancelButton.id = 'CancelButton';
        $cancelButton.className = 'cancelButton';
        $cancelButton.innerHTML = SVGIcons.cancelIconSVG;
        debuglog("cancelIconSVG: ", SVGIcons.cancelIconSVG);
        this.$cancelButton = $cancelButton;
        $iconBox.appendChild($cancelButton);

        this.$inputOuter.appendChild($iconBox);
    }

    _addEventHandlers() {

        // enter key press on the text area
        let _this = this;
        this.$textArea.addEventListener('keyup', function(event) {
            _this._handleEnterKeyPress(event);
        });

        // edit button
        if (this.$editButton) {
            let _this = this;
            this.$editButton.addEventListener('click', () => {
                debuglog(`${_this.id} click`);
                // Click action
                _this.onEdit = true;
            });
            this.$editButton.addEventListener('mousedown', () => {
                debuglog(`${_this.id} mousedown`);
                // Add 'clicked' class
                _this.$editButton.classList.add('clicked');
            })
            this.$editButton.addEventListener('mouseup', () => {
                debuglog(`${_this.id} mouseup`);
                // Remove 'clicked' class
                _this.$editButton.classList.remove('clicked');
            })
        } else {
            console.warn('The element $editButton was not found.');
        }

        // done button
        if (this.$doneButton) {
            let _this = this;
            this.$doneButton.addEventListener('click', () => {
                debuglog(`${_this.id} click`);
                // Click action
                const titleLength = _this.value.length;

                if(titleLength == 0) {
                    console.warn("Title length is zero."); 
                    _this.alert(true, this.locale.get('required', this.lang));
                    return;
                }

                if(titleLength > _this.maxTextLength) {
                    console.warn("Title length exceeds the maximum allowed length.");
                    _this.alert(true, this.locale.get('max_length', this.lang, this.maxTextLength));
                    return;
                }

                if(_this.materialId == null) {
                    console.error(`The material id must be set in ${this.id} but ${this.materialId}.`)
                } 

                _this.onEdit = false;
                // Create and dispatch a custom event
                let event = new CustomEvent(materialTitleFieldCustomEventTitleSubmit, {
                    detail: { title: _this.value, materialId: _this.materialId }
                });
                console.log(`Dispatching custom event by ${this.$textField.id}:`, materialTitleFieldCustomEventTitleSubmit);
                _this.$textField.dispatchEvent(event);
            });
            this.$doneButton.addEventListener('mousedown', () => {
                debuglog(`${_this.id} mousedown`);
                // Add 'clicked' class
                _this.$doneButton.classList.add('clicked');
            })
            this.$doneButton.addEventListener('mouseup', () => {
                debuglog(`${_this.id} mouseup`);
                // Remove 'clicked' class
                _this.$doneButton.classList.remove('clicked');
            })
        } else {
            console.warn('The element $doneButton was not found.');
        }

        // cancel button
        if (this.$cancelButton) {
            let _this = this;
            this.$cancelButton.addEventListener('click', () => {
                debuglog(`${_this.id} click`);
                // Click action
                _this.onEdit = false;
                _this.value = _this._previousTitle; 
            });
            this.$cancelButton.addEventListener('mousedown', () => {
                debuglog(`${_this.id} mousedown`);
                // Add 'clicked' class
                _this.$cancelButton.classList.add('clicked');
            })
            this.$cancelButton.addEventListener('mouseup', () => {
                debuglog(`${_this.id} mouseup`);
                // Remove 'clicked' class
                _this.$cancelButton.classList.remove('clicked');
            })
        } else {
            console.warn('The element $cancelButton was not found.');
        }
    }

    /**
     * Returns the locale key for the placeholder.
     *
     * @param {string} id - The ID used to construct the locale key.
     * @returns {string} The locale key for the placeholder.
     */
    static getLocaleKeyPlaceholder(id) {
        return `${id}__text__placeholder`;
    }
    
    set onEdit(value) {
        if (value == this._onEdit) { return }
    
        this._onEdit = value;
        debuglog(`${this.id} onEdit ${value}`);
    
        if (value) {
            // Switch to edit mode
            this.$textField.classList.add(materialTitleFieldOnEditClassName);
            this.$textField.classList.remove(materialTitleFieldOnDisplayClassName);
            this.$textArea.removeAttribute('disabled');
        } else {
            // Switch to display mode
            this.$textField.classList.remove(materialTitleFieldOnEditClassName);
            this.$textField.classList.add(materialTitleFieldOnDisplayClassName);
            this.$textArea.setAttribute('disabled', true);
        }
    }

    get onEdit() {
        return this._onEdit;
    }

    setPreviousTitle(title) {
        console.log(`${this.id}._previousTitle is set as ${title}`);
        this._previousTitle = title;
    }

    disableInteractions(disable) {
        super.disableInteractions(disable);

        if (disable) {
            // Disable buttons in iconBox
            this.$editButton.disabled = true;
            this.$doneButton.disabled = true;
            this.$cancelButton.disabled = true;
        } else {
            // Enable buttons in iconBox
            this.$editButton.disabled = false;
            this.$doneButton.disabled = false;
            this.$cancelButton.disabled = false;
        }
    }

    show() {
        this.$textField.classList.remove('hidden');
        this.$textField.classList.add('visible');
    }

    hide() {
        this.$textField.classList.remove('visible');
        this.$textField.classList.add('hidden');
        this.$inputOuter.style.display = 'none';
        this.loader.$view.style.display = 'none';
    }

    startLoading() {
        this.show();
        this.$inputOuter.style.display = 'none';
        this.$loader.style.display = 'block';
    }

    stopLoading() {
        this.$inputOuter.style.display = 'flex';
        this.$loader.style.display = 'none';
    }

    _addLoader() {
        const loader = new GradientViewLoader({
            id: 'TitleFieldGradientLoader',
            numIndicator: 1,
            individualHeight: 3,
            animationDelay: 7,
        });
        this.loader = loader;
        this.$loader = loader.$view;
        this.$textField.appendChild(loader.$view);
    }

    _handleEnterKeyPress(event) {
        // Check if the Enter key is pressed
        if (event.key === 'Enter' && this.onEdit) {  // 13 is the keycode for Enter
            event.preventDefault(); // Prevent the default action (e.g., new line in a textarea)
            this.$doneButton.click(); // Programmatically click the done button
        }
    }

    setNewTitleWithFlash(text, duration = 30, delay = 0) {
        // Clear any existing flash intervals
        if (this.flashIntervalId) {
            clearInterval(this.flashIntervalId);
        }

        // Get the full text
        let currentText = "";
        let index = 0;

        // Unicode for left half block
        const leftHalfBlock = '\u258C';

        // Function to update text and cursor
        const updateText = () => {
            if (index < text.length) {
                currentText += text[index];
                this.$textArea.value = currentText + leftHalfBlock; // Append the block at the tail
                index++;
            } else {
                // Remove the leftHalfBlock and update the textArea
                this.$textArea.value = currentText;
                this.text = currentText;
                clearInterval(this.flashIntervalId); // Clear the interval
                console.log(`materialTitleField finish updating text with flash "${this.text}"`)
            }
        };

        // Start after the initial delay
        setTimeout(() => {
            this.flashIntervalId = setInterval(updateText, duration);
        }, delay);
    }

}