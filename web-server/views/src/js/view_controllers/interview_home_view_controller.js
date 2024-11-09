class InterviewHomeViewController {
    constructor({
        id,
        locale,
        lang = 'en'
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.interviews = [];
        this.setupView();
        this.setupEventListeners();
        this.loadInterviews();
        console.log(`Initialize ${this.id}: with material ${material}`);
    }

    setupView() {
        this.$MainContent = document.getElementById("MainContent");

        // InterviewListContainer
        const $listContainer = document.createElement('div');
        $listContainer.id = 'InterviewListContainer';
        $listContainer.classList.add('InterviewListContainer');
        this.$MainContent.appendChild($listContainer);
        this.$listContainer = $listContainer;

        // InterviewResultsViewContainer
        const $resultsViewContainer = document.createElement('div');
        $resultsViewContainer.id = 'InterviewResultsViewContainer';
        $resultsViewContainer.classList.add('InterviewResultsViewContainer');
        this.$MainContent.appendChild($resultsViewContainer);
        this.$resultsViewContainer = $resultsViewContainer;
 
        // InterviewResultPreviewContainer
        const $previewContainer = document.createElement('div');
        $previewContainer.id = 'InterviewResultPreviewContainer';
        $previewContainer.classList.add('InterviewResultPreviewContainer');
        this.$MainContent.appendChild($previewContainer);
        this.$previewContainer = $previewContainer;
    }

    setupEventListeners() {
        document.addEventListener("clickedInterviewResultCell", (event) => {
            const {index, clientId, interview, cell } = event.detail;
            this.openInterviewResultPreview(interview);
        })
    }

    fetchUser(onSuccess) {
        fetch(`/v1/${this.lang}/user`).then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    console.error(`Error fetching user: ${errData.code} ${errData.message}`);
                    if (response.status === 401 || response.status === 404) {
                        console.log('Redirecting to login page...');
                        window.location.href = `/v1/${lang}/signup`;
                    }
                    return Promise.reject(errData);
                });
            }
            return response.json();
        }).then(data => {
            const {
                user,
                code,
                message
            } = data;
            console.log('User data fetched:', user);
            onSuccess(user);
        }).catch(error => {
            console.error('Unexpected error occurred when init:', error);
        });
    }

    loadInterviews() {
        this.loading(true);
        Http.get(`/v1/${this.lang}/interviews/list`, res => {
            this.loading(false);
            const {
                interviews,
                count
            } = res;
            this.interviews = interviews;
            debuglog(interviews);
            if (this.interviews.length == 0) {
                this.fetchUser(user => {
                    //this.openInterviewCreateModalView(user, null, this.locale, this.lang);
                    this.openInterviewSettingsModalView(user, null, this.locale, this.lang);
                });
            }
            else {
                this.setupInterviewListView(this.lang, this.locale);
            }
            //// DEBUG 
            //else {
            //    this.fetchUser(user => {
            //        this.openInterviewCreateModalView(user, interviews[0].id, this.locale, this.lang);
            //    });
            //}
            //// DEBUG
        }, error => {
            this.loading(false);
            // TODO: show error message
        });
    }

    setupInterviewListView(lang, locale) {
        this.interviewList = new InterviewList({
            id: 'interviewList',
            lang: lang,
            locale: locale,
            createNewButtonTitle: locale.get("create_new_interview_button_title", lang),
            headerTitle: locale.get('interview_list_header_title', lang),
            listCountTextSingular: locale.get('interview_list_count_singular', lang),
            listCountTextPlural: locale.get('interview_list_count_plural', lang),
        });
        this.interviewList.$view.addEventListener("clickedInterviewCell", (event)=> {
            const { index, interviewId, cell } = event.detail;
            //this.openInterviewCreateModalView(this.user, interviewId, this.locale, this.lang);
            //this.openInterviewPreviewView(interviewId);
            this.openInterviewSettingsModalView(this.user, interviewId, this.locale, this.lang);
            this.openInterviewResults(interviewId)
        })
        this.interviewList.$view.addEventListener("clickedNewInterviewButton", (event)=> {
            this.openInterviewSettingsModalView(this.user, null, this.locale, this.lang);
        })
        //this.interviewList.loadinterviews();
        this.interviewList.updateContentsFromInterviews(this.interviews);
        this.interviewList.mount(this.$listContainer);
        this.interviewList.loading(false);
    }

    getInterview(interviewId) {
        let result = null;
        this.interviews.forEach((interview) => {
            if(interview.id == interviewId) {
                result = interview
            }
        })
        if (result) {
            return result
        } else {
            console.error(`[WARNING] interivew not found in list by id ${interviewId}`)
        }
    }

    /*
    openInterviewPreviewView(interviewId) {
        const interview = this.getInterview(interviewId);
    
        if (!this.interviewPreviewView) {
            this.interviewPreviewView = new InterviewPreviewView({
                id: 'InterviewPreviewView',
                interview: interview,
                locale: this.locale,
                lang: this.lang,
            });
    
            // Append the InterviewPreviewView to the right column
            this.interviewPreviewView.mount(this.$previewContainer);
    
            // **Event Listener for Edit Button Click**
            this.interviewPreviewView.$view.addEventListener('editInterview', (event) => {
                const { interviewId } = event.detail;
                this.openInterviewCreateModalView(this.user, interviewId, this.locale, this.lang);
            });
    
        } else {
            this.interviewPreviewView.updateInterview(interview);
        }
    }
        */
    

    openInterviewSettingsModalView(user, interviewId, locale, lang) {
        let title = "";
        let interview = null;
        if (interviewId) {
            interview = this.getInterview(interviewId);
            title = interview.title;//locale.get("interview_settings_page_title_edit", lang);
        } else {
            title = locale.get("interview_settings_page_title_new", lang);
        }
        this.interviewSettingsModalView = new InterviewSettingsModalView({
            id: 'InterviewSettingsModalView',
            user: user,
            locale: locale,
            lang: lang,
            title: title,
            interviewId: interviewId,
            interview: interview,
            cancelButtonText: locale.get("interview_settings_cancel_button_text", lang),
            doneButtonText: locale.get("interview_settings_done_button_text", lang),
            shouldCloseOnTapBG: true
        });
        this.interviewSettingsModalView.mount(this.$MainContent);
        this.interviewSettingsModalView.show();
    }

    openInterviewResults(interviewId) {
        this.$resultsViewContainer.innerHTML = '';
        this.interviewResults = new InterviewResults({
            id: 'InterviewResultsViewHome',
            interviewId: interviewId,
            locale: this.locale,
            lang: this.lang
        });
        //this.interviewResults.mount(this.$mainContent);
        this.$resultsViewContainer.appendChild(this.interviewResults.$view);
        this.interviewResults.fetchAndUpdate({limit: 10});
        this.$MainContent.classList.add('openInterviewResults');
    }

    openInterviewResultPreview(interview) {
        this.interviewSettingsModalView.close();
        this.$previewViewContainer.innerHTML = '';
        this.interviewResultPreview = new InterviewResultPreview({
            id: 'InterviewResultPreview',
            interview: interview,
            locale: this.locale,
            lang: this.lang
        });
        this.$previewContainer.appendChild(this.interviewResultPreview.$view);
        this.$MainContent.classList.add('openInterviewResultPreview');
    }

    loading(isLoading) {}
}

