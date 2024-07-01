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

        this.setupDemoView();
        this.setupEvents();
    }

    setupDemoView() {
        const $demoView = document.getElementById('demoViewInterface');


        const buttonTypeSelector = new RadioButton({
            id: "ButtonType",
            fieldName: "button_type",
            hasTitle: true,
            defaultValue: "A",
            title: this.locale.get("settings_customize_button_type_title", lang),
            items: [
                new RadioButtonItem({value: "A", name: this.locale.get("settings_customize_button_type_item_A", lang)}),
                new RadioButtonItem({value: "B", name: this.locale.get("settings_customize_button_type_item_B", lang)}),
            ]
        })

        $demoView.insertBefore(buttonTypeSelector.$view, $demoView.firstChild);
        this.buttonTypeSelector = buttonTypeSelector;

        this.updateQuantzButton();
    }

    setupEvents() {
        this.buttonTypeSelector.$view.addEventListener('valuechanged', (e) => {
            e.preventDefault();
            const {newValue} = e.detail;
            console.warn(`button type: ${newValue}`)
            this.updateQuantzButton();
        })
    }

    updateQuantzButton() {
        const buttonId = `QBTN-top`;
        console.log(`Quantz button id to generate ${buttonId}`);

        let $btn = document.getElementById(buttonId);

        if (!$btn) {
            console.log(`No button found. Create new button loader.`)
            $btn = document.createElement('div');
            $btn.id = buttonId;
            $btn.classList.add('QBTN-quantz-button-loader');
            $btn.setAttribute('data-button-id', buttonId);
        } else {
            console.log(`Button found. Remove all children.`)
            while ($btn.firstChild) {
                $btn.removeChild($btn.firstChild);
            }
        }
       
        let configString;
        switch (this.buttonTypeSelector.value) {
            case 'A':
                configString = JSON.stringify({
                    buttonType: 'A',
                    iconSize: 25,
                    fontSize: 13,
                    buttonWidth: 200,
                    buttonHeight: 44,
                    buttonColor: '#b80613',
                    borderRadius: 20,
                    displayLocale: true,
                    balloonRectWidth: `30vw`,
                    balloonRectHeight: `20vh`,
                    defaultLang: this.lang
                });
                break;
            case 'B':
                configString = JSON.stringify({
                    buttonType: 'B',
                    iconSize: 30,
                    fontSize: 13,
                    buttonWidth: 260,
                    buttonHeight: 50,
                    buttonColor: '#0067FF',
                    borderRadius: 20,
                    displayLocale: true,
                    balloonRectWidth: `30vw`,
                    balloonRectHeight: `20vh`,
                    defaultLang: this.lang
                });
                break;
        }
       
        $btn.setAttribute('data-quantz-config', configString);
        
        // Once DOM is appended, the addition is observed by script and setup starts
        document.getElementById('QBTN-demo-button').appendChild($btn)
    }
}