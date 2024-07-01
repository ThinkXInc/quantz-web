class InquiryDataModel extends InputPageViewDataModel {
    first_name
    last_name
    email
    tel
    job_title
    company_name
    message
    constructor(defaults = {}) {
        super(defaults);

        Object.assign(this, defaults);
    }
}


/**
 * InquiryViewController class extends InputPageViewController to handle interactions on an inquiry form.
 * It includes logic for setting up validators and individual pages for the different fields in the form.
 *
 * @class
 * @extends InputPageViewController
 *
 * @param {string} viewControllerId - The identifier for this controller
 * @param {Object} locale - Locale specific data
 * @param {string} lang - The language code
 * @param {function} dataModelClass - The class for the data model
 *
 * @example
 * // Usage:
 *    const lang = 'en'
 *    const locale = {{ locale_json |safe }};
 *    const countries = countriesFormData(lang);
 *
 *    let inquiryViewController = new InquiryViewController(
 *       'parentView', 'inquiryView', locale, lang);
 */
class InquiryViewController extends InputPageViewController {
    constructor(viewControllerId, locale, lang = 'en', url, dataModelClass = InquiryDataModel) {

        // Initialize variables
        let pages = [];
        const maxTextLength = 140;
        const maxTextLengthMessage = 500;
        const row = 1;
        const rowMessage = 5;
    
        // Define validators for first name and last name
        let lastNameFirstNamePageValidators = [
            new Validator(ValidationErrorType.required, locale, lang),
            new Validator(ValidationErrorType.maxLength, locale, lang, maxTextLength)
        ]
    
        // Create page for entering first name and last name
        let lastNameFirstNamePage = new LastNameFirstNamePage(
            viewControllerId,
            'LastNameFirstNamePage',
            locale,
            lang,
            maxTextLength,
            row,
            'first_name',
            'last_name',
            lastNameFirstNamePageValidators,
            false  // no backbutton
        );
    
        // Add the first name and last name page to the array of pages
        pages.push(lastNameFirstNamePage);
    
        // Define fields and corresponding page IDs
        let fields = ['email', 'tel', 'job_title', 'company_name', 'message'];
        let pageIds = ['EmailPage', 'TelPage', 'JobTitlePage', 'CompanyNamePage', 'MessagePage'];
    
        // Define validators for each field
        let emailValidators = [
            new Validator(ValidationErrorType.emailFormat, locale, lang),
            new Validator(ValidationErrorType.required, locale, lang), 
            new Validator(ValidationErrorType.maxLength, locale, lang, maxTextLength)
        ]
        let telValidators = [
            new Validator(ValidationErrorType.telFormat, locale, lang),
            new Validator(ValidationErrorType.required, locale, lang), 
            new Validator(ValidationErrorType.maxLength, locale, lang, maxTextLength)
        ]
        let jobTitleValidators = [
            new Validator(ValidationErrorType.maxLength, locale, lang, maxTextLength)
        ]
        let companyNameValidators = [
            new Validator(ValidationErrorType.maxLength, locale, lang, maxTextLength)
        ]
        let messageValidators = [
            new Validator(ValidationErrorType.maxLength, locale, lang, maxTextLengthMessage)
        ]
    
        // Group all validators together
        let validators = [emailValidators, telValidators, jobTitleValidators, companyNameValidators, messageValidators]
    
        // Create a page for each field
        fields.forEach((field, index) => {
            let singleTextInputPage = new SingleTextInputPage(
                viewControllerId,
                pageIds[index],
                locale,
                lang,
                field,
                index === 4 ? maxTextLengthMessage : maxTextLength,
                index === 4 ? rowMessage : row,
                validators[index]
            );
    
            // Add the page to the array of pages
            pages.push(singleTextInputPage);
        });
    
        // Create loading bar
        let loading = new GradientLoadingBar(viewControllerId, 'LoadingBar')
    
        // Call the parent constructor
        super(viewControllerId, pages, locale, lang, dataModelClass, url, loading);
    }

    /**
     * Handles the input value changed event for TextField. 
     * Certain fields ('first_name', 'last_name', 'message') are validated 
     * immediately when the input value changes.
     * 
     * @param {TextField} textField - The TextField that triggered the event.
     * @param {string} value - The current input value of the TextField.
     */
    textFieldInputValueChanged(textField, value) {
        super.textFieldInputValueChanged(textField, value);
        // check for specific fields that need validation on value change
        switch (textField.fieldName) {
            case 'first_name':
            case 'last_name':
            case 'message':
                textField.validate();
                break;
            // no default case needed as we only want to validate specific fields
        }
    }

    /**
     * Handles the onBlur event for TextField. 
     * All fields are validated when they lose focus.
     * 
     * @param {TextField} textField - The TextField that triggered the event.
     * @param {string} value - The current input value of the TextField.
     */
    textFieldOnBlur(textField, value) {
        super.textFieldOnBlur(textField, value);
        // validate all fields when they lose focus
        textField.validate();
    }

    /**
     * InputViewController protocol.
     */
    completeSubmission() {
        const url = `${this.lang}/success_page`;
        Browser.goTo(url);
    }
}