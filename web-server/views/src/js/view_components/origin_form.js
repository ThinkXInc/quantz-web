const OriginFormState = Object.freeze({ 
    notVerified: 0,
    verifiedOriginal: 1,
    verifiedPublic: 2,
});

const DomainType = Object.freeze({public: 'public', original:'original', others:'others'})

class OriginForm extends TextField {
    constructor({
        id,
        fieldName,
        defaultState,
        defaultValue = '',
        className = "OriginForm",
        submitButtonText = "submit",
        type = TextFieldType.singleline,
        maxTextLength = 100,
        hasTitle = true,
        title = '',
        placeholder = '',
        hasSubmitButton = true,
        isTitlePlacedAtInputLeft = false, 
        messagePlace = TextFieldPlaceTo.footerLeft,
        isCounter = false,
        passwordMode = false,
        validators = [],
        shouldEnterKeySubmitDoneButton = false,
        pendingStatusText = '',
        notVerifiedExplanation = '',
        publicDomainExplanation = '',
        originalDomainExplanation = '',
        }) {
            super({
                id,
                fieldName,
                type,
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
            this.hasSubmitButton = hasSubmitButton;
            this.submitButtonText = submitButtonText;

            this.pendingStatusText = pendingStatusText;
            this.notVerifiedExplanation = notVerifiedExplanation;
            this.originalDomainExplanation = originalDomainExplanation;
            this.publicDomainExplanation = publicDomainExplanation;

            this.addElements();
            this.addEventHandlers();

            this.showSubmitButton(false);

            this.defaultValue = defaultValue;
            this.defaultState = defaultState;
            this.value = defaultValue;
            this.state = defaultState;
    }

    addElements() {
        this.$textField.classList.add(this.className);

        // pending status
        this.$pendingStatus = document.createElement('span');
        this.$pendingStatus.classList.add("pending");
        this.$inputAfter.appendChild(this.$pendingStatus);

        // verified icon
        this.$verifiedIcon = document.createElement('img');
        this.$verifiedIcon.src = "/img/verified-icon.svg";
        this.$verifiedIcon.className = "VerifiedIcon";
        this.$inputAfter.appendChild(this.$verifiedIcon);

        // submit button
        if(this.hasSubmitButton) {
            this.submitButton = new LoadButton({
                id: this.id + "SumitButton",
                labelText: this.submitButtonText
            })
            this.submitButton.$view.classList.add("SubmitButton");
            this.$submitButton = this.submitButton.$view;
            this.$inputAfter.appendChild(this.$submitButton);
        }

        // explanation
        this.$explanation = document.createElement('span');
        this.$explanation.id = this.id + "Explanation";
        this.$explanation.classList.add('explanation');
        this.$inputAfter.appendChild(this.$explanation);
    }

    addEventHandlers() {
        if (this.hasSubmitButton) {
            this.$submitButton.addEventListener('click', () => {

            }) 
        }
    }

    set text(newText) {
        super.text = newText;
    }

    set state(state) {
        this._state = state;
        switch (state) {
            case OriginFormState.notVerified:
                console.log(`${this.id} state -> notVerified`)
                this.showVerifiedMark(false);
                this.showPending(true);
                this.updateExplanation(this.notVerifiedExplanation);
                break
            case OriginFormState.verifiedOriginal:
                console.log(`${this.id} state -> verified original`)
                this.showVerifiedMark(true);
                this.showPending(false);
                this.updateExplanation(this.originalDomainExplanation);
                break
            case OriginFormState.verifiedPublic:
                console.log(`${this.id} state -> verified public`)
                this.showVerifiedMark(true);
                this.showPending(false);
                this.updateExplanation(this.publicDomainExplanation);
                break
            default:
                console.error(`${this.id} state -> unknown: ${state}`);
                break;
        }
    }

    get state () { return this._state; }


    showVerifiedMark(isShown) {
        if (isShown) {
            this.$verifiedIcon.style.display = 'block';
        } else {
            this.$verifiedIcon.style.display = 'none';
        }
    }

    showSubmitButton(isShown) {
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

    updateExplanation(text) {
        this.$explanation.textContent = text;
    }

    checkDomainType(verifiedEmails) {
        // NOTE: DomainType is defined in signup.js
        // this version takes all verified emails
        const url = new URL(`http://${this.value}`);
        const originDomain = url.hostname;
        const parsedPath = url.pathname;

        console.log('URL:', url);
        console.log('Origin domain:', originDomain);
        console.log('Parsed path:', parsedPath);

        if (parsedPath !== '' && parsedPath !== '/') {
            console.info(`[Origin type: public] Origin ${parsedPath} has a valid path and is considered verified.`);
            return 'public';
        } else {
            // Check if any email domain matches the origin domain
            for (let email of verifiedEmails) {
                const emailDomain = email.split('@').pop();
                console.log('Checking email domain:', emailDomain);
                
                if (emailDomain === originDomain) {
                    console.info(`[Origin type: original] Origin domain ${originDomain} matches email domain ${emailDomain}.`);
                    return 'original';
                }
            }
        }

        console.error(`Origin ${originDomain} is neither the same as any email domain nor includes a specific URL path.`);
        return 'others';
    }
    //set isVerified(isVerified) {
    //    this._isVerified = isVerified;
    //    if (isVerified) {
    //        this.$verifiedIcon.style.display = 'block';
    //    } else {
    //        this.$verifiedIcon.style.display = 'none';
    //    }
    //}

    //get isVerified () { return this._isVerified; }

    //set isChanged(isChanged) {
    //    this._isChanged = isChanged;
    //    if (this.hasSubmitButton) {
    //        if (isChanged && this.validate() == null) {
    //            this.$submitButton.style.display = 'flex';
    //        } else {
    //            this.$submitButton.style.display = 'none';
    //        }
    //    }
    //}

    //initializeByUser(user) {
    //    if (this.defaultValue === "" || !this.defaultValue) {
    //        this.defaultValue = user.origin;
    //        this.isVerifiedDefault = user.is_origin_verified;
    //    }
    //    this.updateByUser(user);
    //}

    //updateByUser(user) {
    //    this.user = user;
    //    this.value = user.origin;
    //    this.isChanged = false;
    //    this.isVerified = user.is_origin_verified; 

    //    console.log("User is verified:", this.isVerified, "Origin type:", user.origin_type);

    //    if (this.isVerified && user.origin_type === 'original') {
    //        this.state = OriginFormState.verifiedOriginal;
    //        this.defaultState = this.state;
    //    } else if (this.isVerified && user.origin_type === 'public') {
    //        this.state = OriginFormState.verifiedPublic;
    //        this.defaultState = this.state;
    //    } else {
    //        this.state = OriginFormState.notVerified;
    //        this.defaultState = this.state;
    //    }
    //}

}