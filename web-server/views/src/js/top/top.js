document.addEventListener('DOMContentLoaded', ()=>{
    const lang = window.lang;
    const locale = window.locale;
    const unitPrice = window.unitPrice;
    const freeCall = window.freeCall;

    console.log(`set up top view.\nlang:${lang}`);

    // initialize top view
    const top = new Top({
        locale: locale,
        lang: lang});
});

class Top {
    constructor({
        locale,
        lang
    }) {
        this.locale = locale;
        this.lang = lang;

        //this.setupDemoView();
        this.setupEvents();
    }

    setupDemoView() {
        const $demoView = document.getElementById('demoViewInterface');


        //const buttonTypeSelector = new RadioButton({
        //    id: "ButtonType",
        //    fieldName: "button_type",
        //    hasTitle: true,
        //    defaultValue: "Default",
        //    title: this.locale.get("settings_customize_button_type_title", lang),
        //    items: [
        //        new RadioButtonItem({value: "Default", name: this.locale.get("settings_customize_button_type_item_A", lang)}),
        //    ]
        //})

        $demoView.insertBefore(buttonTypeSelector.$view, $demoView.firstChild);
        //this.buttonTypeSelector = buttonTypeSelector;
    }

    setupEvents() {
        //this.buttonTypeSelector.$view.addEventListener('valuechanged', (e) => {
        //    e.preventDefault();
        //    const {newValue} = e.detail;
        //    console.warn(`button type: ${newValue}`)

        //    const buttonsA = document.querySelectorAll('.A');
        //    const buttonsB = document.querySelectorAll('.B');

        //    if (newValue === "A") {
        //        buttonsB.forEach(button => button.classList.remove('show'));
        //        buttonsA.forEach(button => button.classList.add('show'));
        //    } else {
        //        buttonsA.forEach(button => button.classList.remove('show'));
        //        buttonsB.forEach(button => button.classList.add('show'));
        //    }
        //})
    }
}