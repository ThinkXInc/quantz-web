class InterviewSettingsModalView extends ModalView {
    constructor({
        id,
        user,
        locale,
        lang = 'en',
        title = "",
        text = "",
        interviewId = "",
        interview = null,
        cancelButtonText = "Cancel",
        doneButtonText = "Done",
        shouldCloseOnTapBG = true,
        htmlTag = 'div',
        protocols = [],
        validators = [],
        showAnimation = AnimationType.EXPAND,
        closeAnimation = AnimationType.SHRINK
    }) {
        console.error(locale)

        super({
            id,
            title,
            text,
            cancelButtonText,
            doneButtonText,
            shouldCloseOnTapBG,
            htmlTag,
            protocols,
            validators,
            showAnimation,
            closeAnimation
        });

        this.user = user;
        this.locale = locale;
        this.lang = lang;

        this.interviewId = interviewId; //'670dcf37aa9bfc2db50d1574';//null;//'670b89cf740b61aa1bf16761';//null;
        this.interview = interview;

        super.createElements();

        this.setupView();
    }

    setupView() {
        console.warn(this.$mainContent)

        // Create containers for organized layout
        this.$linkViewContainer = document.createElement('div');
        this.$resultsViewContainer = document.createElement('div');
        this.$interviewCreateViewContainer = document.createElement('div');

        this.$mainContent.appendChild(this.$linkViewContainer);
        this.$mainContent.appendChild(this.$resultsViewContainer);
        this.$mainContent.appendChild(this.$interviewCreateViewContainer);

        const $message = document.createElement('p');
        $message.id = 'InterviewSettingsModalViewMessage';
        $message.classList.add('message');
        this.$view.querySelector('.footer').prepend($message);
        this.$message = $message;
        
        console.warn(this.interviewId)

        // Always display InterviewCreateView
        this.interviewCreateView = new InterviewCreateView({
            id: 'InterviewCreateView',
            locale: this.locale,
            lang: this.lang,
            user: this.user,
            interviewId: this.interviewId,
            interview: this.interview,
            $message: this.$message,
            onInterviewCreated: (interviewId) => {
                this.handleInterviewCreated(interviewId);
            }
        });
        this.interviewCreateView.mount(this.$mainContent);

        // If interviewId exists, display InterviewLinkView
        if (this.interviewId) {
            this.displayInterviewLinkView();
        }
    }

    handleInterviewCreated(interviewId) {
        this.interviewId = interviewId;
        this.displayInterviewLinkView();
    }

    displayInterviewLinkView() {
        console.log('Display link view.')
        // Clear existing content
        this.$linkViewContainer.innerHTML = '';
        this.$resultsViewContainer.innerHTML = '';
    
        // Create and mount InterviewLinkView
        this.interviewLinkView = new InterviewLinkView({
            id: 'InterviewLinkView',
            interviewId: this.interviewId,
            locale: this.locale,
            lang: this.lang
        });
        this.interviewLinkView.mount(this.$linkViewContainer);
    
        // Add labels and separators
        const $labelResults = document.createElement('span');
        $labelResults.classList.add('label', 'results');
        $labelResults.textContent = this.locale.get('interview_settings_results_label', this.lang);
        this.$resultsViewContainer.appendChild($labelResults);
    
        const $separatorResults = document.createElement('span');
        $separatorResults.classList.add('separator', 'results');
        this.$resultsViewContainer.appendChild($separatorResults);
    
        // Create and append InterviewResults
        this.interviewResults = new InterviewResults({
            id: 'InterviewResultsView',
            interviewId: this.interviewId,
            locale: this.locale,
            lang: this.lang,
            hasMoreButton: true
        });
        this.$resultsViewContainer.appendChild(this.interviewResults.$view);
        this.interviewResults.fetchAndUpdate({ limit: 10 });
    
        const $labelCustomize = document.createElement('span');
        $labelCustomize.classList.add('label', 'customize');
        $labelCustomize.textContent = this.locale.get('interview_settings_customize_label', this.lang);
        this.$resultsViewContainer.appendChild($labelCustomize);
    
        const $separatorCustomize = document.createElement('span');
        $separatorCustomize.classList.add('separator', 'customize');
        this.$resultsViewContainer.appendChild($separatorCustomize);
    }

    show() {
        super.show();
    }

    cancel() {
        super.cancel();
    }

    done() {
        if (!this.interviewId) {
            // create new
            this.interviewCreateView.submitCreateInterview();
        } else {
            // update
            this.interviewCreateView.submitUpdateInterview(this.interviewId);
        }
        // Trigger custom event
        //if (!this.cell) {
        //    throw Error('No cell is set to MaterialDeleteModalView before confirming deletion.');
        //}
        //this.$view.dispatchEvent(
        //    new CustomEvent(
        //        MaterialsEventKeys.CONFIRMED_DELETE_MATERIAL,
        //        { detail: { materialId: this.cell.content.materialId, cell: this.cell } }));
    }
}