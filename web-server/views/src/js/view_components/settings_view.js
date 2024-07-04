class SettingsModalView extends ModalView {
    constructor({
        id,
        user,
        locale,
        lang = 'en',
        title = "",
        text = "",
        cancelButtonText = "Cancel",
        doneButtonText = "Done",
        shouldCloseOnTapBG = true,
        htmlTag = 'div',
        protocols = [],
        validators = []
    }) {
        super({
            id,
            title,
            text,
            cancelButtonText,
            doneButtonText,
            shouldCloseOnTapBG,
            htmlTag,
            protocols,
            validators
        });

        this.user = user;
        this.locale = locale;
        this.lang = lang;

        this.createElements();
        //this.setupSettingsInputPageView();
        const settingsView = new SettingsView({
            id: 'SettingsView',
            locale: locale,
            lang: lang,
            user: this.user,
        });
        settingsView.mount(this.$mainContent);
    }

    createElements() {
        super.createElements()
    }

    show() {
        super.show();
    }

    cancel() {
        super.cancel();
    }

    done() {
        // Trigger custom event
        if (!this.cell) {
            throw Error('No cell is set to MaterialDeleteModalView before confirming deletion.');
        }
        this.$view.dispatchEvent(
            new CustomEvent(
                MaterialsEventKeys.CONFIRMED_DELETE_MATERIAL,
                { detail: { materialId: this.cell.content.materialId, cell: this.cell } }));
    }
}

const SettingsPageIndex = Object.freeze({
    basic: 0, billing: 1, customize: 2
})

class Customize {
    constructor({ button_type, button_width, button_height, button_color, font_size, balloon_width, balloon_height }) {
        this.button_type = button_type;
        this.button_width = button_width;
        this.button_height = button_height;
        this.button_color = button_color;
        this.font_size = font_size;
        this.balloon_width = balloon_width;
        this.balloon_height = balloon_height;
    }
}


class SettingsView {
    constructor({
        id,
        locale,
        lang,
        user,
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.user = user;

        this.unitPrice = window.unitPrice;

        this.setupView();
    }

    setupView(){
        const pageView = new PageView({
            id: 'SettingsPageView',
            numPages: 3
        })
        this.pageView = pageView;

        // Page 1: Basic

        this.createBasicPage() 
        this.handleEventBasicPage()

        // Page 2: Billing

        this.createBillingPage();
        this.handleEventBillingPage();

        // Page 3: Customize
        this.createCustomizePage();
        this.handleEventCustomizePage();

        this.pageView.showAll();
    }

    mount(element) {
        this.pageView.mount(element);
    }

    createBasicPage() {
        const pageIndex = SettingsPageIndex.basic;
        this.pageView.pages[pageIndex].container.classList.add('BasicPage');

        const $basicPageTitle = document.createElement('h3');
        $basicPageTitle.classList.add('title');
        $basicPageTitle.classList.add('basic');
        $basicPageTitle.textContent = locale.get('settings_basic_page_title', lang);

        const $container = document.createElement('div');
        $container.classList.add('container');
 
        let defaultOriginState = null;
        if (this.user.is_origin_verified && this.user.origin_type == "original") {
            defaultOriginState = OriginFormState.verifiedOriginal;
        } else if (this.user.is_origin_verified && this.user.origin_type == "public") {
            defaultOriginState = OriginFormState.verifiedPublic;
        } else {
            defaultOriginState = OriginFormState.notVerified;
        }
        let originForm = new OriginForm({
            id: "OriginForm",
            fieldName: "origin",
            defaultValue: this.user.origin,
            defaultState: defaultOriginState,
            className: "OriginForm",
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100 
                }),
                new Validator({
                    errorType: ValidationErrorType.domainFormat,
                    errorMessage: locale.get(ValidationErrorType.domainFormat, this.lang)
                }),
            ],
            maxTextLength: 100,
            title: locale.get("settings_origin_title", lang),
            placeholder: locale.get("settings_origin_placeholder", lang),
            submitButtonText: locale.get("settings_submit_button", lang),
            pendingStatusText: locale.get('settings_pending', lang),
            notVerifiedExplanation: this.locale.get("settings_origin_not_verified_explanation", lang),
            originalDomainExplanation: locale.get('settings_origin_explanation_original_domain', lang),
            publicDomainExplanation: locale.get('settings_origin_explanation_public_domain', lang)
        });

        let emailForm = new EmailForm({
            id: "EmailForm",
            fieldName: "email",
            className: "EmailForm",
            defaultValue: this.user.email || this.user.suspended_email || '',
            defaultState: this.user.is_email_verified ? EmailFormState.verified : EmailFormState.pendingNotSent,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100
                })
            ],
            maxTextLength: 100,
            title: locale.get("settings_email_title", lang),
            placeholder: locale.get("settings_email_placeholder", lang),
            submitButtonText: locale.get("settings_submit_button", lang),
            resendButtonText: locale.get("settings_resendButtonText", lang),
            resentExplanation: locale.get('settings_email_resent', lang),
            verifiedStateExplanation: locale.get('settings_email_verified', lang),
            pendingStatusText: locale.get('settings_pending', lang)
        });

        const $verifyContainer = document.createElement('div');
        $verifyContainer.classList.add('VerifyContainer');

        const $verifyTitle = document.createElement('h5');
        $verifyTitle.textContent = this.locale.get("verify_code_form_title", lang);

        const verifyCodeForm = new VerifyCodeForm({
            id: "VerifyCodeForm",
            errorMessageUnfilled: this.locale.get("verify_code_unfilled", lang),
            inputCompleteEventName: "verificationInputComplete"
        })

        $verifyContainer.appendChild($verifyTitle);
        $verifyContainer.appendChild(verifyCodeForm.$view);
        if (emailForm.state != EmailFormState.verified) {
            $verifyContainer.style.display = 'block';
        } else {
            $verifyContainer.style.display = 'none';
        }

        $container.appendChild(originForm.$view);
        $container.appendChild(emailForm.$view);
        $container.appendChild($verifyContainer);

        this.pageView.appendChild($basicPageTitle, pageIndex);
        this.pageView.appendChild($container, pageIndex)

        this.originForm = originForm;
        this.emailForm = emailForm;
        this.verifyCodeForm = verifyCodeForm;
        this.$verifyContainer = $verifyContainer;
    }

    handleEventBasicPage() {
        const _this = this;
        this.originForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            const email = this.emailForm.value;
            if(!this.originForm.validate()) {
                debuglog(`origin changed -> ${email}`)
                if (this.originForm.value != this.user.origin) {
                    this.originForm.showSubmitButton(true);
                } else {
                    this.originForm.state = this.originForm.defaultState;
                }
                switch (this.originForm.checkDomainType(this.user.verified_emails)) {
                    case DomainType.public:
                        debuglog('domain type: public')
                        this.originForm.updateExplanation(this.locale.get("settings_origin_explanation_public_domain", lang))
                        break
                    case DomainType.original:
                        debuglog('domain type: original')
                        this.originForm.updateExplanation(locale.get('settings_origin_explanation_original_domain', lang))
                        break
                    case DomainType.others:
                        debuglog('domain type: others')
                        this.originForm.updateExplanation(locale.get('settings_origin_explanation_invalid', lang));
                        break
                    default:
                        console.warn('Unknown domain type.')
                        break
                }
            }
        })
        this.originForm.$submitButton.addEventListener('click', (e) => {
            console.log(`origin submit click`)
            if(!this.originForm.validate()) {
                this.originForm.submitButton.load(true);
                this.submitOrigin(this.originForm.value);
            }
        })
        this.originForm.$view.addEventListener('keyup', (e)=> {
            if (e.key == "Enter") {
                if(!this.originForm.validate()) {
                    this.originForm.submitButton.load(true);
                    this.submitOrigin(this.originForm.value);
                }
            }
        })
        this.emailForm.$view.addEventListener('textchanged', (e) => {
            if (this.emailForm.value != this.user.email) {
                this.emailForm.state = EmailFormState.changed;
            }
        })
        this.emailForm.$submitButton.addEventListener('click', (e) => {
            console.log(`email submit click`)
            if(!this.emailForm.validate()) {
                this.emailForm.submitButton.load(true);
                this.submitEmail(this.emailForm.value);
            }
        })
        this.emailForm.$view.addEventListener('keyup', (e)=> {
            if (e.key == "Enter" && this.emailForm.state == EmailFormState.changed) {
                if(!this.emailForm.validate()) {
                    this.emailForm.submitButton.load(true);
                    this.submitEmail(this.emailForm.value);
                }
            }
        })
        this.emailForm.$resendButton.addEventListener('click', (e) => {
            console.log(`email resend click`)
            this.emailForm.resendButton.load(true);
            this.submitResendRequest();
        })
        this.verifyCodeForm.$view.addEventListener('verificationInputComplete', (e) => {
            console.log(`code input complete`)
            const code = e.detail;
            this.submitCode(code);

        })
    }

    submitResendRequest() {
        const _this = this;
        Http.get(`/v1/${this.lang}/users/verification/resend`,
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                _this.emailForm.updateExplanation(message);
                _this.$verifyContainer.style.display = 'block';
            },
            (error) => {
                console.log(`[error] code:${error.code} reason:${error.reason}`);
            },
            () => {
                this.emailForm.resendButton.load(false);
            }
        );
    }

    submitEmail(email){
        const _this = this;
        Http.post(`/v1/${this.lang}/users/email/update`, { email },
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                _this.emailForm.state = EmailFormState.pendingNotSent;
                _this.$verifyContainer.style.display = 'block';
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
                    const { errors, message } = error; 
                    if (errors) {
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'email':
                                    this.emailForm.alert(message)
                                    break;
                            }
                        });
                    } else if (message) {
                        _this.emailForm.alert(message);
                    }
                } else {
                    console.error(error);
                }
            },
            () => {
                this.emailForm.submitButton.load(false);
            }
        );
    }

    submitCode(code) {
        const _this = this;
        Http.post(`/v1/${this.lang}/users/verify_code`, { code },
            (res) => {
                const { code, message, email, google_id, is_email_verified } = res;
                console.log(`[${code} success] ${message} ${email} ${google_id}`);
                if (is_email_verified) {
                    _this.emailForm.value = email;
                    _this.emailForm.state = EmailFormState.verified;
                    _this.$verifyContainer.style.display = 'none';
                }
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
                    const { errors, message } = error; 
                    if (errors) {
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'code':
                                    this.verifyCodeForm.alert(message)
                                    break;
                            }
                        });
                    } else if (message) {
                        _this.verifyCodeForm.alert(message);
                    }
                } else {
                    console.error(error);
                }
            },
            () => {
            }
        );
    }

    submitOrigin(origin) {
        console.log(`submit origin:${this.originForm.value}`);
        const _this = this;
        Http.post(`/v1/${this.lang}/users/update/origin`, { origin },
            (res) => {
                const { code, message, is_origin_verified, origin_type } = res;
                console.log(`[${code} success] ${message}`);
                if (is_origin_verified && origin_type == "public") {
                    this.originForm.state = OriginFormState.verifiedPublic;
                    this.originForm.updateExplanation(this.locale.get("settings_origin_updated", lang))
                } else if (is_origin_verified && origin_type == "original") {
                    this.originForm.state = OriginFormState.verifiedOriginal;
                }
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
                    const { errors, message } = error; 
                    if (errors) {
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'origin':
                                    this.originForm.alert(message)
                                    break;
                            }
                        });
                    } else if (message) {
                        _this.originForm.alert(message);
                    }
                } else {
                    console.error(error);
                }
            },
            () => {
                this.originForm.submitButton.load(false);
            }
        );
    }

    async createBillingPage() {
        const pageIndex = SettingsPageIndex.billing;
        this.pageView.pages[pageIndex].container.classList.add('BillingPage');

        const $billingPageTitle = document.createElement('h3');
        $billingPageTitle.classList.add('title');
        $billingPageTitle.classList.add('billing');
        $billingPageTitle.textContent = locale.get('settings_billing_page_title', lang);

        // Card View

        const $cardContainer = document.createElement('div');
        $cardContainer.classList.add('container');
        $cardContainer.classList.add('CardContainer');

        const $cardTitle = document.createElement('h4');
        $cardTitle.classList.add('subtitle');
        $cardTitle.textContent = locale.get('settings_billing_card_title', lang)

        const $cardWrapper = document.createElement('div');
        $cardWrapper.classList.add('wrapper');

        const $message = document.createElement('p');
        $message.classList.add('message');

        const updateCardButton = new LoadButton({
            id: 'UpdateCardButton',
            labelText: this.locale.get('settings_update_card_button', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        updateCardButton.$view.style.display = 'none';

        //const cardLoader = new GradientViewLoader({
        //    id: 'CardLoader',
        //    numIndicator: 1,
        //    individualHeight: 3,
        //    animationDelay: 15,
        //});
        const cardLoader = new GradientLoadingBar({
            id: 'CardLoader'
        })
        cardLoader.startLoading();
 
        const $cardLogo = document.createElement('img');
        $cardLogo.classList.add('CardLogo');

        const $last4 = document.createElement('span');
        $last4.classList.add('Last4');


        $cardWrapper.appendChild(updateCardButton.$view);
        $cardWrapper.appendChild(cardLoader.$view);
        $cardWrapper.appendChild($cardLogo);
        $cardWrapper.appendChild($last4);
        $cardWrapper.appendChild($message);

        //$cardContainer.appendChild($cardTitle);
        $cardContainer.appendChild($cardWrapper);

        this.pageView.appendChild($billingPageTitle, pageIndex);
        this.pageView.appendChild($cardContainer, pageIndex)

        this.updateCardButton = updateCardButton;
        this.$message = $message;
        this.cardLoader = cardLoader;
        this.$cardLogo = $cardLogo;
        this.$last4 = $last4;

        // Usage Limit

        const $limitContainer = document.createElement('div');
        $limitContainer.classList.add('LimitContainer');
        $limitContainer.classList.add('container');

        const $limitTitle = document.createElement('h4');
        $limitTitle.classList.add('subtitle');
        $limitTitle.textContent = locale.get('settings_billing_limit_title', lang)

        const min = 1;
        const max = 99999;

        const $limitLine1 = document.createElement('div');
        $limitLine1.classList.add('LimitLine1')
        const $max = document.createElement('span');
        $max.classList.add('max')
        $max.textContent = locale.get('settings_limit_max', lang)
        this.limitForm = new TextField({
            id: 'LimitForm',
            fieldName: 'limit',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.positiveIntegerFormat,
                    errorMessage: this.locale.get(ValidationErrorType.positiveIntegerFormat, lang),
                    min: min,
                    max: max
                })
            ],
            defaultValue: String(this.user.usage_limit),
            isCounter: false,
            isIncrementer: true,
            incrementButtonPlace: TextFieldPlaceTo.inputAfter,
            incrementUpImgSrc: '/img/up.svg',
            incrementDownImgSrc: '/img/down.svg',
        });
        const $maxDesc = document.createElement('span');
        const maxChargeDefault = this.calcMaxChage(this.user.usage_limit);
        $maxDesc.classList.add('maxDesc')
        $maxDesc.textContent = locale.get('settings_limit_max_description', lang)
        const $maxCharge = document.createElement('span');
        $maxCharge.classList.add('maxCharge');
        $maxCharge.textContent = locale.get('settings_limit_max_charge', lang);
        const $maxChargePrice = document.createElement('span');
        $maxChargePrice.classList.add('maxChargePrice')
        $maxChargePrice.textContent = locale.get('settings_limit_max_charge_price', lang, [maxChargeDefault]);

        $limitLine1.appendChild($max);
        $limitLine1.appendChild(this.limitForm.$view);
        $limitLine1.appendChild($maxDesc);
        $limitLine1.appendChild($maxCharge);
        $limitLine1.appendChild($maxChargePrice);

        this.$maxChargePrice = $maxChargePrice;

        const $limitAlert = document.createElement('p');
        $limitAlert.id = 'limitAlert';
        $limitAlert.classList.add('LimitAlert');
        $limitAlert.style.display = 'none';

        $limitContainer.appendChild($limitTitle);
        $limitContainer.appendChild($limitLine1);
        $limitContainer.appendChild($limitAlert);

        this.pageView.appendChild($limitContainer, pageIndex)


        // Get status & Update card view
        this.updateCardView(pageIndex);

        //$container.appendChild(originForm.$view);
        //$container.appendChild(emailForm.$view);
        //$container.appendChild($verifyContainer);

        //this.emailForm = emailForm;
        //this.verifyCodeForm = verifyCodeForm;
    }

    calcMaxChage(limit) {
        debuglog(`limit ${limit}`)
        debuglog(`unitPrice ${this.unitPrice}`)
        const maxCharge = Number(limit) * this.unitPrice;
        return parseFloat(maxCharge.toFixed(2));
    }

    async updateCardView(pageIndex) {
        const urlParams = Browser.parseQueryStrings(window.location.search);
        const setupIntent = urlParams.setup_intent;
        if (setupIntent) {
            // wait when after card update redirect 
            await new Promise((resolve)=> setTimeout(resolve, 2000))
        }

        const { status, cardBrand, last4, message } = await this.checkPaymentMethod();
        if (!status && message) {
            this.$message.classList.add('alert');
            this.$message.textContent = message;
        }
        switch(status) {
            case "card_declined":
                this.$message.textContent = this.locale.get("settings_payment_method_card_declined", lang)
                this.$message.classList.add('alert');
                this.updateCardButton.$view.style.display = 'none';
                this.$cardLogo.src = this.cardBrandImage(cardBrand);
                this.$last4.textContent = `**** **** **** ${last4}`;
                this.cardLoader.$view.style.display = 'none';
                this.updateCardButton.$view.style.display = 'none';
                this.createCardInputView(pageIndex);
                break
            case "card_declined_but_updated":
            case "payment_method_valid":
                console.warn('valid')
                this.updateCardButton.$view.style.display = 'block';
                this.$message.style.display = 'none';
                this.$cardLogo.src = this.cardBrandImage(cardBrand);
                this.$last4.textContent = `**** **** **** ${last4}`;
                this.cardLoader.$view.style.display = 'none';
                this.updateCardButton.$view.style.display = 'block';
                break
            case "no_customer_id":
                this.$message.textContent = this.locale.get("settings_payment_method_no_customer_id", lang)
                this.$message.classList.add('alert');
                this.updateCardButton.$view.style.display = 'none';
                this.$cardLogo.style.display = 'none';
                this.$last4.style.display = 'none';
                this.cardLoader.$view.style.display = 'none';
                this.updateCardButton.$view.style.display = 'none';
                this.createCardInputView(pageIndex);
                break
            case "no_payment_method_id":
                this.$message.textContent = this.locale.get("settings_payment_method_payment_method_invalid", lang)
                this.$message.classList.add('alert');
                this.updateCardButton.$view.style.display = 'none';
                this.$cardLogo.style.display = 'none';
                this.$last4.style.display = 'none';
                this.cardLoader.$view.style.display = 'none';
                this.updateCardButton.$view.style.display = 'none';
                this.createCardInputView(pageIndex);
                break
        }

    }

    createCardInputView(pageIndex) {
        const $cardInputViewContainer = document.createElement('div');
        $cardInputViewContainer.classList.add("CardInputViewContainer");

        const $cardInputView = document.createElement('div');
        $cardInputView.id = 'CardInputView';
        $cardInputView.classList.add('CardInputView');

        const cardInputView = new CardInputView({
            id: 'CardInputView',
            lagn: this.lang,
            mountElementId: 'CardInputView',
            redirectUrl: `https://quantz.thinkxinc.com/v1/${lang}/home?page=settings`
        })

        const $loading = document.createElement('img');
        $loading.classList.add('loading');
        $loading.src = '/img/loading-white.svg'
 
        const submitCardButton = new LoadButton({
            id: 'SubmitCardButton',
            labelText: this.locale.get('settings_submit_button', lang),
            loaderSrc: '/img/button-loader.svg'
        });

        const $cardInputViewAlert = document.createElement('p');
        $cardInputViewAlert.classList.add('CardInputViewAlert');

        $cardInputView.appendChild($loading);
        $cardInputViewContainer.appendChild($cardInputView);
        $cardInputViewContainer.appendChild(submitCardButton.$view);
        $cardInputViewContainer.appendChild($cardInputViewAlert);

        this.cardInputView = cardInputView;
        this.$cardInputView = $cardInputView;
        this.$loading = $loading;
        this.submitCardButton = submitCardButton;
        this.$cardInputViewAlert = $cardInputViewAlert;
        this.$cardInputViewAlert.style.display = 'none';

        this.pageView.appendChild($cardInputViewContainer, pageIndex)

        this.submitCardButton.$view.style.display = 'none';
        this.$cardInputView.addEventListener('cardInputMounted', (e)=> {
            this.submitCardButton.$view.style.display = 'block';
        })

        this.handleEventCardInputView();
    }

    async checkPaymentMethod() {
        try {
            const response = await fetch(`/v1/${this.lang}/payments/method/status`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const { code, message, status, card_brand, last4 } = await response.json();
            console.log(`[${code} success] ${message}`);
            return {"status": status, "cardBrand": card_brand, "last4": last4}
        } catch (error) {
            console.log(`[error] code:${error.code} reason:${error.reason}`);
            return error;
        }
    }

    handleEventBillingPage() {
        const pageIndex = SettingsPageIndex.billing;
        const _this = this;
        this.updateCardButton.$view.addEventListener('click', (e) => {
            e.preventDefault();
            _this.createCardInputView(pageIndex);
        });

        this.limitForm.$view.addEventListener('textchanged', (e)=> {
            e.preventDefault();
            const {newValue} = e.detail;
            debuglog(`limit changed: ${newValue}`)
            if(!_this.limitForm.validate()) {
                _this.$maxChargePrice.textContent = _this.locale.get('settings_limit_max_charge_price', lang, [this.calcMaxChage(newValue)])
                _this.submitLimit(newValue);
            }
        })
    }

    handleEventCardInputView() {
        const _this = this;
        this.$cardInputView.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                _this.submitCard(e);
            }
        });
        this.submitCardButton.$view.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.submitCard(e);
        });
    }

    submitCard(e) {
        const _this = this;
        this.submitCardButton.load(true);
        this.cardInputView.submitCard({
            event: e,
            email: this.user.email,
            // when success, redirect to the cardInput.redirectUrl
            onError: (error)=> {
                _this.$cardInputViewAlert.textContent = error;
                _this.$cardInputViewAlert.style.display = 'block';
            },
            onComplete: () => {
                _this.submitCardButton.load(false);
            }
        });
    }

    submitLimit(usage_limit) {
        Http.post(`/v1/${this.lang}/users/update/usage_limit`, { usage_limit },
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.user.usage_limit = usage_limit;
            },
            (error) => {
                const { errors, code, message } = error; 
                if (errors) {
                    errors.forEach(errorObj => {
                        const {field_name, message} = errorObj;
                        switch (field_name) {
                            case 'limit':
                                this.limitForm.alert(message)
                                break;
                        }
                    });
                } else if (message) {
                    this.limitForm.alert(message)
                } else {
                    console.error(error);
                }
            },
            () => {}
        );
    }

    cardBrandImage(cardBrand) {
        let cardBrandImg;
        switch(cardBrand) {
            case "visa":
                cardBrandImg = "/img/cardbrand/visa.svg";
                break
            case "mastercard":
                cardBrandImg = "/img/cardbrand/mastercard.svg";
                break
            case "amex":
                cardBrandImg = "/img/cardbrand/amex.svg";
                break
            case "jcb":
                cardBrandImg = "/img/cardbrand/jcb.svg";
                break
            case "diners":
                cardBrandImg = "/img/cardbrand/diners.svg";
                break
            case "maestro":
                cardBrandImg = "/img/cardbrand/maestro.svg";
                break
            case "discover":
                cardBrandImg = "/img/cardbrand/maestro.svg";
                break
            case "unionpay":
                cardBrandImg = "/img/cardbrand/unionpay.svg";
                break
            default:
                cardBrandImg = "/img/cardbrand/generic.svg";
                break
        }
        return cardBrandImg;
    }


    createCustomizePage() {
        const pageIndex = SettingsPageIndex.customize;
        this.pageView.pages[pageIndex].container.classList.add('CustomizePage');

        const $customizePageTitle = document.createElement('h3');
        $customizePageTitle.classList.add('title');
        $customizePageTitle.classList.add('customize');
        $customizePageTitle.textContent = locale.get('settings_customize_page_title', lang);

        const $customizeContainer = document.createElement('div');
        $customizeContainer.classList.add('CustomizeContainer');
        $customizeContainer.classList.add('container');

        const $customizeAlert = document.createElement('p');
        $customizeAlert.classList.add('alertMessage');

        const $items = document.createElement('div');
        $items.classList.add('CustomizeItems')

        const $preview = document.createElement('div');
        $preview.classList.add('CustomizePreview');

        //this.createOperatorNameView($items);
        //this.createFirstMessageView($items);
        $items.appendChild($customizeAlert);

        this.createButtonTypeView($items);
        this.createButtonSizeView($items);
        this.createButtonColorView($items);
        this.createButtonFontSizeView($items);
        this.createButtonBalloonSizeView($items);

        this.createPreviewView($preview);
        this.createCodeView($preview);

        $customizeContainer.appendChild($items)
        $customizeContainer.appendChild($preview);

        this.pageView.appendChild($customizePageTitle, pageIndex);
        this.pageView.appendChild($customizeContainer, pageIndex);

        this.$customizeAlert = $customizeAlert;

        this.updateQuantzButton();
        this.updateCodeView();
    }

    createOperatorNameView($items) {
        //const $operatorNameTitle = document.createElement('h4');
        //$operatorNameTitle.classList.add('subtitle');
        //$operatorNameTitle.textContent = locale.get('settings_customize_operator_name_title', lang)

        const operatorNameForm = new TextField({
            id: 'OperatorNameForm',
            fieldName: 'operator_name',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100 
                }),
            ],
            defaultValue: String(this.user.customize.operator_name),
            hasTitle: true,
            title: this.locale.get('settings_customize_operator_name_title', lang),
            placeholder: this.locale.get('settings_customize_operator_name_placeholder', lang),
            isCounter: false,
        });

        //$items.appendChild($operatorNameTitle);
        $items.appendChild(operatorNameForm.$view);
        this.operatorNameForm = operatorNameForm;
    }

    createFirstMessageView($items) {
        //const $firstMessageTitle = document.createElement('h4');
        //$firstMessageTitle.classList.add('subtitle');
        //$firstMessageTitle.textContent = locale.get('settings_customize_operator_name_title', lang)

        const firstMessageForm = new TextField({
            id: 'FirstMessageForm',
            fieldName: 'first_message',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: 100 
                }),
            ],
            defaultValue: String(this.user.customize.operator_name),
            hasTitle: true,
            title: this.locale.get('settings_customize_first_message_title', lang),
            placeholder: this.locale.get('settings_customize_first_message_placeholder', lang),
            isCounter: false,
        });

        //$items.appendChild($firstMessageTitle);
        $items.appendChild(firstMessageForm.$view);
        this.firstMessageForm = firstMessageForm;
    }

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

        const min = 100;
        const max = 2000;
 
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

        let $btn = document.querySelector(`[data-button-key='${buttonKey}']`);

        if (!$btn) {
            console.log(`Create new button loader.`)
            $btn = document.createElement('div');
            $btn.classList.add('QBTN-button-loader');
            $btn.setAttribute('data-button-key', buttonKey);
            $btn.setAttribute('data-publisher-id', `${this.user._id}`);

            const configString = this.configStringFromLatestValues();
            $btn.setAttribute('data-quantz-config', configString);

            // Once DOM is appended, the addition is observed by script and setup starts
            this.$previewWrapper.appendChild($btn)

        } else {
            const configString = this.configStringFromLatestValues();
            $btn.setAttribute('data-quantz-config', configString);
            Quantz.initializeButton({$buttonLoader: $btn});
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
            defaultLang: this.lang
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
            defaultLang: this.lang
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