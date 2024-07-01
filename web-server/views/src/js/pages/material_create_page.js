class MaterialCreatePage extends Page {
    constructor({
        parentId,
        pageId,
        locale,
        lang,
        titleFieldId = "MaterialTitleField",
        titleFieldMaxTitleLength = 100,
        titleFieldFieldName = 'title',
        textFieldId = "MaterialTextField",
        textFieldMaxTextLength = 500,
        textFieldMaxSingleMaterialLength = 500,
        textFieldFieldName = 'text',
        textFieldInitialRows = 5,
        keywordsFieldId = "MaterialKeywordsField",
        keywordsFieldFieldName = "keywords",
        keywordsFieldMaxTextLength = 20,
        sampleQuestionFieldId = "MaterialSampleQuestionField",
        sampleQuestionFieldName = "question",
        sampleQuestionFieldMaxTextLength = 120,
        answerViewId = "MaterialSampleAnswerView"
    }) {

        // MaterialTitleField
        let titleField = new MaterialTitleField({
            id: titleFieldId,
            fieldName: titleFieldFieldName,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: titleFieldMaxTitleLength})
            ],
            locale: locale,
            lang: lang,
            maxTitleLength: titleFieldMaxTitleLength,
            hasTitle: false,
            placeholder: locale.get(MaterialsLocaleKeys.titlePlaceholder, lang),
            initRows: 1,
            isCounter: false
        });

        // MaterialTextField
        let textField = new MaterialTextField({
            id: textFieldId,
            fieldName: textFieldFieldName,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: textFieldMaxTextLength}),
            ],
            maxTextLength: textFieldMaxTextLength,
            maxTextLengthAlertMessage: locale.get('max_length', lang, textFieldMaxTextLength),
            initRows: textFieldInitialRows,
            scrollControlElementId: parentId,
            hasTitle: false,
            title: "",
            placeholder: locale.get(MaterialsLocaleKeys.textFieldPlaceholder, lang),
            maxSingleMaterialLength: textFieldMaxSingleMaterialLength,
            enterButtonPressText: locale.get(MaterialsLocaleKeys.textFieldEnterButtonPress, lang),
            enterButtonEnterText: locale.get(MaterialsLocaleKeys.textFieldEnterButtonPress, lang),  // Note: Check if this is a typo. Should be different from pressText?
            splitNoticeText: locale.get(MaterialsLocaleKeys.textFieldEnterButtonSplitNotice, lang)
        });


        // MaterialKeywordsField
        let keywordsField = new MaterialKeywordsField({
            id: keywordsFieldId,
            fieldName: keywordsFieldFieldName,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: keywordsFieldMaxTextLength}),
                ],
            maxTextLength: keywordsFieldMaxTextLength,
            pressText: locale.get(MaterialsLocaleKeys.keywordsPress, lang),
            enterText: locale.get(MaterialsLocaleKeys.keywordsEnter, lang),
            placeholder: locale.get(MaterialsLocaleKeys.keywordsPlaceholder, lang),
            cookieExclude: true,
            isCounter: false,
            isDefaultValueRestoredFromCookie: false,
            shouldMapTextToDeleteButtonBGColor: false, 
            constantDeleteButtonBGColorSaturation: 31,
            constantDeleteButtonBGColorLightness: 38
        });

        // MaterialSampleQuestionField
        let sampleQuestionField = new MaterialSampleQuestionField({
            id: sampleQuestionFieldId,
            fieldName: sampleQuestionFieldName,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: sampleQuestionFieldMaxTextLength}),
            ],
            title: locale.get(MaterialsLocaleKeys.sampleQuestionTitle, lang),
            placeholder: locale.get(MaterialsLocaleKeys.sampleQuestionPlaceholder, lang)
        });

        // MaterialSampleAnswerView
        let answerView = new MaterialSampleAnswerView({
            id: answerViewId,
            answerViewTitle: locale.get(MaterialsLocaleKeys.sampleAnswerViewAnswerTitle, lang),
            reviewViewTitle: locale.get(MaterialsLocaleKeys.sampleAnswerViewReviewTitle, lang)
        });

        // Components array
        let components = [titleField, textField, keywordsField, sampleQuestionField, answerView];

        // Call the constructor of the base class
        super({
            id: pageId,
            components: components}); 

        // Hold components
        this.titleField = titleField;
        this.textField = textField;
        this.keywordsField = keywordsField;
        this.questionField = sampleQuestionField;
        this.answerView = answerView;
    }
}