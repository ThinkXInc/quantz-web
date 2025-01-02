class LangSelector {
    constructor({
        container,    // The DOM element to render into (per group)
        langs = {},   // A map of langCode->displayName (e.g. {en:'English',ja:'日本語',...})
        currentLang,  // Which language to show as selected initially
        onLangChange, // A callback that fires when user changes language

        // Add two new optional parameters with default paths
        iconLocalePath = "/img/locale-icon.svg",
        iconArrowPath  = "/img/down-arrow.svg",
    }) {
        this.container = container;
        this.langs = langs;
        this.currentLang = currentLang;
        this.onLangChange = onLangChange;

        // Store the icon paths
        this.iconLocalePath = iconLocalePath;
        this.iconArrowPath = iconArrowPath;

        this.init();
    }

    init() {
        // lang-selector wrapper
        const wrapper = document.createElement('div');
        wrapper.classList.add('lang-selector');

        // The "button" that toggles open/close
        const button = document.createElement('div');
        button.classList.add('lang-selector-button');

        // Use icon paths from constructor
        button.innerHTML = `
            <img class="locale-icon" src="${this.iconLocalePath}" />
            <span class="current-lang">${this.langs[this.currentLang] || this.currentLang}</span>
            <img class="arrow-icon" src="${this.iconArrowPath}" />
        `;
        wrapper.appendChild(button);

        // The dropdown list
        const ul = document.createElement('ul');
        ul.classList.add('lang-options');
        wrapper.appendChild(ul);

        // Populate each language as an <li>
        Object.keys(this.langs).forEach(langCode => {
            const li = document.createElement('li');
            li.classList.add('select');
            li.setAttribute('data-lang', langCode);
            li.textContent = this.langs[langCode];
            ul.appendChild(li);
        });

        // Toggle show/hide
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('show');
        });

        // Close if user clicks outside
        document.addEventListener('click', () => {
            wrapper.classList.remove('show');
        });

        // Handle language item clicks
        ul.querySelectorAll('.select').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const newLang = e.currentTarget.getAttribute('data-lang');
                this.setCurrentLang(newLang);
                // Hide after selection
                wrapper.classList.remove('show');
            });
        });

        // Finally, mount it
        this.container.appendChild(wrapper);
    }

    /**
     * Update the displayed language label, and invoke callback.
     */
    setCurrentLang(newLang) {
        this.currentLang = newLang;

        // Update label
        const labelEl = this.container.querySelector('.current-lang');
        if (labelEl) {
            labelEl.textContent = this.langs[newLang] || newLang;
        }

        // Fire callback
        if (typeof this.onLangChange === 'function') {
            this.onLangChange(newLang);
        }
    }
}
