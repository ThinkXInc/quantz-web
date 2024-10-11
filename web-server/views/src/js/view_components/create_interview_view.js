const defaults = {
    "title": "Interview 001",
    "introduction": "Hello, {name}. Are you ready?",
    "steps": [
        {
            "question": "Introduce yourself in about 1 minutes.",
            "finish_condition": "Interviewee answerd it's done.",
            "max_turns": 3,
            "instructions": [
                "First, ask the question.",
                "When the answer looks done, ask 'Are you sure that\'s it?'"
            ]
        }
    ]
}
class CreateInterviewModalView extends ModalView {
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
        const createInterviewView = new CreateInterviewView({
            id: 'CreateInterviewView',
            locale: locale,
            lang: lang,
            user: this.user,
        });
        createInterviewView.mount(this.$mainContent);
 
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
        //if (!this.cell) {
        //    throw Error('No cell is set to MaterialDeleteModalView before confirming deletion.');
        //}
        //this.$view.dispatchEvent(
        //    new CustomEvent(
        //        MaterialsEventKeys.CONFIRMED_DELETE_MATERIAL,
        //        { detail: { materialId: this.cell.content.materialId, cell: this.cell } }));
    }
}

const CreateInterviewPageIndex = Object.freeze({
    title: 0, introduction: 1, step1: 2, step2: 3, step3: 4
})

class CreateInterviewView {
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

        this.setupView();
    }

    setupView(){
        const pageView = new PageView({
            id: 'CreateInterviewPageView',
            numPages: 3
        })
        this.pageView = pageView;

        // Page 1: Title

        this.createTitlePage() 
        this.handleEventTitlePage()

        // Page 2: Introduction

        this.createIntroductionPage();
        this.handleEventIntroductionPage();

        // Page 3: Step
        this.createStepPage();
        this.handleEventStepPage();

        this.pageView.showAll();
    }

    mount(element) {
        this.pageView.mount(element);
    }

    // Page 1: Title

    createTitlePage() {
        const pageIndex = CreateInterviewPageIndex.title;
        this.pageView.pages[pageIndex].container.classList.add('TitlePage');

        const $titlePageTitle = document.createElement('h3');
        $titlePageTitle.classList.add('title');
        $titlePageTitle.textContent = locale.get('create_interview_title_page_title', lang);

        //const $description = document.createElement('p');
        //$description.classList.add('description');
        //$description.textContent = ""

        const $container = document.createElement('div');
        $container.classList.add('container');

        const titleForm = new TextField({
            id: 'titleForm',
            fieldName: 'title',
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
            defaultValue: defaults.title,
            hasTitle: true,
            title: "Title",
            placeholder: "Enter the interview title.",
            isCounter: false,
        });

        $container.appendChild(titleForm.$view);
        this.titleForm = titleForm;

        this.pageView.appendChild($titlePageTitle, pageIndex);
        //this.pageView.appendChild($description, pageIndex);
        this.pageView.appendChild($container, pageIndex);

    }
    handleEventTitlePage() {

    }

    // Page 2: Introduction

    createIntroductionPage() {
        const pageIndex = CreateInterviewPageIndex.introduction;
        this.pageView.pages[pageIndex].container.classList.add('IntroductionPage');

        const $introductionPageTitle = document.createElement('h3');
        $introductionPageTitle.classList.add('title');
        $introductionPageTitle.textContent = locale.get('create_interview_introduction_page_title', lang);

        const $description = document.createElement('p');
        $description.classList.add('description');
        $description.textContent = "インタビュー開始時にこれをまず話します。"

        const $container = document.createElement('div');
        $container.classList.add('container');

        const introductionForm = new TextField({
            id: 'introductionForm',
            fieldName: 'introduction',
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
            defaultValue: defaults.introduction,
            hasTitle: true,
            title: "Opening Remarks",
            placeholder: "Enter the opening remarks the AI says when the interview starts.",
            isCounter: false,
        });

        $container.appendChild(introductionForm.$view);
        this.introductionForm = introductionForm;

        this.pageView.appendChild($introductionPageTitle, pageIndex);
        //this.pageView.appendChild($description, pageIndex);
        this.pageView.appendChild($container, pageIndex);
 
    }
    handleEventIntroductionPage() {

    }

    // Page 3: Step
    createStepPage() {

    }
    handleEventStepPage() {

    }


}