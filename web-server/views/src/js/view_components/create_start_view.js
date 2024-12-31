/**
 * A view class responsible for building and handling the Start Page.
 * Usage:
 *   const startView = new CreateStartView({
 *       locale: ...,
 *       lang: ...,
 *       onNext: () => { ... }  // callback for "Start" button
 *   });
 *   pageView.appendChild(startView.$view, 0);
 */
class CreateStartView {
    constructor({ locale, lang, onNext }) {
        this.locale = locale;
        this.lang = lang;
        this.onNext = onNext; // callback that, e.g., navigates to the next page
        this.$view = this.createView();
    }

    /**
     * Builds the DOM structure for the Start Page and returns the container.
     */
    createView() {
        console.log('[CreateStartView] createView() called.');

        const $container = document.createElement('div');
        $container.classList.add('StartPageWrapper');

        // A button in the center to go to the next page
        const $button = document.createElement('button');
        $button.classList.add('StartPageButton');

        // Example usage of locale JSON to get the button label
        const $startButtonText = document.createElement('span');
        $startButtonText.textContent = this.locale.get("create_start_button", this.lang) 
            || "Start Creating your Conversation System";
        $button.appendChild($startButtonText);

        // When clicked, fire the onNext callback
        $button.addEventListener('click', () => {
            console.log('[CreateStartView] Start page button clicked.');
            $button.classList.add('action');
            setTimeout(() => {
                $button.classList.remove('action');
                if (typeof this.onNext === 'function') {
                    this.onNext();
                }
            }, 300);
        });

        $container.appendChild($button);
        return $container;
    }
}