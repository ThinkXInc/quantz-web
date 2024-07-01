class SettingsInputViewConfig extends InputPageViewControllerConfig{
    constructor({
        dataModelClass = SettingsDataModel,
        loading = false,
        isAllPageShown = true,

        originFieldId = "SettingsOriginField",
        originFieldMaxTextLength = 100,
        originFieldFieldName = 'origin',

        emailFieldId = "SettingsEmailField",
        emailFieldMaxTextLength = 100,
        emailFieldFieldName = 'email',
        ...otherOptions
    } = {}) {
        super(otherOptions);
        this.dataModelClass = dataModelClass;
        this.loading = loading;
        this.isAllPageShown = isAllPageShown;

        this.originFieldId = originFieldId;
        this.originFieldMaxTextLength = originFieldMaxTextLength;
        this.originFieldFieldName = originFieldFieldName;

        this.emailFieldId = emailFieldId;
        this.emailFieldMaxTextLength = emailFieldMaxTextLength;
        this.emailFieldFieldName = emailFieldFieldName;
    }
}

class SettingsDataModel extends InputPageViewDataModel {
    domain
    domainCheckMailAddress
    credit
    operatorName
    firstMessage

    constructor(defaults = {}) {
        super(defaults);
        Object.assign(this, defaults);
    }
}

class SettingsInputViewController extends InputPageViewController {
    constructor({
        id,
        user,
        locale,
        lang,
        dataModelClass = SettingsDataModel,
        loading = false,
        isAllPageShown = true,
        originFieldId = "SettingsOriginField",
        originFieldMaxTextLength = 100,
        originFieldFieldName = 'origin',
        emailFieldId = "SettingsEmailField",
        emailFieldMaxTextLength = 100,
        emailFieldFieldName = 'email'
    }) {
        const basicSettingsPage = new BasicSettingsPage({
            id: "BasicSettingsPage",
            locale: locale,
            lang: lang,
            originFieldId: originFieldId,
            originFieldMaxTextLength: originFieldMaxTextLength,
            originFieldFieldName: originFieldFieldName,
            emailFieldId: emailFieldId,
            emailFieldMaxTextLength: emailFieldMaxTextLength,
            emailFieldFieldName: emailFieldFieldName
        });

        const customizeSettingsPage = new CustomizeSettingsPage({
            id: "CustomizeSettingsPage",
            locale: locale,
            lang: lang
        });

        const pages = [basicSettingsPage, customizeSettingsPage];

        super({
            id: id,
            pages: pages,
            locale: locale,
            lang: lang,
            dataModelClass: dataModelClass,
            loading: loading,
            isAllPageShown: isAllPageShown
        });

        // Access fields from pages directly, assuming they are publicly accessible
        this.originField = basicSettingsPage.originField;
        this.emailField = basicSettingsPage.emailField;

        // Initialize fields by user if applicable
        this.originField.initializeByUser(user);
        this.emailField.initializeByUser(user);
    }
}
