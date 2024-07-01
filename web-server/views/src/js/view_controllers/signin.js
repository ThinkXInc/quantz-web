document.addEventListener('DOMContentLoaded', ()=>{
    const lang = window.lang;
    const locale = window.locale;
    const redirectUrl = window.redirectUrl;

    console.log(`set up signin view.\nlang:${lang}`);

    // initialize signin view
    const signin = new Signin({
        locale: locale,
        lang: lang,
        redirectUrl: redirectUrl//`https://quantz.thinkxinc.com/${lang}/home`
    });
});

const SigninPageIndex = Object.freeze({
    login: 0, forgot: 1, sent: 2, reset: 3, done: 4
})

class Signin {
    constructor({
        locale,
        lang,
        redirectUrl,
    }) {
        this.locale = locale;
        this.lang = lang;
        this.redirectUrl = redirectUrl;
        this.user = {};

        this.setupView();

        const urlParams = new URLSearchParams(window.location.search);
        const pageId = urlParams.get('page');
        switch(pageId) {
            case 'login':
                this.pageView.show(SigninPageIndex.login)
                break;
            case 'forgot':
                this.pageView.show(SigninPageIndex.forgot)
                break;
            case 'sent':
                this.pageView.show(SigninPageIndex.sent)
                break;
            case 'reset':
                this.resetCode = urlParams.get('reset_code');
                this.resetEmail = urlParams.get('email');
                this.pageView.show(SigninPageIndex.reset)
                break;
            case 'done':
                this.pageView.show(SigninPageIndex.done)
                break;
            default:
                break;
        }
    }

    setupView() {
        const pageView = new PageView({
            id: 'signinPageView',
            numPages: 5
        })
        this.pageView = pageView;

        this.pageView.$view.addEventListener('pageShown', (event) => {
            const { pageIndex, page } = event.detail;
        });
 
        // Page 1: Email
        this.createEmailPage() 
        this.handleEventEmailPage()

        // Page 2: Password Forgot
        this.createPasswordForgotPage()
        this.handleEventPasswordForgotPage()

        // Page 3: Done
        this.createSentPage() 
        this.handleEventSentPage()

        // Page 4: Password Reset
        this.createPasswordResetPage()
        this.handleEventPasswordResetPage()

        // Page 5: Done
        this.createResetDonePage() 
        this.handleEventResetDonePage()

        this.pageView.mount('#signin');
    }

    appendLogo(pageView, pageIndex) {
        const $logoContainer = document.createElement('div');
        $logoContainer.classList.add('logoContainer');

        const $logoLink = document.createElement('a');
        $logoLink.href = '/';

        const $logo = document.createElement('img');
        $logo.classList.add('logo');
        $logo.src = '/img/logo/horizontal@2x.png';
    
        $logoLink.appendChild($logo);
        $logoContainer.appendChild($logoLink);
        pageView.appendChild($logoContainer, pageIndex);
    }

    // Email Page
    createEmailPage() {
        const pageIndex = SigninPageIndex.login;
        this.pageView.pages[pageIndex].container.classList.add('EmailPage');
        this.pageView.pages[pageIndex].container.classList.add('LoginPage');

        // Page 1
        this.appendLogo(this.pageView, pageIndex);

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

        const $emailPageTitle = document.createElement('h3');
        $emailPageTitle.classList.add('title');
        $emailPageTitle.classList.add('email');
        $emailPageTitle.textContent = locale.get('signin_email_title', lang);

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

        const $passwordForgotLink = document.createElement('p');
        $passwordForgotLink.classList.add('passwordForgotLink');
        $passwordForgotLink.textContent = locale.get('signin_password_forgot_link', lang)

        const emailPageNextButton = new LoadButton({
            id: 'emailPageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        emailPageNextButton.$button.classList.add('nextButton');

        const $emailPageAlert = document.createElement('p');
        $emailPageAlert.id = 'emailPageAlert';
        $emailPageAlert.classList.add('pageAlert');
        $emailPageAlert.style.display = 'none';

        this.emailForm = emailForm;
        this.passwordForm = passwordForm;
        this.$passwordForgotLink = $passwordForgotLink;
        this.emailPageNextButton = emailPageNextButton;
        this.$emailPageAlert = $emailPageAlert;

        this.passwordForm.$view.style.display = 'none';

        const $container = document.createElement('div');
        $container.classList.add('container');
        $container.appendChild($googleOauthButton);
        $container.appendChild($separator);
        $container.appendChild(emailForm.$view);
        $container.appendChild(passwordForm.$view);
        $container.appendChild($passwordForgotLink);
        $container.appendChild(emailPageNextButton.$view);
        $container.appendChild($emailPageAlert);

        this.pageView.appendChild($emailPageTitle, pageIndex)
        this.pageView.appendChild($emailPageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)

        if (emailForm.getValueFromCookies()) {
            emailForm.restoreValueFromCookie();
            this.user.email = emailForm.value;
            this.passwordForm.$view.style.display = 'block';
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
            }
        })
        this.passwordForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            debuglog(`password changed: ${newValue}`)
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
                _this.passwordForm.$textArea.focus();
            }
        });
        this.passwordForm.$view.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {  // 13 is the keycode for Enter
                event.preventDefault();
                if(!_this.passwordForm.validate()) {
                    _this.handleEmailNext();
                }
            }
        });
        this.passwordForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                _this.passwordForm.validate()
                _this.emailPageNextButton.$view.focus();
            }
        });
        this.$passwordForgotLink.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.pageView.show(SigninPageIndex.forgot);
            _this.updateQueryString({key: 'page', value: 'forgot'});
        });
        this.emailPageNextButton.$view.addEventListener('click', ()=> {
            _this.handleEmailNext();
        });
    }

    handleEmailNext() {
        console.log(this.emailForm.value)
        this.$emailPageAlert.style.display = 'none';
        if(!this.emailForm.validate() && !this.passwordForm.validate()) {
            this.emailPageNextButton.load(true);

            const email = this.emailForm.value;
            const password = this.passwordForm.value;
            Http.post(`/v1/${this.lang}/users/signin`, { email, password },
                (res) => {
                    const { code, message } = res;
                    console.log(`[${code} success] ${message}`);
                    this.emailForm.setValueToCookies(email);
                    this.redirectToUrl();
                },
                (error) => {
                    if (error && error.code) {
                        console.log(`[error] code:${error.code} reason:${error.reason}`);
                        const { errors } = error; 
                        const { field_name, message } = error;
                        if (errors) {
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
                        } else if (error.code == 409 || error.code == 404) {
                            const { message } = error;
                            this.emailForm.alert(message);
                        } else if (field_name) {
                            switch (field_name) {
                                case 'email':
                                    this.emailForm.alert(message)
                                    break;
                                case 'password':
                                    this.passwordForm.alert(message)
                                    break;
                            }
                        } else {
                            // other error
                            const { message } = error;
                            this.$emailPageAlert.style.display = 'block';
                            this.$emailPageAlert.textContent = message;
                        }
                    }
                },
                () => {
                    this.emailPageNextButton.load(false);
                });
        } else {
            console.warn('not ok')
        }
    }

    handleGoogleOauth(token) {
        console.log(this.emailForm.value)
        this.$emailPageAlert.style.display = 'none';
        this.emailPageNextButton.load(true);

        Http.post(`/v1/${this.lang}/users/signin/googleoauth`, { token },
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.redirectToUrl();
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
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
                    } else if (error.code == 409 || error.code == 404) {
                        const { message } = error;
                        this.emailForm.alert(message);
                    } else if (error.code == 500) {
                        // already exists error || internal server error
                        const { message } = error;
                        this.$emailPageAlert.style.display = 'block';
                        this.$emailPageAlert.textContent = message;
                    }
                } else {
                    console.error(error);
                }
            },
            () => {
                this.emailPageNextButton.load(false);
            }
        );
    }

    redirectToUrl() {
        Browser.redirectToUrl(this.redirectUrl);
    }

    // Page 2: Password Forgot
    createPasswordForgotPage() {
        const pageIndex = SigninPageIndex.forgot;
        this.pageView.pages[pageIndex].container.classList.add('ForgotPage');

        this.appendLogo(this.pageView, pageIndex);

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backForgot = $back;

        const $forgotPageTitle = document.createElement('h3');
        $forgotPageTitle.classList.add('title');
        $forgotPageTitle.classList.add('forgot');
        $forgotPageTitle.textContent = locale.get('signin_forgot_title', lang);

        const $forgotPageSubtitle = document.createElement('p');
        $forgotPageSubtitle.classList.add('subtitle');
        $forgotPageSubtitle.classList.add('forgot');
        $forgotPageSubtitle.textContent = locale.get('signin_forgot_subtitle', lang);
        console.warn(this.locale)

        const emailMaxLength = 100;
        const forgotForm = new TextField({
            id: 'forgotForm',
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

        const forgotPageNextButton = new LoadButton({
            id: 'forgotPageNextButton',
            labelText: this.locale.get('sendbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        forgotPageNextButton.$button.classList.add('nextButton');

        const $forgotPageAlert = document.createElement('p');
        $forgotPageAlert.id = 'forgotPageAlert';
        $forgotPageAlert.classList.add('pageAlert');
        $forgotPageAlert.style.display = 'none';

        this.forgotForm = forgotForm;
        this.forgotPageNextButton = forgotPageNextButton;
        this.$forgotPageAlert = $forgotPageAlert;

        const $container = document.createElement('div');
        $container.classList.add('container');
        $container.appendChild(forgotForm.$view);
        $container.appendChild(forgotPageNextButton.$view);
        $container.appendChild($forgotPageAlert);

        this.pageView.appendChild(this.$backForgot, pageIndex)
        this.pageView.appendChild($forgotPageTitle, pageIndex)
        this.pageView.appendChild($forgotPageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)

        if (this.emailForm.getValueFromCookies()) {
            forgotForm.restoreValueFromCookie();
        }
    }
    handleEventPasswordForgotPage() {
        const _this = this;
        this.forgotForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                if(!this.forgotForm.validate()) {
                    this.sendResetMailRequest(this.forgotForm.value);
                }
            }
        });
        this.forgotPageNextButton.$view.addEventListener('click', (e)=> {
            e.preventDefault();
            if(!this.forgotForm.validate()) {
                this.sendResetMailRequest(this.forgotForm.value);
            }
        })
        this.$backForgot.addEventListener('click', (e)=> {
            e.preventDefault();
            this.pageView.show(SigninPageIndex.login);
            _this.updateQueryString({key: 'page', value: 'login'});
        })

    }

    sendResetMailRequest(email) {
        this.forgotPageNextButton.load(true);

        Http.post(`/v1/${this.lang}/users/password_reset/send`, { email },
            (res) => {
                const { code, message, email, google_id } = res;
                console.log(`[${code} success] ${message} ${email} ${google_id}`);
                this.user.email = email;
                this.emailForm.setValueToCookies(email);
                this.pageView.show(SigninPageIndex.sent);
                this.updateQueryString({key: 'page', value: 'sent'});
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
                    const { errors } = error; 
                    if (errors) {
                        // validation error
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'email':
                                    this.forgotForm.alert(message);
                                    break;
                            }
                        });
                    } else {
                        // other error
                        const { message } = error;
                        this.$forgotPageAlert.style.display = 'block';
                        this.$forgotPageAlert.textContent = message;
                    }
                } else {
                    console.error(error);
                }
            },
            () => {this.forgotPageNextButton.load(false);}
        );
    }

    // Page 3: Snet
    createSentPage() {
        const pageIndex = SigninPageIndex.sent;
        this.pageView.pages[pageIndex].container.classList.add('SentPage');

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backSent = $back;

        const $sentMark = document.createElement('img');
        $sentMark.src = '/img/ok-icon.svg';
        $sentMark.classList.add('icon');

        const $sentMessage = document.createElement('h4');
        $sentMessage.textContent = locale.get('password_reset_sent_message', lang);

        const $sentSubMessage = document.createElement('p');
        $sentSubMessage.textContent = locale.get('password_reset_sent_sub_message', lang);

        const $container = document.createElement('div');
        $container.classList.add('container');

        $container.appendChild($sentMark);
        $container.appendChild($sentMessage);
        $container.appendChild($sentSubMessage);

        this.pageView.appendChild($back, pageIndex);
        this.pageView.appendChild($container, pageIndex)
    }

    handleEventSentPage() {
        this.$backSent.addEventListener('click', (e)=> {
            e.preventDefault();
            this.pageView.show(SigninPageIndex.forgot);
            _this.updateQueryString({key: 'page', value: 'forgot'});
        })
    }


    // Page 4: Password Reset
    createPasswordResetPage() {
        const pageIndex = SigninPageIndex.reset;
        this.pageView.pages[pageIndex].container.classList.add('ResetPage');

        const $resetPageTitle = document.createElement('h3');
        $resetPageTitle.classList.add('title');
        $resetPageTitle.classList.add('reset');
        $resetPageTitle.textContent = locale.get('signin_reset_title', lang);

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backReset = $back;

        const $resetPageSubtitle = document.createElement('p');
        $resetPageSubtitle.classList.add('subtitle');
        $resetPageSubtitle.classList.add('reset');
        $resetPageSubtitle.textContent = locale.get('signin_reset_subtitle', lang);
        console.warn(this.locale)

        const resetMaxLength = 50;
        const passwordResetForm = new TextField({
            id: 'passwordResetForm',
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
                    maxLength: resetMaxLength})
                ],
            hasTitle: true,
            title: this.locale.get('accounts_password_form_title', lang),
            placeholder: this.locale.get('accounts_password_form_placeholder', lang),
            cookieExclude: true,
            isCounter: false,
        })

        const passwordResetConfirmForm = new TextField({
            id: 'passwordResetConfirmForm',
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
                    maxLength: resetMaxLength})
                ],
            hasTitle: true,
            title: this.locale.get('accounts_password_confirm_form_title', lang),
            placeholder: this.locale.get('accounts_password_confirm_form_placeholder', lang),
            cookieExclude: true,
            isCounter: false,
        })

        const resetPageNextButton = new LoadButton({
            id: 'resetPageNextButton',
            labelText: this.locale.get('nextbutton', lang),
            loaderSrc: '/img/button-loader.svg'
        });
        resetPageNextButton.$button.classList.add('nextButton');

        const $resetPageAlert = document.createElement('p');
        $resetPageAlert.id = 'resetPageAlert';
        $resetPageAlert.classList.add('pageAlert');
        $resetPageAlert.style.display = 'none';

        this.passwordResetForm = passwordResetForm;
        this.passwordResetConfirmForm = passwordResetConfirmForm;
        this.resetPageNextButton = resetPageNextButton;
        this.$resetPageAlert = $resetPageAlert;

        const $container = document.createElement('div');
        $container.classList.add('container');
        $container.appendChild(passwordResetForm.$view);
        $container.appendChild(passwordResetConfirmForm.$view);
        $container.appendChild(resetPageNextButton.$view);
        $container.appendChild($resetPageAlert);

        this.pageView.appendChild(this.$backReset, pageIndex);
        this.pageView.appendChild($resetPageTitle, pageIndex)
        this.pageView.appendChild($resetPageSubtitle, pageIndex)
        this.pageView.appendChild($container, pageIndex)
    }
    handleEventPasswordResetPage() {
        const _this = this;
        this.passwordResetForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            debuglog(`password changed: ${newValue}`)
        })
        this.passwordResetConfirmForm.$view.addEventListener('textchanged', (event) => {
            const {newValue} = event.detail;
            debuglog(`password confim changed: ${newValue}`)
        })
        this.passwordResetForm.$view.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {  // 13 is the keycode for Enter
                event.preventDefault();
                if(!_this.passwordResetForm.validate()) {
                    _this.passwordResetConfirmForm.$textArea.focus();
                }
            }
        });
        this.passwordResetForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                _this.passwordResetForm.validate()
                _this.passwordResetConfirmForm.$textArea.focus();
            }
        });
        this.passwordResetConfirmForm.$view.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                _this.passwordResetConfirmForm.validate()
                _this.resetPageNextButton.$view.focus();
            }
        });
        this.passwordResetConfirmForm.$view.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {  // 13 is the keycode for Enter
                event.preventDefault();
                if(!_this.passwordResetForm.validate() && !_this.passwordResetConfirmForm.validate()) {
                    _this.submitPasswordReset();
                }
            }
        });
        this.resetPageNextButton.$view.addEventListener('click', ()=> {
            if (!_this.passwordResetForm.validate() && !_this.passwordResetConfirmForm.validate()) {
                _this.submitPasswordReset();
            }
        });
        this.$backReset.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.pageView.show(SigninPageIndex.forgot);
        }) 
    }

    submitPasswordReset() {
        this.forgotPageNextButton.load(true);
        this.$resetPageAlert.style.display = 'none';
        this.$resetPageAlert.textContent = '';

        const reset_code = this.resetCode;
        const email = this.resetEmail;
        const password = this.passwordResetForm.value;
        const password_confirm = this.passwordResetConfirmForm.value;

        Http.post(`/v1/${this.lang}/users/password_reset/reset`, { email, password, password_confirm, reset_code },
            (res) => {
                const { code, message } = res;
                console.log(`[${code} success] ${message}`);
                this.updateQueryString({key: 'page', value: 'done'});
                this.pageView.show(SigninPageIndex.done);
            },
            (error) => {
                if (error && error.code) {
                    console.log(`[error] code:${error.code} reason:${error.reason}`);
                    const { errors } = error; 
                    const { field_name, message } = error;
                    if (errors) {
                        // validation error
                        errors.forEach(errorObj => {
                            const {field_name, message} = errorObj;
                            switch (field_name) {
                                case 'email':
                                case 'reset_code':
                                    this.$resetPageAlert.style.display = 'block';
                                    this.$resetPageAlert.textContent = locale.get('invalid_password_reset_url', lang);
                                    break;
                                case 'password':
                                    this.passwordResetForm.alert(message);
                                    break;
                                case 'password_confirm':
                                    this.passwordResetConfirmForm.alert(message);
                                    break;
                            }
                        });
                    } else if (field_name) {
                        switch (field_name) {
                            case 'email':
                            case 'reset_code':
                                this.$resetPageAlert.style.display = 'block';
                                this.$resetPageAlert.textContent = locale.get('invalid_password_reset_url', lang);
                                break;
                            case 'password':
                                this.passwordResetForm.alert(message);
                                break;
                            case 'password_confirm':
                                this.passwordResetConfirmForm.alert(message);
                                break;
                        }
                    } else {
                        // other error
                        const { message } = error;
                        this.$resetPageAlert.style.display = 'block';
                        this.$resetPageAlert.textContent = message;
                    }
                } else {
                    console.error(error);
                }
            },
            () => {this.resetPageNextButton.load(false);}
        );
    }

    // Page 5: ResetDone
    createResetDonePage() {
        const pageIndex = SigninPageIndex.done;
        this.pageView.pages[pageIndex].container.classList.add('DonePage');

        const $back = document.createElement('img');
        $back.src = '/img/back-arrow.svg';
        $back.classList.add('back');
        this.$backDone = $back;

        const $doneMark = document.createElement('img');
        $doneMark.src = '/img/ok-icon.svg';
        $doneMark.classList.add('icon');

        const $doneMessage = document.createElement('h4');
        $doneMessage.textContent = locale.get('password_reset_success', lang);

        const $container = document.createElement('div');
        $container.classList.add('container');

        $container.appendChild($doneMark);
        $container.appendChild($doneMessage);

        this.pageView.appendChild($back, pageIndex);
        this.pageView.appendChild($container, pageIndex)
    }
    handleEventResetDonePage() {
        const _this = this;
        this.$backDone.addEventListener('click', (e)=> {
            e.preventDefault();
            _this.pageView.show(SigninPageIndex.login);
            _this.updateQueryString({key: "page", value: "login"});
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