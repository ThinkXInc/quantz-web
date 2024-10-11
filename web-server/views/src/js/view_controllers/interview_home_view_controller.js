document.addEventListener('DOMContentLoaded', ()=>{
    const lang = window.lang;
    const locale = window.locale;

    console.log(`set up materials view.\nlang:${lang}`);

    // initialize root view
    let materialsView = new MaterialsView({
        id: 'MainContent',
        locale: locale,
        lang: lang
    });
});

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
        this.loadInterviews();
 
        console.log(`Initialize ${this.id}: with material ${material}`);
    }

    fetchUser(onSuccess) {
        fetch(`/v1/${this.lang}/user`)
            .then(response => {
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
            })
            .then(data => {
                const { user, code, message } = data;
                console.log('User data fetched:', user);

                onSuccess(user)
            })
            .catch(error => {
                console.error('Unexpected error occurred when init:', error);
            });
 
    }

    loadInterviews() {
        this.loading(true);
        Http.get(`/v1/${this.lang}/interviews/list`, 
            (res) => {
                this.loading(false);

                const { interviews, count } = res
                this.interviews = interviews;
                debuglog(interviews)

                if (this.interviews.length == 0) {
                    this.fetchUser((user)=> {
                        this.openCreateInterviewModalView(user, this.locale, this.lang);
                    })
                }
            },
            (error) => {
                this.loading(false);
                // TODO: show error message
            });
    }
    
    openCreateInterviewModalView(user, locale, lang) {

        this.createInterviewModalView = new CreateInterviewModalView({
            id: 'CreateInterviewModalView', 
            user: user,
            locale: locale,
            lang: lang,
            title: "Create New Interview",//locale.get(MaterialsLocaleKeys.SETTINGS_MODAL_VIEW_TITLE, lang),
            text: "",
            cancelButtonText: "Cancel",//locale.get(MaterialsLocaleKeys.SETTINGS_MODAL_VIEW_CANCEL, lang),
            doneButtonText: "Done", //locale.get(MaterialsLocaleKeys.SETTINGS_MODAL_VIEW_DONE, lang),
            shouldCloseOnTapBG: true,
        });
        this.createInterviewModalView.mount('#MainContent');
        this.createInterviewModalView.show();
    }

    loading(isLoading) {
    }
}