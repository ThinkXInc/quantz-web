//const ConversationModelCreateViewPageIndex = Object.freeze({
//    // 0. Webサイトに組み込む / 自動ミーティングを作成する
//    // 1. 音声の選択 F0, F1
//    // 2. 話者の選択 
//    // 3. ステップ1タイプ 3-1 質問 3-2 フリートーク 3-3 
//    service: 0, voice: 1, face: 2, type: 3, step_1: 4, step_2: 5, step_3: 6
//})
//
//
//class ConversationModelCreateView {
//    constructor({
//        id,
//        user,
//        locale,
//        lang = 'en',
//    }) {
//        console.error(locale)
//
//        this.id = id;
//        this.user = user;
//        this.locale = locale;
//        this.lang = lang;
//
//        this.createView() {
//    }
//
//    mount($parent) {
//        $parent.appendChild(this.$view);
//    }
//
//    createView() {
//        const pageView = new PageView({
//            id: 'createConversationModelPageView',
//            numPages: 6
//        })
//        this.pageView = pageView;
//
//        this.pageView.$view.addEventListener('pageShown', (event) => {
//            const { pageIndex, page } = event.detail;
//        });
// 
//        // Page 1: Service
//        this.createServiceSelectPage() 
//        // Page 2: Voice
//        this.createVoiceSelectPage() 
//        // Page 3: Face
//        this.createFaceSelectPage() 
//        // Page 4: Type
//        this.createTypeSelectPage() 
// 
//    }
//
//}