class MaterialDataModel extends InputPageViewDataModel {
    title
    text
    keywords
    sample_question
    sample_response
    constructor(defaults = {}) {
        super(defaults);
        Object.assign(this, defaults);
    }
}

const createMaterialViewState = {
    notCreated: 'notCreated',
    textSubmitted: 'textSubmitted',
    questionSubmitted: 'questionSubmitted'
};

class MaterialCreateViewController extends InputPageViewController {
    constructor({
        id,
        locale,
        lang = 'en',
        material,
        dataModelClass = MaterialDataModel, // Default assumes MaterialDataModel is defined
        loading,
        alertMessage,
        isEnterButtonToNext = false,
        isPageIndexInHash = false,
        preventDefaultPageControl = true
    }) {
        const materialCreatePageId = "MaterialCreatePage";
        let materialCreatePage = new MaterialCreatePage({
            id: id,
            pageId: materialCreatePageId,
            locale: locale,
            lang: lang
        });
        const pages = [materialCreatePage];

        // Call the parent constructor directly with configuration
        super({
            id: id,
            pages: pages,
            dataModelClass: dataModelClass,
            loading: loading,
            alertMessage: alertMessage,
            isEnterButtonToNext: isEnterButtonToNext,
            isPageIndexInHash: isPageIndexInHash,
            preventDefaultPageControl: preventDefaultPageControl
        });

        // Store basic properties
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.materialCreatePage = materialCreatePage;
        this.textField = materialCreatePage.textField;
        this.titleField = materialCreatePage.titleField;
        this.keywordsField = materialCreatePage.keywordsField;
        this.questionField = materialCreatePage.questionField;
        this.answerView = materialCreatePage.answerView;
        this.material = material;

        console.log(`Initialize ${this.id}: with material ${material}`);
        this.resetViewsWithMaterial(this.material);

        this._addEventHandlers();
        this.initialValuesInCookie();
    }

    set materialId(materialId) {
        console.log(`materialId ${materialId} set to ${this.id}.`)
        if (this._materialId != null) {
            console.warn(`${this.id} already has a materialId. This is about to be overwritten. This shouldn't typically happen.`);
        }
        this._materialId = materialId;
        if (materialId == null) {
            console.warn(`materialId is null.`)
        }

        this.textField.materialId = materialId; // Update the material ID in the text field
        this.titleField.materialId = materialId; // Update the material ID in the title field
        this.questionField.materialId = materialId; // Update the material ID in the question field
    }

    get materialId() { return this._materialId; }

    reconstructView() {
        // All reset
        const materialCreatePageId = "MaterialCreatePage";
        let materialCreatePage = new MaterialCreatePage(
            this.id,
            materialCreatePageId,
            this.locale,
            this.lang
        )
        const pages = [materialCreatePage];
        this.materialCreatePage = materialCreatePage;

        this.textField = materialCreatePage.textField;
        this.titleField = materialCreatePage.titleField;
        this.keywordsField = materialCreatePage.keywordsField;
        this.questionField = materialCreatePage.questionField;
        this.answerView = materialCreatePage.answerView;

        this.material = material;

        this._addEventHandlers();
        this.initialValuesInCookie();
    }

    initializeAllValuesInFields() {
        this.textField.reset();
        this.titleField.reset();
        this.keywordsField.setKeywords([]);
        this.questionField.reset();
        this.answerView.updateAnswer('');
        this.answerView.updateReview('');
    }

    resetViewsWithMaterial(material) {
        // Log the material and update material ID
        if (material) {
            console.log(`${this.id}resetViewsWithMaterial =>\nid: ${material._id}\nTitle: ${material.title}\nQuestion: ${material.question}\nAnswer: ${material.answer}\nReview: ${material.review}`);
            this.materialId = material._id;
        } else {
            this.materialId = null;
            this.initializeAllValuesInFields();
        }

        // Determine the state of the material
        let materialState = createMaterialViewState.notCreated;
        if (material && material._id && !material.question) {
            materialState = createMaterialViewState.textSubmitted;
        } else if (material && material.question) {
            materialState = createMaterialViewState.questionSubmitted;
        }
        console.log(`createMaterialViewState is "${materialState}"`)

        switch (materialState) {
            case createMaterialViewState.notCreated:
                this.titleField.hide();
                this.keywordsField.hide();
                this.questionField.hide();
                this.answerView.hideAnswer();
                this.answerView.hideReview();
                break;

            case createMaterialViewState.textSubmitted:
                this.titleField.value = (material?.title ?? "");
                this.titleField.stopLoading();
                this.titleField.show();

                this.textField.value = material?.text;

                this.keywordsField.setKeywords(material?.keywords);
                this.keywordsField.stopLoading();
                this.keywordsField.show();

                this.questionField.reset();
                this.questionField.stopLoading();
                this.questionField.show();

                this.answerView.hideAnswer();
                this.answerView.hideReview();
                break;

            case createMaterialViewState.questionSubmitted:
                this.titleField.value = (material?.title ?? "");
                this.titleField.stopLoading();
                this.titleField.show();

                this.textField.value = material?.text;

                this.keywordsField.setKeywords(material?.keywords);
                this.keywordsField.stopLoading();
                this.keywordsField.show();

                this.questionField.value = material?.question;
                this.questionField.stopLoading();
                this.questionField.show();

                if(material?.answer) {
                    this.answerView.stopLoadingAnswer();
                    this.answerView.showAnswer();
                    this.answerView.updateAnswer(material?.answer);
                } else {
                    this.answerView.hideAnswer();
                }

                if (material?.review) {
                    this.answerView.stopLoadingReview();
                    this.answerView.showReview();
                    this.answerView.updateReview(material?.review);
                } else {
                    this.answerView.hideReview();
                }
                break;
        }
    }

    initialValuesInCookie() {
        const values = this.getValuesFromCookies();
        console.log(`${this.id} retrieved values in cookie => ${values}`);
        if(values['title']) {
            this.titleField.setPreviousTitle(values['title']);
        } else {
            console.log(`no title found in cookie`)
        }
    }

    _addEventHandlers() {
        const _this = this;
        if (this.textField == null || this.textField.$textField == null) {
            console.error(`textField must not be null : ${this.textField}, textField.$textField must not be null : ${this.textField.$textField}`);
        }
        if (this.titleField == null || this.titleField.$textField == null) {
            console.error(`titleField must not be null : ${this.titleField}, titleField.$titleField must not be null : ${this.titleField.$textField}`);
        }

        // TextField Submit
        this.textField.$textField.addEventListener(materialTextFieldCustomEventTextSubmit, (e) => {
            console.log("Received text from textField:", e.detail.text);
            // Submit text
            if(this.materialId == null) {
                _this.submitMaterial(e.detail.text);
            } else {
                _this.requestUpdateMaterial({'text': e.detail.text});
            }
        });

        // TitleField Submit
        this.titleField.$textField.addEventListener(materialTitleFieldCustomEventTitleSubmit, (e) => {
            console.log("Received title from titleField:", e.detail.title);
            // Submit title
            _this.requestUpdateMaterial({'title': e.detail.title});
        });

        // KeywordsField Submit
        this.keywordsField.$textField.addEventListener(keywordsFieldCustomEventSubmit, (e) => {
            console.log("Received keywords from keywordsField:", e.detail.keywords);
            // Handle keywords as needed
            _this.requestUpdateMaterial({'keywords': e.detail.keywords});
        });

        // QuestionField Submit
        this.questionField.$textField.addEventListener(this.questionField.eventNameDoneButtonClick, (e) => {
            console.log("Received question from questionField:", e.detail.value);
            if(!this.materialId || this.materialId == undefined) {
                throw Error(`this.materialId must be set but ${this.materialId}.`)
            }

            const startLoading = () => {
                this.answerView.hideReview();
                this.answerView.stopLoadingReview();
                this.answerView.showAnswer();
                this.answerView.startLoadingAnswer();
                this.questionField.scrollTo();
            } 
            const stopLoadingAnswerAndQuestion = () => {
                this.answerView.stopLoadingAnswer();
                this.questionField.stopLoading();
            }
            const stopLoadingReview = () => {
                this.answerView.stopLoadingReview();
            }
            const hideOnFailure = () => {
                this.answerView.hideAnswer();
            }

            const submitValue = _this.textField.value + '<question>:' + _this.questionField.value
            let isAnswerViewShown = false;
            let isReviewViewShown = false;
            _this.requestUpdateMaterial({'question': _this.questionField.value})
            startLoading();

            _this.requestLLMTask('sample_answer', submitValue, (messageObject)=>{
                // Handle sample answer response
                let { material_id, question, sample_answer } = messageObject;
                const materialId = material_id;
                const sampleAnswer = sample_answer;
                console.log(`New sample answer received => ${materialId} ${sampleAnswer}`)

                if(!sampleAnswer) {
                    hideOnFailure();
                    console.error('failed to get sample answer')
                    return
                }

                if(!isAnswerViewShown) {
                    stopLoadingAnswerAndQuestion()
                    _this.answerView.showAnswer();
                    _this.answerView.startLoadingReview();
                }

                if(!sampleAnswer.endsWith('\\END')) {
                    _this.answerView.updateAnswer(sampleAnswer);
                } else {
                    _this.requestUpdateMaterial({'answer': sampleAnswer.replace(/\\END$/, '')})
                    _this.requestLLMTask('review', submitValue, (messageObject)=>{
                        // Handle review response
                        const { review } = messageObject;

                        if(!review) {
                            this.answerView.hideReview();
                        }
                        if(!isReviewViewShown) {
                            stopLoadingReview();
                            _this.answerView.showReview();
                            _this.answerView.scrollTo(); // Scroll to the review section
                        }
                        if(!review.endsWith('\\END')) {
                            _this.answerView.updateReview(review);
                        } else {
                            _this.requestUpdateMaterial({'review': review.replace(/\\END$/, '')})
                        }
                    });
                }
            });
        });
    }

    displayTitlePage(display) {
        if (display) {
            // Show MatrialTitlePage
            this.titlePage.$view.classList.add('display');
        } else {
            // Hide MaterialTitlePage
            this.titlePage.$view.classList.remove('display');
        }
    }

    displayTextPage(display) {
        if (display) {
            // Show MatrialTitlePage
            this.textPage.$view.classList.add('display');
        } else {
            // Hide MaterialTitlePage
            this.textPage.$view.classList.remove('display');
        }
    }

    submitMaterial(text) {
        const startLoading = () => {
            this.titleField.startLoading();
            this.titleField.show();

            this.keywordsField.startLoading();
            this.keywordsField.show();

            this.questionField.startLoading();
            this.questionField.show();
        } 

        const stopLoadingOnFailure = () => {
            this.titleField.stopLoading();
            this.titleField.hide();

            this.keywordsField.stopLoading();
            this.keywordsField.hide();

            this.questionField.stopLoading();
            this.questionField.hide();
        }

        const stopLoadingOnSuccess = () => {
            this.titleField.stopLoading();
            this.keywordsField.stopLoading();
            this.questionField.stopLoading();
        }

        startLoading();
        let _this = this;
        this.textField.onDisable = true;
        Http.post(`/v1/${this.lang}/materials/create`, { text },
            (res) => {
                const { _id, code, message } = res;

                console.log(`[${code} success] ${message}`);

                this.textField.onDisable = false;
                this.textField.alert(false);

                _this.materialId = _id;
                const submitValue = this.textField.value;
                _this.requestLLMTask('title_keywords', submitValue, (messageObject)=>{
                    let { material_id, title, keywords } = messageObject;
                    const materialId = material_id;
                    console.log(`New material title and keywords received => ${materialId} ${title} ${keywords}`)
                    stopLoadingOnSuccess();

                    if(!title) {
                        title = "";
                    }
                    if(!keywords) {
                        keywords = [];
                    }

                    // Set new title and keywords
                    _this.requestUpdateMaterial({'title': title, 'keywords': keywords}, false);
                    _this.titleField.setNewTitleWithFlash(title);
                    keywords.forEach((keyword) => {
                        console.log(`set keyword ${keyword}`);
                        _this.keywordsField.addKeyword(keyword);
                    });

                    // Dispatch NEW_MATERIAL_CREATED event
                    _this.$view.dispatchEvent(new CustomEvent(
                        MaterialsEventKeys.NEW_MATERIAL_CREATED, 
                        { detail: { materialId: materialId, title: title, text: _this.textField.value, keywords: keywords } }));
                });
                //    res.request_id, res.material_id);
            },
            (error) => {
                this._onError(error, this.textField);
                stopLoadingOnFailure();
            });
    }

    requestLLMTask(task, submitValue, callback) {
        const host = 'quantz.thinkxinc.com'
        const requestTokenURL = `https://${host}/stream/api/request-token`
        const session = "session111user123"

        const taskHandlers = {
            [task]: (messageObject) => {
                console.log(`Handling ${task}:`, messageObject);
                if (typeof callback === "function") {
                    callback(messageObject);
                }
            }
        };

        let config = new AsyncTaskClientConfig(taskHandlers, host, requestTokenURL);
        let client = new AsyncTaskClient(config);

        client.connect().then(() => {
            console.log("AsyncTaskClient connection established.");
            const requestData = new AsyncTaskClientRequestData(
                task,
                submitValue,
                this.materialId,
                session,
                this.lang
            );
            client.submit(requestData.toJson());
        }).catch((error) => {
            console.error("AsyncTaskClient failed to connect:", error);
        });
    }

    requestUpdateMaterial(updates, shouldDispatchEvent = true) {
        const url = `/v1/${this.lang}/materials/${this.materialId}/update`;
        Http.post(url, updates,
            (res) => {
                const { material_id, updates, messsage } = res;
                if (shouldDispatchEvent) {
                    if ('title' in updates) {
                        const { title } = updates;
                        this.$view.dispatchEvent(new CustomEvent(
                            MaterialsEventKeys.TITLE_UPDATED, // -> update cell through RootViewController
                            { detail: { materialId: this.materialId, title: title } }));
                    }
                    if ('keywords' in updates) {
                        const { keywords } = updates;
                        this.$view.dispatchEvent(new CustomEvent(
                            MaterialsEventKeys.KEYWORDS_UPDATED,
                            { detail: { materialId: this.materialId, keywords: keywords } }));
                    }
                    if ('text' in updates) {
                        const { text } = updates;
                        this.$view.dispatchEvent(new CustomEvent(
                            MaterialsEventKeys.TEXT_UPDATED, // -> update cell through RootViewController
                            { detail: { materialId: this.materialId, text: text } }));
                    }
                }
            }, 
            (error) => {
                const { errors, field_name, message } = error;

                if (shouldDispatchEvent) {
                    this.$view.dispatchEvent(new CustomEvent(
                        MaterialsEventKeys.UPDATE_FALIED, // -> to RootViewController
                        { detail: { materialId: this.materialId, fieldName: field_name, message: message } }));
                }
 
                switch (field_name) {
                    case 'title':
                        this._onError(error, this.titleField);
                        break
                    case 'text':
                        this._onError(error, this.textField);
                        break
                    case 'review':
                       this._onError(error, this.reviewField);
                       break
                    case 'keywords':
                      this._onError(error, this.keywordsField);
                      break
                }
            });
    }

    _onError(res, field) {
        // Reset view
        setTimeout(() => { 
           this.stopLoading(); 
        }, 500);

        // Handling the case where there is no res.errors but there is res.error.message
        if (!res.errors && res.error && res.error.message) {
            console.error(`[error] code:${res.error.code} reason:${res.error.reason} message: ${res.error.message}`);
            field.alert(res.error.message);
            setTimeout(() => { this.stopLoading(); }, 1000);
            return;  // Exit early as the specific error message has been handled
        } else if (res.message) {
            console.error(`[error] code:${res.code} reason:${res.reason} message: ${res.message}`);
            field.alert(res.message);
            setTimeout(() => { this.stopLoading(); }, 1000);
        } else {
            console.error(res);
        }
        
        let isFirstErrorHandled = false;
        (res.errors || []).forEach((error) => {
            console.warn(`[fieldName] ${error.fieldName} [message] ${error.message}`);
            if (!isFirstErrorHandled) {
                field.alert(error.message);
                isFirstErrorHandled = true;

                return
            }
        });
    }

    _completeMaterialSubmission() {

    }
    
    /**
     * InputViewController protocol.
     */
    completeSubmission() {
        //const url = `${this.lang}/success_page`;
        //Browser.goTo(url);
    }
}