document.addEventListener('DOMContentLoaded', ()=>{
    const lang = window.lang;
    const locale = window.locale;
    const unitPrice = window.unitPrice;
    const freeCall = window.freeCall;

    console.log(`set up InterviewTop view.\nlang:${lang}`);

    // initialize top view
    const top = new InterviewTop({
        locale: locale,
        lang: lang});
});

class InterviewTop {
    constructor({
        locale,
        lang
    }) {
        this.locale = locale;
        this.lang = lang;

    }
}

