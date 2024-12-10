const MaterialsEventKeys = {
    NEW_MATERIAL_CREATED: "newMaterialCreated",
    CLICKED_CREATE_NEW_BUTTON: "clickedCreateNewButton",
    CLICKED_MATERIAL_TABLE_VIEW_CELL: "clickedMaterialTableViewCell",
    CONFIRMED_DELETE_MATERIAL: "confirmedDeleteMaterial",
    TEXT_UPDATED: "textUpdated",
    TITLE_UPDATED: "titleUpdated",
    KEYWORDS_UPDATE: "keywordsUpdated",
    UPDATE_FALIED: "updateFailed",
    CLICKED_SETTINGS_ICON: "clickedSettingsIcon"
};

const MaterialsLocaleKeys = {
    HEADER_TITLE: "MaterialList_header_title",
    COUNT_MATERIAL: "MaterialList_count_materials",
    ADD_NEW_MATERIAL: "MaterialList_add_new_button_title",
    SETTINGS_MODAL_VIEW_TITLE: "SettingsModalView_title",
    SETTINGS_MODAL_VIEW_TEXT: "SettingsModalView_text",
    SETTINGS_MODAL_VIEW_CANCEL: "SettingsModalView_cancel",
    SETTINGS_MODAL_VIEW_DONE: "SettingsModalView_done",
    SETTINGS_ORIGIN_EXPLANATION_ORIGINAL_DOMAIN: "settings_origin_explanation_original_domain",
    SETTINGS_ORIGIN_EXPLANATION_PUBLIC_DOMAIN: "settings_origin_explanation_public_domain",
    SETTINGS_ORIGIN_ERROR_INVALID_DOMAIN: "settings_origin_error_invalid_domain",
    SETTINGS_ORIGIN_ERROR_NOT_CORRESPOND: "settings_origin_error_not_correspond",
    SETTINGS_EMAIL_PENDING: "settings_email_pending",
    SETTINGS_EMAIL_VERIFIED: "settings_email_verified",
    SETTINGS_RESEND_BUTTON_TEXT: "settings_resendButtonText",
    SETTINGS_PURCHASE_UNIT_TITLE: "settings_purchaseUnit_title",
    SETTINGS_PURCHASE_UNIT_PLACEHOLDER: "settings_purchaseUnit_placeholder",
    titlePlaceholder: "MaterialTitleField__text__placeholder",
    textFieldPlaceholder: "MaterialTextField__text__placeholder",
    textFieldEnterButtonPress: "MaterialTextField__enterButton__press",
    textFieldEnterButtonEnter: "MaterialTextField__enterButton__enter",
    textFieldEnterButtonSplitNotice: "MaterialTextField__splitNotice",
    sampleQuestionTitle: "MaterialSampleQuestionField__title",
    sampleQuestionPlaceholder: "MaterialSampleQuestionField__text__placeholder",
    sampleQuestionPress: "MaterialSampleQuestionField__press",
    sampleQuestionEnter: "MaterialSampleQuestionField__enter",
    sampleAnswerViewAnswerTitle: "MaterialSampleAnswerView__answer__title",
    sampleAnswerViewReviewTitle: "MaterialSampleAnswerView__review__title"
};

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

class MaterialsView {
    constructor({
        id,
        locale,
        lang = 'en',
        insertCellDelay = 1000
    }) {
        this.id = id;
        this.lang = lang;
        this.locale = locale;
        this.insertCellDelay = insertCellDelay;

        this.createCreateView(lang, locale);
        this.handleCreateViewEvents();
        this.createListView(lang, locale);
        this.handleListViewEvents();
        this.createDeleteModalView(lang, locale);
        this.handleDeleteModalViewEvents();
        this.createSettingsView(lang, locale);
        this.handleSettingsViewEvents();
    }

    createCreateView(lang, locale) {
        this.materialCreateViewController = new MaterialCreateViewController({
            id: 'MaterialCreateView',
            locale: locale,
            lang: lang,
            material: null,
            loading: new GradientLoadingBar({
                id: 'MaterialViewLoadingBar',
            }),
            alertMessage: new AlertMessage('MaterialCreateView__AlertMessage'),
        });

        // notification
        this.notification = new Notification({id: 'MaterialsNotification', position: NotificationPosition.topCenter})
        this.notification.mount('#MainContent');
    }

    handleCreateViewEvents() {
        const _this = this;

        // NEW_MATERIAL_CREATED
        this.materialCreateViewController.$view.addEventListener(MaterialsEventKeys.NEW_MATERIAL_CREATED, (event) => {
            console.log("A new material was created:", event.detail);
            const { title, text, materialId } = event.detail;
            // Add new cell on top of the table (newCell.updateTitle and selectCellAtIndex are called)
            _this.materialList.addNewCell(title, text, materialId, this.insertCellDelay);
        });

        // TEXT_UPDATED
        this.materialCreateViewController.$view.addEventListener(MaterialsEventKeys.TEXT_UPDATED, (event) => {
            console.log("Title updated:", event.detail);
            const { materialId, text } = event.detail;

            // show success notification
            this.notification.show({
                message: locale.get("Material_update_success", lang),
                type: NotificationType.success,
                animationType: NotificationAnimationType.fadeIn,
                duration: NotificationDuration.short
            })
        })

        // TITLE_UPDATED
        this.materialCreateViewController.$view.addEventListener(MaterialsEventKeys.TITLE_UPDATED, (event) => {
            console.log("Title updated:", event.detail);
            const { materialId, title } = event.detail;
            // Update title in cell
            _this.materialList.updateTitleWithMaterialId(materialId, title);

            // show success notification
            this.notification.show({
                message: locale.get("Material_update_success", lang),
                type: NotificationType.success,
                animationType: NotificationAnimationType.fadeIn,
                duration: NotificationDuration.short
            })
        })

        // UPDATE_FAILED
        this.materialCreateViewController.$view.addEventListener(MaterialsEventKeys.UPDATE_FALIED, (event) => {
            console.log("Update failed:", event.detail);
            const { materialId, fieldName, message } = event.detail;

            // show falied notification
            this.notification.show({
                message: locale.get("Material_update_failed", lang),
                type: NotificationType.failed,
                animationType: NotificationAnimationType.fadeIn,
                duration: NotificationDuration.short
            })
        })
    }

    createListView(lang, locale) {
        this.materialList = new MaterialList({
            id: 'MaterialList',
            lang: lang,
            createNewButtonTitle: locale.get(MaterialsLocaleKeys.ADD_NEW_MATERIAL, lang),
            headerTitle: locale.get('MaterialList_header_title', lang),
            listCountTextSingular: locale.get('MaterialList_count_singular', lang),
            listCountTextPlural: locale.get('MaterialList_count_plural', lang),
        });
        this.materialList.loadMaterials();
        this.materialList.appendToElementById('MaterialListContainer');
    }

    handleListViewEvents(){
        // CLICKED_CREATE_NEW_BUTTON
        this.materialList.$view.addEventListener(MaterialsEventKeys.CLICKED_CREATE_NEW_BUTTON, (event) => {
            console.log("Create New Button was clicked:", event.detail);

            // Open MaterialCreateView without default value
            //const title = 'New Title is What I need is to be is to do . ';
            //const text = 'This is new cell. This service allows the Conversational AI to speak and respond with its own knowledge (e.g. service manual, explanation of items) and test it as close to the situation as possible to achieve the most appropriate user experience.';
            //this.materialList.addNewCell(title, text);
            this.materialCreateViewController.resetViewsWithMaterial(null);
            //let oldView = this.materialCreateViewController.$view;
            //this.createMaterialCreateView(lang, locale);
            //oldView.remove();
        })

        // CLICKED_MATERIAL_TABLE_VIEW_CELL
        this.materialList.$view.addEventListener(MaterialsEventKeys.CLICKED_MATERIAL_TABLE_VIEW_CELL, (event) => {
            console.log("MaterialTableViewCell clicked:", event.detail);

            const { index, materialId, cell } = event.detail;

            this.materialList.toggleButtonInteractionModeAtIndex(index, true);

            // TODO:
            // this.materialCreateViewController.loading(true);

            // Get material 
            const url = `/v1/${this.lang}/materials/${materialId}`;
            Http.get(url, 
                (res) => {
                    const { material } = res

                    // Open MaterialCreateView with default values
                    this.materialCreateViewController.resetViewsWithMaterial(material);
                    // TODO: this.materialCreateViewController.loading(false);
                },
                (error) => {
                    // TODO: show error message
                    // TODO: this.materialCreateViewController.loading(false);
                }
            );
        })

        // delete cell event
        this.materialList.$view.addEventListener(this.materialList.deleteCellEventName, (event) => {
            console.log("MaterialTableViewCell deleteButton clicked:", event.detail);

            const {index, cell} = event.detail;

            // Open dialog
            console.warn(this.materialDeleteModalView);
            this.materialDeleteModalView.show(cell);
        })

    }

    createDeleteModalView(lang, locale) {
        this.materialDeleteModalView = new MaterialDeleteModalView({
            id: 'MaterialDeleteModalView', 
            locale: locale,
            lang: lang,
            title: locale.get("MaterialDeleteModalView_title", lang),
            text: locale.get("MaterialDeleteModalView_text", lang),
            cancelButtonText: locale.get("MaterialDeleteModalView_cancel", lang),
            doneButtonText: locale.get("MaterialDeleteModalView_done", lang),
            shouldCloseOnTapBG: true,
        });
        this.materialDeleteModalView.mount('#MainContent');
    }

    handleDeleteModalViewEvents() {
        // MaterialDeleteModalView CONFIRMED_DELETE_MATERIAL event
        this.materialDeleteModalView.$view.addEventListener(MaterialsEventKeys.CONFIRMED_DELETE_MATERIAL, (event) => {
            const { materialId, cell } = event.detail;
            const url = `/v1/${this.lang}/materials/${materialId}/delete`;
            Http.post(url, {'material_id': materialId},
                (res) => {
                    console.log(`[${res.code} success] ${res.message}`);

                    // Close ModalView 
                    this.materialDeleteModalView.alert(false);
                    this.materialDeleteModalView.close();

                    // Remove Cell from ListTable
                    this.materialList.deleteRowAtIndex(cell.index);

                    // Show CreateNew window
                    this.materialCreateViewController.resetViewsWithMaterial(null);
                },
                (error) => {
                    console.error(error);
                    this.materialDeleteModalView.alert(true, error.message);
                }
            );
        })
    }

    createSettingsView(lang, locale) {

        fetch(`/v1/${lang}/user`)
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

                this.settingsModalView = new SettingsModalView({
                    id: 'SettingsModalView', 
                    user: user,
                    locale: locale,
                    lang: lang,
                    title: locale.get(MaterialsLocaleKeys.SETTINGS_MODAL_VIEW_TITLE, lang),
                    text: "",
                    cancelButtonText: locale.get(MaterialsLocaleKeys.SETTINGS_MODAL_VIEW_CANCEL, lang),
                    doneButtonText: locale.get(MaterialsLocaleKeys.SETTINGS_MODAL_VIEW_DONE, lang),
                    shouldCloseOnTapBG: true,
                });
                this.settingsModalView.mount('#MainContent');
                document.getElementById('SettingsModalView').style.display = 'block'; // DEBUG SettingsModal open
            })
            .catch(error => {
                console.error('Unexpected error occurred when init:', error);
            });
    }

    handleSettingsViewEvents() {
        // settingsIcon click
        let settingsIcon = document.getElementById('settingsIcon');
        settingsIcon.addEventListener('mouseup', (event) =>{
            console.log('settingsIcon clicked')
            this.settingsModalView.show();
        })
    }
}