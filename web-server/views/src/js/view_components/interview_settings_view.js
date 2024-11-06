const defaults = {
    "title": "Interview 001",
    //"introduction": "Hello, {name}. I would like to conduct a simple interview with you now. Are you ready?",
    "introduction": "Hello, {name}. Are you ready?",
    "end": "Thank you {name}. This is the end. Please write the note to supply this interview if you want. Bye.",
    "steps": [
        {
            "question": "Introduce yourself in about 1 minutes.",
            "finish_condition": "Interviewee answerd it's done.",
            "max_turns": 3,
            "instructions": [
                "First, read the question.",
                "When the answer looks done, ask 'Are you sure that\'s it?'"
            ]
        },
        {
            "question": "We're building a software automating communications. Our system is written mainly in Python, Go, and JavaScript. Any cloud services are not used to achieve complete privacy. Instead we have our own physical systems. What can you contribute?",
            "finish_condition": "Interviewee answerd it's done.",
            "max_turns": 3,
            "instructions": [
                "First, read the question.",
                "Ask if it's okay to stop at this good point."
            ]
        },
        {
            "question": "Can you explain the concept of 'General purpose computer'?",
            "finish_condition": "Interviewee answerd it's done.",
            "max_turns": 3,
            "instructions": [
                "First, read the question.",
                "Once you get the first answer, ask 'Can you explain more detail such that even a child can understand?'",
                "When the answer looks done, ask 'Are you sure that\'s it?'"
            ]
        }
    ]
}

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
        validators = []
    }) {
        console.error('((((((((((((((((((((((((((((((((')
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
            validators
        });

        this.user = user;
        this.locale = locale;
        this.lang = lang;

        console.error('((((((((((((((((((((((((((((((((')
        console.error(locale)
        console.error(this.locale)

        this.interviewId = interviewId; //'670dcf37aa9bfc2db50d1574';//null;//'670b89cf740b61aa1bf16761';//null;
        this.interview = interview;
        console.warn(this.interview)
        console.warn(this.interview)
        console.warn(this.interview)
        console.warn(this.interview)


        this.createElements();

        // Create main content
        this.$mainContent.id = 'InterviewSettingsModalViewMainContent';
        
        console.error('((((((((((((((((((((((((((((((((')
        console.error(this.locale)
 

        if (this.interviewId) {
            // Display all three views
            this.interviewLinkView = new InterviewLinkView({
                id: 'InterviewLinkView',
                interviewId: this.interviewId,
                locale: this.locale,
                lang: this.lang
            });
            this.interviewLinkView.mount(this.$mainContent);

            this.interviewResultSummaryView = new InterviewResultsView({
                id: 'InterviewResultsView',
                interviewId: this.interviewId,
                locale: this.locale,
                lang: this.lang
            });
            this.interviewResultSummaryView.mount(this.$mainContent);
        }

        // Always display InterviewCreateView
        this.interviewCreateView = new InterviewCreateView({
            id: 'InterviewCreateView',
            locale: this.locale,
            lang: this.lang,
            user: this.user,
            interviewId: this.interviewId,
            interview: this.interview,
        });
        this.interviewCreateView.mount(this.$mainContent);
    }

    createElements() {
        super.createElements();

        const $message = document.createElement('p');
        $message.id = 'InterviewSettingsModalViewMessage';
        $message.classList.add('message');
        this.$view.querySelector('.footer').prepend($message);
        this.$message = $message;

   }

    setupView() {
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