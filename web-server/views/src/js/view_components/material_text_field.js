const materialTextFieldCustomEventTextSubmit = 'textSubmit';

 /**
 * html:
 *    <div id="{this.id}" class="textField">
 *      <div class="inputOuter">
 *          <h6 class="title">{this.__title__}</h6>
 *          <input class="{this.fieldName}form" name="{this.fieldName}" type="text" autocomplete="off">
 *          <div class="footer">
 *              <span class="indicator"></span>
 *              <span class="message"></span> -> <span class="message notice">This document is split into 2 materials</span>
 *              <span class="counter"></span> -> <span class="counter notice"></span>
 *              <button class="enterButton"></button>
 *              <p class="press">press<strong>Enter ↵</strong></p>
 *          </div>
 *      </div>
 *   </div>
 * 
 * css:
 * // enter button style
 * .enterButtonSVG .arrow {
 *     stroke: #333333;  // Dark gray for the arrow lines
 * }
 * .enterButtonSVG .bg {
 *     fill: #eeeeee;    // Light gray for the circle background
 *     stroke: #cccccc;  // Slightly darker gray for the circle border
 * }
 **/
 class MaterialTextField extends TextField {
    constructor({
        id,
        fieldName,
        title,
        placeholder,
        type = TextFieldType.multiplelines,
        validators,
        enterButtonPressText,
        enterButtonEnterText,
        splitNoticeText,
        maxTextLength,
        maxTextLengthAlertMessage,
        maxSingleMaterialLength,
        initRows,
        scrollControlElementId,
        hasTitle = false,
        passwordMode = false,
        verticalFlex = true,
        isCounter = true,
        counterPlace = TextFieldPlaceTo.footerLeft,
    }) {
        super({
            id,
            fieldName,
            type,
            validators,
            maxTextLength,
            initRows,
            hasTitle,
            title,
            placeholder,
            passwordMode,
            verticalFlex,
            isCounter,
            counterPlace
        });

        this.maxSingleMaterialLength = maxSingleMaterialLength;
        this.maxTextLengthAlertMessage = maxTextLengthAlertMessage;
        this.enterButtonPressText = enterButtonPressText;
        this.enterButtonEnterText = enterButtonEnterText;
        this.splitNoticeText = splitNoticeText;
        this.scrollControlElementId = scrollControlElementId;

        this.__max_single_material_length__ = maxSingleMaterialLength;

        this.__notice_class_name__ = 'notice';

        this.__enter_button_press_text__ = enterButtonPressText;
        this.__enter_button_enter_text__ = enterButtonEnterText;
        this.__split_notice_text__ = splitNoticeText;

        this.createElements(this.__enter_button_press_text__, this.__enter_button_enter_text__);

        this._addEventHandlers();

        this.updateCounter();
    }

    updateCounter() {
        if (this.text) {
            this.count = this.text.length;
        } else {
            this.count = 0;
        }
    }

    /**
     * 
     * 
     *  priority:
     *  0. Initialize any alerts or message.
     *  1. If count exceeds the max length, alert and return.
     *  2. Calculate numSplit. If it's greater than 1, show notice.
     * 
     * @param {*} count 
     * @returns 
     */
    watchTextCounter(count) {
        // Initialize state
        this.resetCounterAndMessage()

        // If count exceeds the max length, alert it
        if (count > this.maxTextLength) {
            this.alert(this.maxTextLengthAlertMessage);
            this.$textField.classList.add('alert');
            return
        }
 
        // Compute numSplit and show notice if needed
        this.numSplit = Math.ceil(count / this.__max_single_material_length__);
        debuglog(this.numSplit)
        if (this.numSplit > 1) {
            // Add the 'notify' class to this.$counter
            this.$counter.classList.add(this.__notice_class_name__);

            // Call displaySplitNotice method
            console.log(`numSplit ${this._numSplit} exceeds 1. Show splitNotice message.`);
            this.displaySplitNotice(this.numSplit);
        }
    }

    resetCounterAndMessage() {
        this.alert(false);
        this.clearSplitNotice();
        this.$counter.classList.remove(this.__notice_class_name__);
        this.$message.classList.remove(this.__notice_class_name__);
    }

    set count(count) {
        // Call the parent class's setter
        debuglog(count)
        super.count = count;

        // Show message depending on the count
        this.watchTextCounter(count);
    }

    get count() {return super.count;}

    // Getter for numSplit
    get numSplit() {
        return this._numSplit;
    }

    // Setter for numSplit
    set numSplit(value) {
        this._numSplit = value;
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
    
    /**
     * Returns the locale key for the enter button press.
     *
     * @param {string} id - The ID used to construct the locale key.
     * @returns {string} The locale key for the enter button press.
     */
    static getLocaleKeyEnterButtonPress(id) {
        return `${id}__enterButton__press`;
    }
    
    /**
     * Returns the locale key for the enter button enter.
     *
     * @param {string} id - The ID used to construct the locale key.
     * @returns {string} The locale key for the enter button enter.
     */
    static getLocaleKeyEnterButtonEnter(id) {
        return `${id}__enterButton__enter`;
    }
    
    /**
     * Returns the locale key for the split notice.
     *
     * @param {string} id - The ID used to construct the locale key.
     * @returns {string} The locale key for the split notice.
     */
    static getLocaleKeySplitNotice(id) {
        return `${id}__splitNotice`;
    }

    /**
     * Checks if the provided locale object has all the required keys.
     *
     * @param {string} id - The ID used to construct the locale keys.
     * @param {Locale} locale - The Locale instance to check.
     * @param {string} lang - The language code to check in the locale.
     * @returns {boolean} Returns true if all keys are present, otherwise false.
     */
    static isLocaleSufficient(id, locale, lang) {
        const requiredKeys = [
            this.getLocaleKeyPlaceholder(id),
            this.getLocaleKeyEnterButtonPress(id),
            this.getLocaleKeyEnterButtonEnter(id),
            this.getLocaleKeySplitNotice(id),
            'max_length'
        ];

        for (const key of requiredKeys) {
            try {
                // Use the get method to check if key and language exist in the locale
                locale.get(key, lang);
            } catch (error) {
                console.error(`Key "${key}" or language "${lang}" not found in locale.`); // Log the error as an error
                return false;
            }
        }

        return true;
    }

    disableInteractions(disable) {
        super.disableInteractions(disable);

        if (disable) {
            this.$enterButton.disabled = true;
        } else {
            this.$enterButton.disabled = false;
        }
    }
    
    displaySplitNotice(numSplit) {
        if (this.$message) {
            this.$message.textContent = this.__split_notice_text__.replace('$0', numSplit);
            this.$message.classList.add(this.__notice_class_name__);
        } else {
            console.warn('The message element is not found.');
        }
    }

    clearSplitNotice() {
        if (this.$message) {
            this.$message.textContent = ""; 
            this.$message.classList.remove(this.__notice_class_name__);
        } else {
            console.warn('The message element is not found.');
        }
    }

    enterInput(text) {
        console.log(`enterInput method called for input: ${text}`);
        if (this.count > 0 && this.count < this.maxTextLength) {
            let event = new CustomEvent('textSubmit', {
                detail: { text: this.value }
            });
            console.log(`Dispatching custom event by ${this.$textField.id}:`, materialTextFieldCustomEventTextSubmit);
            this.$textField.dispatchEvent(event);
        } else {
            console.warn(`input length ${this.count} doesn't allow submition.`)
        }
    }


    /**
     * Creates and appends the 'enterButton' and 'press' elements to the footer.
     * 
     * <button class="enterButton"></button>
     * <p class="press">press<strong>Enter ↵</strong></p>
     * 
     * @param {string} pressText - The text to be set for the paragraph element with class 'press'.
     * @param {string} enterText - The text to be set for the strong element inside the 'press' paragraph.
     */
    createElements(pressText, enterText) {
        this.$textField.classList.add('MaterialTextField');

        // Create button
        const $enterButton = document.createElement('button');
        $enterButton.id = 'EnterButton';
        $enterButton.className = 'enterButton';
        $enterButton.innerHTML = SVGIcons.enterButtonSVG;
        this.$enterButton = $enterButton;

        // // Create paragraph
        // const $pressP = document.createElement('p');
        // $pressP.className = 'press';

        // // Create strong tag
        // const $strongElem = document.createElement('strong');

        // // Set text for the <p> element with the class 'press'
        // $pressP.textContent = pressText;

        // // Set text for the <strong> element inside the 'press' paragraph
        // $strongElem.textContent = enterText;

        // // Append strong tag to paragraph
        // $pressP.appendChild($strongElem);

        // Create wrapping spans
        const $leftSpan = document.createElement('div');
        $leftSpan.className = 'left';
        const $middleSpan = document.createElement('div');
        $middleSpan.className = 'middle';
        const $rightSpan = document.createElement('div');
        $rightSpan.className = 'right';

        // Append elements to corresponding spans
        if (this.$indicator) {
            $leftSpan.appendChild(this.$indicator);
        }
        if (this.$message) {
            $middleSpan.appendChild(this.$message);
        }
        //$rightSpan.append(this.$counter, $enterButton, $pressP); 
        $rightSpan.append(this.$counter, $enterButton); 

        // Append wrapping spans to footer
        if (this.$footer) {
            while (this.$footer.firstChild) {
                this.$footer.firstChild.remove();
            }
            this.$footer.append($leftSpan, $middleSpan, $rightSpan);
            this.$middleColumn = $middleSpan;
            this.$leftColumn = $leftSpan;
            this.$rightColumn = $middleSpan;
        } else {
            console.warn('The footer element is not yet initialized.');
        }
    }

    _addEventHandlers() {
        // 1) Publish a custom event when the this.$textArea is focused and the enter button was pressed
        //this.$textArea.addEventListener('keydown', (e) => {
        //    if (e.key === "Enter" || e.keyCode === 13) {  // Check if the pressed key is "Enter"
        //        const event = new CustomEvent('textAreaEnterPressed', {
        //            detail: {
        //                message: 'Enter key pressed when textarea was focused',
        //                textValue: _this.$textArea.value
        //            },
        //            bubbles: true,
        //            cancelable: true
        //        });
        //        _this.$textArea.dispatchEvent(event);
        //        _this.enterInput(_this.$textArea.value);
        //    }
        //});

        // 2) When this.$enterButton was tapped, call this.enterInput()
        if (this.$enterButton) {
            let _this = this;
            this.$enterButton.addEventListener('click', () => {
                debuglog(`${_this.id} click`);
                _this.enterInput(_this.$textArea.value);
            });
            this.$enterButton.addEventListener('mousedown', () => {
                debuglog(`${_this.id} mousedown`);
                _this.$enterButton.classList.add('clicked');

            })
            this.$enterButton.addEventListener('mouseup', () => {
                debuglog(`${_this.id} mouseup`);
                _this.$enterButton.classList.remove('clicked');
            })

        } else {
            console.warn('The element $enterButton was not found.');
        }
    }

    /**
     * 
     * @override
     * @param {String} alertMessageId 
     * @param {String} message 
     */
    _appendAlertMessage(alertMessageId, message) {
        const $footer = this.$textField.querySelector('.footer');
        
        // Look for the span with class "message" to place the alert message
        const $messageSpan = $footer.querySelector('.middle .message');
        
        // If the span exists, update its content
        if ($messageSpan) {
            $messageSpan.innerText = message;
            $messageSpan.id = alertMessageId;
            $messageSpan.classList.add('alertMessage'); // If you want the span to have this class
        } else {
            console.warn('The message span is not present in the footer.');
        }
    }

    /**
     * @override
     * @param {String} alertMessageId 
     */
    _removeAlertMessage(alertMessageId) {
        const $footer = this.$textField.querySelector('.footer');
        
        // Look for the span with class "message" which has the alert message
        const $messageSpan = $footer.querySelector('.middle .message');
    
        // Check if the span exists and matches the provided ID
        if ($messageSpan && $messageSpan.id === alertMessageId) {
            $messageSpan.innerText = ''; // Clear the message
            $messageSpan.id = ''; // Clear the id attribute
            $messageSpan.classList.remove('alertMessage'); // Remove the alertMessage class
        
            this.$textField.classList.remove('alert');
        } else {
            console.warn('The alert message with specified ID is not present in the footer.');
        }
    }

}