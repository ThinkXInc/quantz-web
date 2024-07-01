const EmailFormState = Object.freeze({ 
    pendingNotSent: 0,
    pendingSent: 1,
    verified: 2,
    changed: 3,
});

class EmailForm extends TextField {
    constructor({
        id,
        fieldName,
        defaultValue = '',
        defaultState,
        className = "EmailForm",
        resendButtonText = "Resend",
        submitButtonText = "Send",
        type = TextFieldType.singleline,
        maxTextLength = 100,
        hasTitle = true,
        title = '',
        placeholder = '',
        isTitlePlacedAtInputLeft = false, 
        messagePlace = TextFieldPlaceTo.footerLeft,
        isCounter = false,
        passwordMode = false,
        validators = [],
        shouldEnterKeySubmitDoneButton = false,
        resentExplanation = '',
        verifiedStateExplanation = '',
        pendingStatusText = '',
        }) {
            super({
                id,
                fieldName,
                type,
                defaultValue,
                validators,
                maxTextLength,
                hasTitle,
                title,
                placeholder,
                isTitlePlacedAtInputLeft,
                messagePlace,
                isCounter,
                passwordMode,
                shouldEnterKeySubmitDoneButton
            });

            this.className = className;
            this.resendButtonText = resendButtonText;
            this.submitButtonText = submitButtonText;
            this.resentExplanation = resentExplanation;
            this.verifiedStateExplanation = verifiedStateExplanation;
            this.pendingStatusText = pendingStatusText;

            this.createElements();

            this.defaultValue = defaultValue;
            this.value = this.defaultValue;
            this.state = defaultState;

            this.isVerified = false;
    }

    set text(newText) {
        super.text = newText;
    }

    showResend(isShown) {
        if (isShown) {
            this.$resendButton.style.display = "flex";
        } else {
            this.$resendButton.style.display = "none";
        }
    }

    showSubmit(isShown) {
        if (isShown) {
            this.$submitButton.style.display = 'flex';
        } else {
            this.$submitButton.style.display = 'none';
        }
    }

    showPending(isShown) {
        if (isShown) {
            this.$pendingStatus.textContent = this.pendingStatusText;
            this.$view.classList.add('pending');
        } else {
            this.$pendingStatus.textContent = "";
            this.$view.classList.remove('pending');
        }
    }

    showVerifiedMark(isShown) {
        if (isShown) {
            this.$verifiedIcon.style.display = 'block';
            this.isVerified = true;
        } else {
            this.$verifiedIcon.style.display = 'none';
            this.isVerified = false;
        }
    }

    updateExplanation(text) {
        this.$explanation.textContent = text;
    }

    set state(state) {
        this._state = state;
        switch (state) {
            case EmailFormState.pendingNotSent:
                console.log(`${this.id} state -> pendingNotSent`)
                this.showSubmit(false);
                this.showVerifiedMark(false);
                this.showResend(true);
                this.showPending(true);
                this.updateExplanation("");
                break
            case EmailFormState.pendingSent:
                console.log(`${this.id} state -> pendingSent`)
                this.showSubmit(false);
                this.showVerifiedMark(false);
                this.showResend(true);
                this.showPending(true);
                this.updateExplanation(this.pendingSentStateExplanation);
                break
            case EmailFormState.verified:
                console.log(`${this.id} state -> verified`)
                this.showSubmit(false);
                this.showVerifiedMark(true);
                this.showResend(false);
                this.showPending(false);
                this.updateExplanation(this.verifiedStateExplanation);
                break
            case EmailFormState.changed:
                console.log(`${this.id} state -> changed`)
                this.showSubmit(true);
                this.showVerifiedMark(false);
                this.showResend(false);
                this.showPending(false);
                this.updateExplanation("");
                break
            default:
                console.error(`${this.id} state -> unknown: ${state}`);
                break;
        }
    }

    get state () { return this._state; }

    createElements() {
        this.$textField.classList.add(this.className);

        // verified icon
        this.$verifiedIcon = document.createElement('img');
        this.$verifiedIcon.src = "/img/verified-icon.svg";
        this.$verifiedIcon.className = "VerifiedIcon";
        this.$inputAfter.appendChild(this.$verifiedIcon);

        // pending status
        this.$pendingStatus = document.createElement('span');
        this.$pendingStatus.classList.add("pending");
        this.$inputAfter.appendChild(this.$pendingStatus);

        // change button
        this.submitButton = new LoadButton({
            id: this.id + "SumitButton",
            labelText: this.submitButtonText
        })
        this.submitButton.$view.classList.add("SubmitButton");
        this.$submitButton = this.submitButton.$view;
        this.$inputAfter.appendChild(this.$submitButton);

        // resend button
        this.resendButton = new LoadButton({
            id: this.id + "ResendButton",
            labelText: this.resendButtonText
        })
        this.resendButton.$view.classList.add("ResendButton");
        this.$resendButton = this.resendButton.$view;
        this.$inputAfter.appendChild(this.$resendButton);

        // explanation
        this.$explanation = document.createElement('span');
        this.$explanation.id = this.id + "Explanation";
        this.$explanation.classList.add('explanation');
        this.$inputAfter.appendChild(this.$explanation);
    }


 
}