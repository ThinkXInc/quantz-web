document.addEventListener('DOMContentLoaded', ()=>{
    const lang = window.lang;
    const locale = window.locale;
    const unitPrice = window.unitPrice;
    const freeCall = window.freeCall;

    console.log(`set up signup view.\nlang:${lang}`);

    // initialize signup view
    const signup = new Signup({
        locale: locale,
        lang: lang});
});

const SignupPageIndex = Object.freeze({
    email: 0, code: 1, verified: 2, origin: 3, card: 4, limit: 5, terms: 6, complete: 7, restricted: 8
})

class Signup {
    constructor({
        locale,
        lang
    }) {
        this.locale = locale;
        this.lang = lang;
        this.user = {};

        this.setupView();

        const urlParams = new URLSearchParams(window.location.search);
        const pageId = urlParams.get('page');
        switch(pageId) {
            case 'email':
                this.pageView.show(SignupPageIndex.email);
                break;
            case 'code':
                this.pageView.show(SignupPageIndex.code);
                break;
            case 'verified':
                this.pageView.show(SignupPageIndex.verified);
                break;
            case 'origin':
                this.pageView.show(SignupPageIndex.origin);
                break;
            case 'card':
                this.pageView.show(SignupPageIndex.card);
                //this.createCardPage();
                //this.handleEventCardPage();
                break;
            case 'limit':
                this.pageView.show(SignupPageIndex.limit);
                break;
            case 'terms':
                this.pageView.show(SignupPageIndex.terms);
                break;
            case 'complete':
                this.pageView.show(SignupPageIndex.complete);
                break;
            case 'restricted':
                this.pageView.show(SignupPageIndex.restricted);
                break;
            default:
                break;
        }

    }

    setupView() {
        const pageView = new PageView({
            id: 'signupPageView',
            numPages: 9
        })
        this.pageView = pageView;

        this.pageView.$view.addEventListener('pageShown', (event) => {
            const { pageIndex, page } = event.detail;
            if (pageIndex === SignupPageIndex.card && !document.getElementById('CardInputView')) {
                this.createCardPage();
                this.handleEventCardPage();
            }
        });

        // Page 1: Email
        this.createEmailPage() 
        this.handleEventEmailPage()

        // Page 2: Verify Code
        this.createVerifyCodePage() 
        this.handleEventVerifyCodePage()

        // Page 3: Verified
        this.createVerifiedPage()
        this.handleEventVerifiedPage()

        // Page 4: Origin
        this.createOriginPage() 
        this.handleEventOriginPage()

        // Page 5: Credit Card
        //this.createCardPage() 
        //this.handleEventCardPage()

        // Page 6: Limit
        this.createLimitPage() 
        this.handleEventLimitPage()

        // Page 7: Terms
        this.createTermsPage()
        this.handleEventTermsPage()

        // Page 8: Complete
        this.createCompletePage() 
        this.handleEventCompletePage()

        // Page 9: Restricted
        this.createRestrictedPage()
        this.handleEventRestrictedPage()

        this.pageView.mount('#signup');
    }

    appendLogo(pageView, pageIndex) {
        const $logoContainer = document.createElement('div');
        $logoContainer.classList.add('logoContainer');

        const $logoLink = document.createElement('a');
        $logoLink.href = '/';

        const $logo = document.createElement('img');
        $logo.classList.add('logo');
        //$logo.src = '/img/logo/horizontal@2x.png';
        $logo.src = '/img/logo/horizontal_bluebg_224@2x.png';
    
        $logoLink.appendChild($logo);
        $logoContainer.appendChild($logoLink);
        pageView.appendChild($logoContainer, pageIndex);
    }

    // Email Page
    createEmailPage() {
        const pageIndex = SignupPageIndex.email;
        this.pageView.pages[pageIndex].container.classList.add('EmailPage');

        // Page 1
        const $googleOauthButton = createGoogleSignInElements(lang);

        const $separator = document.createElement('div');
        $separator.classList.add('separator');
        const $leftline = document.createElement('span');
        $leftline.classList.add('line')
        const $or = document.createElement('p')
        $or.classList.add('or')
        $or.textContent = locale.get('accounts_email_separator_or', lang);
        const $rightline = document.createElement('span');
        $rightline.classList.add('line')
        $separator.appendChild($leftline);
        $separator.appendChild($or);
        $separator.appendChild($rightline);

        this.appendLogo(this.pageView, pageIndex);

        const $emailPageTitle = document.createElement('h3');
        $emailPageTitle.classList.add('title');
        $emailPageTitle.classList.add('email');
        $emailPageTitle.textContent = locale.get('signup_email_title', lang);

        const $emailPageSubtitle = document.createElement('p');
        $emailPageSubtitle.classList.add('subtitle');
        $emailPageSubtitle.classList.add('email');
        $emailPageSubtitle.textContent = locale.get('accounts_email_subtitle', lang);
        console.warn(this.locale)

        const emailMaxLength = 100;
        const emailForm = new TextField({
            id: 'emailForm',
            fieldName: 'email',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: this.locale.get(ValidationErrorType.required, this.lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: this.emailMaxLength}),
                new Validator({
                    errorType: ValidationErrorType.emailFormat,
                    errorMessage: this.locale.get(ValidationErrorType.emailFormat, this.lang),
                })
                ],
            hasTitle: true,
            title: this.locale.get('accounts_email_form_title', lang),
            placeholder: this.locale.get('accounts_email_form_placeholder', lang),
            isCounter: false,
        })

        const passwordForm = new TextField({
            id: 'passwordForm',
            fieldName: 'password',
            passwordMode: true,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: this.locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: emailMaxLength})
                ],
            hasTitle: true,
            title: this.locale.get('accounts_password_form_title', lang),
            placeholder: this.locale.get('accounts_password_form_placeholder', lang),
            cookieExclude: true,
            isCounter: false,
        })

        const passwordConfirmForm = new TextField({
            id: 'passwordConfirmForm',
            fieldName: 'passwordConfirm',
            passwordMode: true,
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: this.locale.get(ValidationErrorType.required, lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: this.locale.get(ValidationErrorType.maxLength, lang),
                    maxLength: emailMaxLength})
                ],
            hasTitle: true,
            title: this.locale.get('accounts_password_confirm_form_title', lang),
            placeholder: this.locale.get('accounts_password_confirm_form_placeholder', lang),
            cookieExclude: true,
            isCounter: false,
        })

        const emailPageNextButton = new LoadButton({
            id: 'emailPageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        emailPageNextButton.$button.classList.add('nextButton');

        const $signInLink = document.createElement('a');
        $signInLink.classList.add('signInLink');
        $signInLink.textContent = locale.get('accounts_signin_link', lang)
        $signInLink.href = `/v1/${lang}/signin`;

        const $emailPageAlert = document.createElement('p');
        $emailPageAlert.id = 'emailPageAlert';
        $emailPageAlert.classList.add('pageAlert');
        $emailPageAlert.style.display = 'none';

        this.emailForm = emailForm;
        this.passwordForm = passwordForm;
        this.passwordConfirmForm = passwordConfirmForm;
        this.emailPageNextButton = emailPageNextButton;
        this.$emailPageAlert = $emailPageAlert;

        this.passwordForm.$view.style.display = 'none';
        this.passwordConfirmForm.$view.style.display = 'none';


        const $container = document.createElement('div');
        $container.classList.add('container');
        $container.appendChild($googleOauthButton);
        $container.appendChild($separator);
        $container.appendChild(emailForm.$view);
        $container.appendChild(passwordForm.$view);
        $container.appendChild(passwordConfirmForm.$view);
        $container.appendChild(emailPageNextButton.$view);
        $container.appendChild($signInLink);
        $container.appendChild($emailPageAlert);

        this.pageView.appendChild($emailPageTitle, pageIndex)
        this.pageView.appendChild($emailPageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)

        if (emailForm.getValueFromCookies()) {
            emailForm.restoreValueFromCookie();
            this.user.email = emailForm.value;
            this.passwordForm.$view.style.display = 'block';
            this.passwordConfirmForm.$view.style.display = 'block';
        }
    }

    handleEventEmailPage() {
        const _this = this;
        window.addEventListener('googleOauthLoggedIn', (event) => {
            const token = event.detail;
            _this.handleGoogleOauth(token);
        })
        this.emailForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            debuglog(`email changed: ${newValue}`)
            if(_this.emailForm.value.length > 0) {
                this.passwordForm.$view.style.display = 'block';
                this.passwordConfirmForm.$view.style.display = 'block';
            }
        })
        this.passwordForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            debuglog(`password changed: ${newValue}`)
        })
        this.passwordConfirmForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            debuglog(`password confim changed: ${newValue}`)
        })
        this.emailForm.$view.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {  // 13 is the keycode for Enter
                event.preventDefault();
                if(!_this.emailForm.validate()){
                    _this.passwordForm.$textArea.focus();
                }
            }
        });
        this.emailForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                _this.emailForm.validate();
                _this.passwordForm.$view.style.display = 'block';
                _this.passwordConfirmForm.$view.style.display = 'block';
                _this.passwordForm.$textArea.focus();
            }
        });
        this.passwordForm.$view.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {  // 13 is the keycode for Enter
                event.preventDefault();
                if(!_this.passwordForm.validate()) {
                    _this.passwordConfirmForm.$textArea.focus();
                }
            }
        });
        this.passwordForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                _this.passwordForm.validate()
                _this.passwordConfirmForm.$textArea.focus();
            }
        });
        this.passwordConfirmForm.$view.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {  // 13 is the keycode for Enter
                event.preventDefault();
                if(!_this.passwordConfirmForm.validate()) {
                    _this.handleEmailNext();
                }
            }
        });
        this.passwordConfirmForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                _this.passwordConfirmForm.validate()
                _this.emailPageNextButton.$view.focus();
            }
        });
        this.emailPageNextButton.$view.addEventListener('click', ()=> {
            _this.handleEmailNext();
        });
        this.emailPageNextButton.$view.addEventListener('touchend', () => {
            _this.handleEmailNext();
        });
    }

    handleEmailNext() {
        console.log(this.emailForm.value)
        this.$emailPageAlert.style.display = 'none';
        if(!this.emailForm.validate() && !this.passwordForm.validate() && !this.passwordConfirmForm.validate()) {
            if(this.passwordForm.value != this.passwordConfirmForm.value) {
                console.warn('not correspond')
                this.passwordConfirmForm.alert(this.locale.get('password_not_corresponding', this.lang));
            }
            console.warn('ok')
            this.emailPageNextButton.load(true);

            const email = this.emailForm.value;
            const password = this.passwordForm.value;
            Http.post(`/v1/${this.lang}/users/create`, { email, password },
                (res) => {
                    const { code, message } = res;
                    console.log(`[${code} success] ${message}`);
                    this.pageView.show(SignupPageIndex.code);
                    this.updateQueryString({key: 'page', value: 'code'});
                    this.user.email = email;
                    this.emailForm.setValueToCookies(email);
                    this.emailPageNextButton.load(false);
                },
                (error) => {
                    if (error && error.code) {
                        console.log(`[error] code:${error.code} reason:${error.reason}`);
                        if (error.code == 400) {
                            // validation error
                            const { errors } = error; 
                            if (errors) {
                                errors.forEach(errorObj => {
                                    const {field_name, message} = errorObj;
                                    switch (field_name) {
                                        case 'email':
                                            this.emailForm.alert(message)
                                            break;
                                        case 'password':
                                            this.passwordForm.alert(message)
                                            break;
                                    }
                                });
                            }
                        }
                        if (error.code == 409) {
                            // already exists error
                            const { message } = error;
                            this.emailForm.alert(message);
                        }
                        if (error.code == 429) {
                            // signup restriction
                            const { message } = error;
                            this.setRestrictedMessage(message);
                            this.pageView.show(SignupPageIndex.restricted);
                        }
                        if (error.code == 500) {
                            const { message } = error;
                            this.$emailPageAlert.style.display = 'block';
                            this.$emailPageAlert.textContent = message;
                        }
                        this.emailPageNextButton.load(false);
                    } else {
                        console.error(error);
                    }
                });
        } else {
            console.warn('not ok')
        }
    }

    handleGoogleOauth(token) {
        console.log(this.emailForm.value)
        this.$emailPageAlert.style.display = 'none';
        this.emailPageNextButton.load(true);

        Http.post(`/v1/${this.lang}/users/create/googleoauth`, { token },
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.pageView.show(SignupPageIndex.code);
                this.updateQueryString({key: 'page', value: 'code'});
                this.emailPageNextButton.load(false);
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason: ${error.reason}`);
                    if (error.code == 400 || error.code == 401 || error.code == 403) {
                        // validation error || token invalid
                        const { errors } = error; 
                        if (errors) {
                            errors.forEach(errorObj => {
                                const {field_name, message} = errorObj;
                                switch (field_name) {
                                    case 'token':
                                        this.$emailPageAlert.style.display = 'block';
                                        this.$emailPageAlert.textContent = message;
                                        break;
                                }
                            });
                        }
                    }
                    else if (error.code == 429) {
                        // signup restriction
                        const { message } = error;
                        this.setRestrictedMessage(message);
                        console.log('go to restricted page.')
                        this.pageView.show(SignupPageIndex.restricted);
                    }
                    else if (error.code == 409 || error.code == 500) {
                        // already exists error || internal server error
                        const { message } = error;
                        this.$emailPageAlert.style.display = 'block';
                        this.$emailPageAlert.textContent = message;
                    }
                    this.emailPageNextButton.load(false);
                } else {
                    console.error(error);
                }
            });
    }

    // Verify Code Page
    createVerifyCodePage() {
        const pageIndex = SignupPageIndex.code;
        this.pageView.pages[pageIndex].container.classList.add('VerifyCodePage');

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backVerifyCode = $back;

        this.appendLogo(this.pageView, pageIndex);

        const $verifyCodePageTitle = document.createElement('h3');
        $verifyCodePageTitle.classList.add('title');
        $verifyCodePageTitle.classList.add('veirifyCode');
        $verifyCodePageTitle.textContent = locale.get('signup_verify_code_title', lang);

        const $verifyCodePageSubtitle = document.createElement('p');
        $verifyCodePageSubtitle.classList.add('subtitle');
        $verifyCodePageSubtitle.classList.add('verifycode');
        $verifyCodePageSubtitle.textContent = locale.get('signup_verify_code_subtitle', lang);
        console.warn(this.locale)

        const verifyCodeForm = new VerifyCodeForm({
            id: 'VerifyCodeForm',
            errorMessageUnfilled: locale.get('signup_verify_code_unfilled', lang),
            inputCompleteEventName: 'verificationInputComplete',
        })
        this.verifyCodeForm = verifyCodeForm;

        const verifyCodePageNextButton = new LoadButton({
            id: 'verifyCodePageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        verifyCodePageNextButton.$button.classList.add('nextButton');

        const $verifyCodePageAlert = document.createElement('p');
        $verifyCodePageAlert.id = 'verifyCodePageAlert';
        $verifyCodePageAlert.classList.add('pageAlert');
        $verifyCodePageAlert.style.display = 'none';

        this.verifyCodePageNextButton = verifyCodePageNextButton;
        this.$verifyCodePageAlert = $verifyCodePageAlert;

        const $container = document.createElement('div');
        $container.classList.add('container');
        $container.appendChild(verifyCodeForm.$view);
        $container.appendChild(verifyCodePageNextButton.$view);
        $container.appendChild($verifyCodePageAlert);

        this.pageView.appendChild(this.$backVerifyCode, pageIndex)
        this.pageView.appendChild($verifyCodePageTitle, pageIndex)
        this.pageView.appendChild($verifyCodePageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)
    }

    handleEventVerifyCodePage() {
        const _this = this;
        this.verifyCodePageNextButton.$view.addEventListener('click', (event)=> {
            _this.verifyCodePageNextButton.$view.focus();
            if(_this.verifyCodeForm.validate()) {
                _this.sendVerificationCode(this.verifyCodeForm.value);
            }
        });
        this.verifyCodeForm.$view.addEventListener('verificationInputComplete', (event)=> {
            _this.verifyCodePageNextButton.$view.focus();
            const code = event.detail;
            _this.sendVerificationCode(code);
        });
        this.$backVerifyCode.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.pageView.prev();
            _this.updateQueryString({key: 'page', value: 'email'});
        })
    }

    sendVerificationCode(code) {
        this.verifyCodePageNextButton.load(true);

        Http.post(`/v1/${this.lang}/users/verify_code`, { code },
            (res) => {
                const { code, message, email, google_id } = res;
                console.log(`[${code} success] ${message} ${email} ${google_id}`);
                this.pageView.show(SignupPageIndex.verified);
                this.updateQueryString({key: 'page', value: 'verified'});
                this.user.email = email;
                this.emailForm.setValueToCookies(email);
                this.verifyCodePageNextButton.load(false);
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
                    if (error.code == 401) {  // Assuming 302 or any specific code you decide to use for redirects
                        console.error('no user found. redirect to signup page.')
                        const { message, redirect_url } = error;
                        //window.location.href = redirect_url;
                        this.$verifyCodePageAlert.style.display = 'block';
                        this.$verifyCodePageAlert.textContent = message;
                    }
                    else if (error.code == 400) {
                        // mismatch, expired, validation or other failer
                        const { errors } = error; 
                        if (errors) {
                            errors.forEach(errorObj => {
                                const {field_name, message} = errorObj;
                                switch (field_name) {
                                    case 'code':
                                        this.$verifyCodePageAlert.style.display = 'block';
                                        this.$verifyCodePageAlert.textContent = message;
                                        break;
                                }
                            });
                        } else {
                            const { message } = error;
                            this.$verifyCodePageAlert.style.display = 'block';
                            this.$verifyCodePageAlert.textContent = message;
                        }
                    }
                    else if (error.code == 500) {
                        const { message } = error;
                        this.$verifyCodePageAlert.style.display = 'block';
                        this.$verifyCodePageAlert.textContent = message;
                    } else {
                        const { message } = error;
                        this.$verifyCodePageAlert.style.display = 'block';
                        this.$verifyCodePageAlert.textContent = message;
                    }
                    this.verifyCodePageNextButton.load(false);
                } else {
                    console.error(error);
                }
            });
    }

    // Verified Page
    createVerifiedPage() {
        const pageIndex = SignupPageIndex.verified;
        this.pageView.pages[pageIndex].container.classList.add('VerifiedPage');

        this.appendLogo(this.pageView, pageIndex);

        const $verifiedMark = document.createElement('img');
        $verifiedMark.src = '/img/ok-icon.svg';
        $verifiedMark.classList.add('icon');

        const $verifiedMessage = document.createElement('h4');
        $verifiedMessage.classList.add('verifiedMessage');
        $verifiedMessage.textContent = locale.get('signup_verified_message', lang);

        const $presentNotice = document.createElement('div');
        $presentNotice.classList.add('presentNoticeContainer');

        const $presentNoticeMain = document.createElement('span');
        $presentNoticeMain.classList.add('presentNoticeMain')
        const $presentNoticeHighlightText = document.createElement('p');
        $presentNoticeHighlightText.classList.add('mainHighlightText');
        $presentNoticeHighlightText.textContent = locale.get('signup_verified_present_highlight', lang, [window.freeCall*window.unitPrice])
        const $presentNoticeUnHighlightText = document.createElement('p');
        $presentNoticeUnHighlightText.classList.add('mainUnhighlightText');
        $presentNoticeUnHighlightText.textContent = locale.get('signup_verified_present_unhighlight', lang)
        const $presentNoticeSub = document.createElement('p');
        $presentNoticeSub.classList.add('subText')
        $presentNoticeSub.textContent = locale.get('signup_verified_present_sub', lang)

        $presentNoticeMain.appendChild($presentNoticeHighlightText);
        $presentNoticeMain.appendChild($presentNoticeUnHighlightText);
        $presentNotice.appendChild($presentNoticeMain);
        $presentNotice.appendChild($presentNoticeSub);

        const verifiedPageNextButton = new LoadButton({
            id: 'verifiedPageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        verifiedPageNextButton.$button.classList.add('nextButton');

        const $verifiedPageAlert = document.createElement('p');
        $verifiedPageAlert.id = 'verifiedPageAlert';
        $verifiedPageAlert.classList.add('pageAlert');
        $verifiedPageAlert.style.display = 'none';

        this.verifiedPageNextButton = verifiedPageNextButton;
        this.$verifiedPageAlert = $verifiedPageAlert;

        const $container = document.createElement('div');
        $container.classList.add('container');

        $container.appendChild($verifiedMark);
        $container.appendChild($verifiedMessage);
        $container.appendChild($presentNotice);
        $container.appendChild(verifiedPageNextButton.$view);
        $container.appendChild($verifiedPageAlert);
       
        this.pageView.appendChild($container, pageIndex)
    }
    handleEventVerifiedPage() {
        const _this = this;
        this.verifiedPageNextButton.$view.addEventListener('click', (event)=>{
            _this.pageView.show(SignupPageIndex.origin);
            _this.updateQueryString({key: 'page', value: 'origin'});
        });
    }

    // Origin Page
    createOriginPage() {
        const pageIndex = SignupPageIndex.origin;
        this.pageView.pages[pageIndex].container.classList.add('OriginPage');

        this.appendLogo(this.pageView, pageIndex);

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backOrigin = $back;

        const $originPageTitle = document.createElement('h3');
        $originPageTitle.classList.add('title');
        $originPageTitle.classList.add('veirifyCode');
        $originPageTitle.textContent = locale.get('signup_origin_title', lang);

        const $originPageSubtitle = document.createElement('p');
        $originPageSubtitle.classList.add('subtitle');
        $originPageSubtitle.classList.add('verifycode');
        $originPageSubtitle.textContent = locale.get('signup_origin_subtitle', lang);

        const $wrapper = document.createElement('div');
        $wrapper.classList.add('originWrapper');

        const originForm = new TextField({
            id: 'OriginForm',
            fieldName: 'origin',
            validators: [
                new Validator({
                    errorType: ValidationErrorType.required,
                    errorMessage: locale.get(ValidationErrorType.required, this.lang)
                }),
                new Validator({
                    errorType: ValidationErrorType.maxLength,
                    errorMessage: locale.get(ValidationErrorType.maxLength, this.lang),
                    maxLength: 100}),
                new Validator({
                    errorType: ValidationErrorType.domainFormat,
                    errorMessage: locale.get(ValidationErrorType.domainFormat, this.lang)}),
                ],
            hasTitle: true,
            title: locale.get('signup_origin_form_title', lang),
            placeholder: locale.get('signup_origin_form_placeholder', lang),
            isCounter: false,
        })
        originForm.restoreValueFromCookie();

        const $explanation = document.createElement('div');
        $explanation.classList.add('explanation');
        const $explanationIcon = document.createElement('img');
        $explanationIcon.src = '/img/bulb-icon.svg';
        const $explanationText = document.createElement('p');
        $explanationText.textContent = locale.get('signup_origin_explanation_default', lang);

        $explanation.appendChild($explanationIcon);
        $explanation.appendChild($explanationText);

        $wrapper.appendChild(originForm.$view);
        $wrapper.appendChild($explanation);

        const originPageNextButton = new LoadButton({
            id: 'originPageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        originPageNextButton.$button.classList.add('nextButton');

        const $originPageAlert = document.createElement('p');
        $originPageAlert.id = 'originPageAlert';
        $originPageAlert.classList.add('pageAlert');
        $originPageAlert.style.display = 'none';

        this.originForm = originForm;
        this.$explanationText = $explanationText;
        this.originPageNextButton = originPageNextButton;
        this.$originPageAlert = $originPageAlert;

        const $container = document.createElement('div');
        $container.classList.add('container');
        $container.appendChild($wrapper);
        $container.appendChild(originPageNextButton.$view);
        $container.appendChild($originPageAlert);

        this.pageView.appendChild(this.$backOrigin, pageIndex)
        this.pageView.appendChild($originPageTitle, pageIndex)
        this.pageView.appendChild($originPageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)
 
    }

    handleEventOriginPage() {
        const _this = this;
        this.originForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            if(!this.originForm.validate()) {
                debuglog(`origin changed -> ${this.user.email}`)
                switch (_this.checkDomainType(this.user.email)) {
                    case DomainType.public:
                        debuglog('domain type: public')
                        _this.$explanationText.textContent = locale.get('signup_origin_explanation_public_domain', lang)
                        _this.$explanationText.classList.remove('alert');
                        break
                    case DomainType.original:
                        debuglog('domain type: original')
                        _this.$explanationText.textContent = locale.get('signup_origin_explanation_original_domain', lang)
                        _this.$explanationText.classList.remove('alert');
                        break
                    case DomainType.others:
                        debuglog('domain type: others')
                        _this.$explanationText.textContent = locale.get('signup_origin_explanation_others_domain', lang);
                        _this.$explanationText.classList.add('alert');
                        break
                    default:
                        console.warn('Unknown domain type.')
                        break
                }
            }
        })
        this.originForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                _this.submitOrigin();
            }
        });
        this.originPageNextButton.$view.addEventListener('click', (event)=> {
            event.preventDefault();
            _this.submitOrigin();
        });
        this.$backOrigin.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.pageView.prev();
            _this.updateQueryString({key: 'page', value: 'verified'});
        })
    }
 
    checkDomainType(email) {
        const emailDomain = email.split('@').pop();
        const url = new URL(`http://${this.originForm.value}`);
        const originDomain = url.hostname;
        const parsedPath = url.pathname;

        console.log('URL:', url);
        console.log('Email domain:', emailDomain);
        console.log('Origin domain:', originDomain);
        console.log('Parsed path:', parsedPath);

        if (parsedPath !== '' && parsedPath !== '/') {
            console.info(`[Origin type: public] Origin ${parsedPath} has a valid path and is considered verified.`);
            return DomainType.public;
        }
        else if (emailDomain === originDomain) {
            console.info(`[Origin type: original] Origin domain ${originDomain} matches email domain ${emailDomain}.`);
            return DomainType.original;
        }
        else {
            console.error(`Origin ${originDomain} is neither the same as the email domain nor includes a specific URL path.`);
            return DomainType.others;
        }
    }

    submitOrigin() {
        console.log(`submit origin:${this.originForm.value}`);
        this.$originPageAlert.style.display = 'none';
        if(!this.originForm.validate()) {
            console.warn('ok')
            this.originPageNextButton.load(true);

            const origin = this.originForm.value;
            Http.post(`/v1/${this.lang}/users/create/origin`, { origin },
                (res) => {
                    const { code, message } = res;
                    console.log(`[${code} success] ${message}`);
                    this.pageView.show(SignupPageIndex.card);
                    this.updateQueryString({key: 'page', value: 'card'});
                    this.user.origin = origin;
                    this.originForm.setValueToCookies(origin);
                    this.pageView.show(SignupPageIndex.card);
                    this.originPageNextButton.load(false);
                },
                (error) => {
                    if (error && error.code) {
                        console.log(`[error] code:${error.code} reason:${error.reason}`);
                        if (error.code == 400) {
                            // validation error
                            const { errors } = error; 
                            if (errors) {
                                errors.forEach(errorObj => {
                                    const {field_name, message} = errorObj;
                                    switch (field_name) {
                                        case 'origin':
                                            this.originForm.alert(message)
                                            break;
                                    }
                                });
                            }
                            // Bad request
                            const { message } = error;
                            if (message) {
                                this.originForm.alert(message)
                            }
                        } else {
                            const { message } = error;
                            this.$originPageAlert.style.display = 'block';
                            this.$originPageAlert.textContent = message;
                        }
                        this.originPageNextButton.load(false);
                    } else {
                        console.error(error);
                    }
                });
        } else {
            console.warn('not ok')
        }

    }

    createCardPage() {
        const pageIndex = SignupPageIndex.card;
        this.pageView.pages[pageIndex].container.classList.add('CardPage');

        this.appendLogo(this.pageView, pageIndex);

        const $stripeLogo = document.createElement('img');
        $stripeLogo.src = '/img/powerd_by_stripe_black.svg';
        $stripeLogo.classList.add('stripeLogo');

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backCard = $back;

        const $cardPageTitle = document.createElement('h3');
        $cardPageTitle.classList.add('title');
        $cardPageTitle.textContent = locale.get('signup_card_title', lang);

        const $cardPageSubtitle = document.createElement('p');
        $cardPageSubtitle.classList.add('subtitle');
        $cardPageSubtitle.textContent = locale.get('signup_card_subtitle', lang);

        const $cardInputView = document.createElement('div');
        $cardInputView.id = 'CardInputView';
        $cardInputView.classList.add('CardInputView');

        const $loading = document.createElement('img');
        $loading.classList.add('loading');
        $loading.src = '/img/loading.svg'

        const cardPageNextButton = new LoadButton({
            id: 'cardPageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        cardPageNextButton.$button.classList.add('nextButton');

        const $cardPageAlert = document.createElement('p');
        $cardPageAlert.id = 'cardPageAlert';
        $cardPageAlert.classList.add('pageAlert');
        $cardPageAlert.style.display = 'none';

        this.$cardInputView = $cardInputView;
        this.cardPageNextButton = cardPageNextButton;
        this.$cardPageAlert = $cardPageAlert;

        const $container = document.createElement('div');
        $cardInputView.appendChild($loading)
        $container.classList.add('container');
        $container.appendChild($cardInputView);
        $container.appendChild($stripeLogo);
        $container.appendChild(cardPageNextButton.$view);
        $container.appendChild($cardPageAlert);

        this.pageView.appendChild(this.$backCard, pageIndex)
        this.pageView.appendChild($cardPageTitle, pageIndex)
        this.pageView.appendChild($cardPageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)
 
        const cardInputView = new CardInputView({
            id: 'CardInputView',
            lang: this.lang,
            mountElementId: 'CardInputView',
            redirectUrl: `https://quantz.thinkxinc.com/v1/${lang}/signup?page=limit&email=${this.user.email}&service=${new URLSearchParams(window.location.search).get('service') || ''}`
        });
        this.cardInputView = cardInputView;
    } 

    handleEventCardPage() {
        const _this = this;
        this.$cardInputView.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                _this.submitCard(e);
            }
        });
        this.cardPageNextButton.$view.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.submitCard(e);
        });
        this.$backCard.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.pageView.prev();
            _this.updateQueryString({key: 'page', value: 'origin'});
        })
    }

    submitCard(e) {
        const _this = this;
        this.cardPageNextButton.load(true);
        this.cardInputView.submitCard({
            event: e,
            email: this.user.email,
            onError: (error)=> {
                _this.$cardPageAlert.style.display = 'block';
                _this.$cardPageAlert.textContent = error;
                const $cardPageElement = document.querySelector('.CardPage');
                if ($cardPageElement) {
                    $cardPageElement.scroll({
                        top: $cardPageElement.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            },
            onComplete: () => {
                _this.cardPageNextButton.load(false);  // Hide loading indication
            } 
        });
    }

    async submitCreditCardToken(paymentMethodId) {
        const response = await fetch(`/v1/${this.lang}/users/update/credit_card_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credit_card_token: paymentMethodId
            })
        })

        const data = await response.json();
        if (!response.ok) {
            const { message } = data;
            this.$cardPageAlert.style.display = 'block';
            this.$cardPageAlert.textContent = message;
        }
    }

    createLimitPage() {
        const pageIndex = SignupPageIndex.limit;
        this.pageView.pages[pageIndex].container.classList.add('LimitPage');

        this.appendLogo(this.pageView, pageIndex);

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backLimit = $back;

        const $limitPageTitle = document.createElement('h3');
        $limitPageTitle.classList.add('title');
        $limitPageTitle.textContent = locale.get('signup_limit_title', lang);

        const $limitPageSubtitle = document.createElement('p');
        $limitPageSubtitle.classList.add('subtitle');
        $limitPageSubtitle.textContent = locale.get('signup_limit_subtitle', lang);

        const $container = document.createElement('div');
        $container.classList.add('container');

        const min = 1;
        const max = 99999;
        const defaultLimit = 20;
        const maxMessage = 10;
        this.averageInterviewPrice = interviewCreditPerResponse*unitPrice*8; // USD

        const $line1 = document.createElement('div');
        $line1.classList.add('line1')
        const $max = document.createElement('span');
        $max.classList.add('max')
        $max.textContent = locale.get('signup_limit_max', lang)
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
            defaultValue: `${defaultLimit}`,
            isCounter: false,
            isIncrementer: true,
            incrementButtonPlace: TextFieldPlaceTo.inputAfter,
            incrementUpImgSrc: '/img/up.svg',
            incrementDownImgSrc: '/img/down.svg',
        });
        const $maxDesc = document.createElement('span');
        const maxChargeDefault = this.calcMaxChage(defaultLimit);
        $maxDesc.classList.add('maxDesc')
        $maxDesc.textContent = locale.get('signup_limit_max_description', lang)
        $line1.appendChild($max);
        $line1.appendChild(this.limitForm.$view);
        $line1.appendChild($maxDesc);

        const $line2 = document.createElement('div');
        $line2.classList.add('line2');
        const $maxCharge = document.createElement('span');
        $maxCharge.classList.add('maxCharge');
        $maxCharge.textContent = locale.get('signup_limit_max_charge', lang);
        const $maxEstimatedUsage = document.createElement('span');
        $maxEstimatedUsage.classList.add('maxEstimatedUsage')
        $maxEstimatedUsage.textContent = locale.get('signup_limit_max_estimated_usage', lang, [parseInt(this.limitForm.value/this.averageInterviewPrice)]);
        $line2.appendChild($maxCharge);
        $line2.appendChild($maxEstimatedUsage);

        const $notes = document.createElement('div');
        $notes.classList.add('notes');
        const $note1 = document.createElement('p');
        $note1.classList.add('note')
        $note1.textContent = locale.get('signup_limit_note1', lang, [freeCall*unitPrice]);
        const $note2 = document.createElement('p');
        $note2.classList.add('note')
        const pricePerResponseGeneral = unitPrice*generalCreditPerResponse;
        const pricePerResponseInterview = unitPrice*interviewCreditPerResponse;
        $note2.textContent = locale.get('signup_limit_note2', lang, ...[parseFloat(pricePerResponseGeneral.toFixed(2)), parseFloat(pricePerResponseInterview.toFixed(2))]);
        const $note3 = document.createElement('p');
        $note3.classList.add('note')
        $note3.textContent = locale.get('signup_limit_note3', lang, [maxMessage]);
        $notes.appendChild($note2);
        $notes.appendChild($note1);
        $notes.appendChild($note3);

        const limitPageNextButton = new LoadButton({
            id: 'limitPageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        limitPageNextButton.$button.classList.add('nextButton');

        const $limitPageAlert = document.createElement('p');
        $limitPageAlert.id = 'limitPageAlert';
        $limitPageAlert.classList.add('pageAlert');
        $limitPageAlert.style.display = 'none';

        this.$maxEstimatedUsage = $maxEstimatedUsage;
        this.limitPageNextButton = limitPageNextButton;
        this.$limitPageAlert = $limitPageAlert;

        $container.appendChild($line1);
        $container.appendChild($line2);
        $container.appendChild($notes);
        $container.appendChild(limitPageNextButton.$view);
        $container.appendChild($limitPageAlert);

        this.pageView.appendChild(this.$backLimit, pageIndex)
        this.pageView.appendChild($limitPageTitle, pageIndex)
        this.pageView.appendChild($limitPageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)
    }

    handleEventLimitPage() {
        const _this = this;
        this.limitForm.$view.addEventListener('textchanged', (e)=> {
            const {newValue} = e.detail;
            debuglog(`limit changed: ${newValue}`)
            if(!this.limitForm.validate()) {
                this.$maxEstimatedUsage.textContent = locale.get('signup_limit_max_estimated_usage', lang, [parseInt(newValue/this.averageInterviewPrice)])
            }

        })
        this.limitPageNextButton.$view.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.submitLimit(e);
        });
        this.$backLimit.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.pageView.prev();
            _this.updateQueryString({key: 'page', value: 'card'});
        })
    }

    calcMaxChage(limit) {
        const maxCharge = Number(limit) * unitPrice;
        return parseFloat(maxCharge.toFixed(2));
    }

    submitLimit(e) {
        console.log(this.limitForm.value)
        this.$limitPageAlert.style.display = 'none';
        if(!this.limitForm.validate()) {
            this.limitPageNextButton.load(true);

            const usage_limit = this.limitForm.value;
            Http.post(`/v1/${this.lang}/users/update/usage_limit`, { usage_limit },
                (res) => {
                    const { code, message } = res;
                    console.log(`[${code} success] ${message}`);
                    this.pageView.show(SignupPageIndex.terms);
                    this.updateQueryString({key: 'page', value: 'terms'});
                    this.user.usage_limit = usage_limit;
                    this.limitForm.setValueToCookies(usage_limit);
                    this.limitPageNextButton.load(false);
                },
                (error) => {
                    if (error && error.code) {
                        console.log(`[error] code:${error.code} reason:${error.reason}`);
                        if (error.code == 400) {
                            // validation error
                            const { errors } = error; 
                            if (errors) {
                                errors.forEach(errorObj => {
                                    const {field_name, message} = errorObj;
                                    switch (field_name) {
                                        case 'limit':
                                            this.limitForm.alert(message)
                                            break;
                                    }
                                });
                            }
                            // Bad request
                            const { message } = error;
                            if (message) {
                                this.limitForm.alert(message)
                            }
                        } else {
                            const { message } = error;
                            this.$limitPageAlert.style.display = 'block';
                            this.$limitPageAlert.textContent = message;
                        }
                        this.limitPageNextButton.load(false);
                    } else {
                        console.error(error);
                    }
                });
        }

    }

    createTermsPage() {
        const pageIndex = SignupPageIndex.terms;
        this.pageView.pages[pageIndex].container.classList.add('TermsPage');

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backTerms = $back;

        const $termsTitle = document.createElement('h4');
        $termsTitle.classList.add('title');
        $termsTitle.textContent = locale.get('signup_terms_title', lang);

        const termsScrollView = new TermsScrollView({
            id: 'Terms',
            templateUrl: `/${lang}/terms/agreement`
        })
        this.termsScrollView = termsScrollView

        const termsPageNextButton = new LoadButton({
            id: 'termsPageNextButton',
            labelText: this.locale.get('signup_terms_next_button', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        termsPageNextButton.$button.classList.add('nextButton');
        this.termsPageNextButton = termsPageNextButton;
        this.termsPageNextButton.disable(true);

        const $container = document.createElement('div');
        $container.classList.add('container');

        $container.appendChild($termsTitle);
        $container.appendChild(termsScrollView.$view);
        $container.appendChild(termsPageNextButton.$view);

        this.pageView.appendChild($back, pageIndex);
        this.pageView.appendChild($container, pageIndex)

    }

    handleEventTermsPage() {
        const _this = this;
        this.termsScrollView.$view.addEventListener('reachedBottom', (e)=>{
            console.warn('*********** reached')
            _this.termsPageNextButton.disable(false);
        })
        this.termsScrollView.$view.addEventListener('keyup', (e)=>{
            if (e.key === 'Enter') {  // 13 is the keycode for Enter
                e.preventDefault();
                if(!_this.emailForm.validate()){
                    _this.passwordForm.$textArea.focus();
                }
            }
        });
        this.termsPageNextButton.$view.addEventListener('click', (e)=> {
            if (_this.termsPageNextButton.isDisable) { return }
            _this.pageView.show(SignupPageIndex.complete);
            _this.updateQueryString({key: 'page', value: 'complete'});
        })
        this.$backTerms.addEventListener('click', (e)=>{
            e.preventDefault();
            _this.pageView.show(SignupPageIndex.limit);
            _this.updateQueryString({key: 'page', value: 'limit'});
        })

    }

    createCompletePage() {
        const pageIndex = SignupPageIndex.complete;
        this.pageView.pages[pageIndex].container.classList.add('CompletePage');

        this.appendLogo(this.pageView, pageIndex);
        //const $completeMark = document.createElement('img');
        //$completeMark.src = '/img/ok-icon.svg';
        //$completeMark.classList.add('completeMark');

        const $completeMessage = document.createElement('h4');
        $completeMessage.textContent = locale.get('signup_complete_message', lang);

        const $completeSubMessage = document.createElement('p');
        $completeSubMessage.textContent = locale.get('signup_complete_sub_message', lang);

        const $completeSubMessage2 = document.createElement('p');
        $completeSubMessage2.textContent = locale.get('signup_complete_sub_message2', lang);

        const completePageNextButton = new LoadButton({
            id: 'completePageNextButton',
            labelText: this.locale.get('completebutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        completePageNextButton.$button.classList.add('nextButton');

        this.completePageNextButton = completePageNextButton;

        const $container = document.createElement('div');
        $container.classList.add('container');

        $container.appendChild($completeMessage);
        $container.appendChild($completeSubMessage);
        $container.appendChild($completeSubMessage2);
        $container.appendChild(completePageNextButton.$view);
       
        this.pageView.appendChild($container, pageIndex)
    }

    handleEventCompletePage() {
        const _this = this;
        this.completePageNextButton.$view.addEventListener('click', () => {
            console.log('All done');
            this.completePageNextButton.load(true);
            console.log('Redirecting to the appropriate page...');
    
            // Check if `service` parameter exists in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const service = urlParams.get('service');
    
            if (service === 'interview') {
                // Redirect to interviews page
                window.location.href = `/v1/${lang}/interviews`;
            } else {
                // Default redirection to home page
                window.location.href = `/v1/${lang}/home`;
            }
        });
    }

    createRestrictedPage() {
        const pageIndex = SignupPageIndex.restricted;
        this.pageView.pages[pageIndex].container.classList.add('RestrictedPage');

        this.appendLogo(this.pageView, pageIndex);

        const $restrictedMessage = document.createElement('h4');
        $restrictedMessage.classList.add('restrictedMessage');
        $restrictedMessage.textContent = locale.get('signup_restricted', lang);  // default message (must be overridden)

        const $restrictedPageBackToTopButton = document.createElement('button');
        $restrictedPageBackToTopButton.classList.add('backToTopButton');
        $restrictedPageBackToTopButton.textContent = locale.get('back_to_top', lang);

        const $restrictedPageAlert = document.createElement('p');
        $restrictedPageAlert.id = 'restrictedPageAlert';
        $restrictedPageAlert.classList.add('pageAlert');
        $restrictedPageAlert.style.display = 'none';

        this.$restrictedPageBackToTopButton = $restrictedPageBackToTopButton;
        this.$restrictedPageAlert = $restrictedPageAlert;
        this.$restrictedMessage = $restrictedMessage;

        const $container = document.createElement('div');
        $container.classList.add('container');

        //$container.appendChild($restrictedMark);
        $container.appendChild($restrictedMessage);
        $container.appendChild($restrictedPageBackToTopButton);
        $container.appendChild($restrictedPageAlert);
       
        this.pageView.appendChild($container, pageIndex)
    }

    setRestrictedMessage(message) {
        this.$restrictedMessage.textContent = message;
    }

    handleEventRestrictedPage() {
        const _this = this;
        this.$restrictedPageBackToTopButton.addEventListener('click', ()=> {
            console.log('Redirecting to top page...');
            window.location.href = `/${lang}`;
        })
    }


    // helpers

    updateQueryString({
        key, value
    }) {
        let url = new URL(window.location.href);
        url.searchParams.set(key, value);
        history.pushState(null, '', url);
        return url.toString();
    }
}

