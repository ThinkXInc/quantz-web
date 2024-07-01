class MaterialSampleQuestionField extends TextField {
    constructor({
        id,
        fieldName,
        title,
        placeholder,
        type = TextFieldType.singleline,
        validators = [],
        hasTitle = true,
        isCounter = false,
        isDoneButton = true,
        shouldTrackLocalChangeInCookie = false,
        isTitlePlacedAtInputLeft = true,
        shouldEnterKeySubmitDoneButton = true,
        doneButtonPlace = TextFieldPlaceTo.inputAfter,
        counterPlace = TextFieldPlaceTo.footerRight,
        messagePlace = TextFieldPlaceTo.footerMiddle,
        eventNameDoneButtonClick = 'materialSampleQuestionSubmitButtonClick',
    }) {
        super({
            id,
            fieldName,
            type,
            hasTitle,
            title,
            placeholder,
            validators,
            isCounter,
            isDoneButton,
            shouldTrackLocalChangeInCookie,
            isTitlePlacedAtInputLeft,
            shouldEnterKeySubmitDoneButton,
            doneButtonPlace,
            counterPlace,
            messagePlace,
            eventNameDoneButtonClick,
        });

        this.createElements();
        this._addEventHandlers();
        this._addLoader();

        this.onEdit = false;
        this._previousTitle = "";
        this.materialId = null;
    }

    createElements() {
        // Add doneButton click handler
        this.$doneButton.innerHTML = SVGIcons.sendButtonSVG;
    }

    _addEventHandlers() {
        // submit button dispatches event with name defined this.config.eventNameDoneButtonClick
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

    show() {
        this.$textField.classList.remove('hidden');
        this.$textField.classList.add('visible');
    }

    hide() {
        this.$textField.classList.remove('visible');
        this.$textField.classList.add('hidden');
        this.$inputOuter.style.display = 'none';
        this.$loader.style.display = 'none';
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
            id: 'SampleQuestionFieldGradientLoader',
            numIndicator: 1,
            individualHeight: 2,
            animationDelay: 12,
        });
        this.loader = loader;
        this.$loader = loader.$view;
        this.$textField.appendChild(loader.$view);
    }
}