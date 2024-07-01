(function(ns) {
    ns.LanguageCode = {
        en: "en",
        ja: "ja",
        fr: "fr",
        ru: "ru",
        es: "es",
        zh: "zh",
        ar: "ar"
    };

    ns.Language = class {
        constructor(langName, langCode, enable) {
            this.langName = langName;
            this.langCode = langCode;
            this.enable = enable;
        }
    }

    ns.Locale = class {
        constructor({buttonId, containerId, closeAreaId, languages, defaultLang}) {
            this.buttonId = buttonId;
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error(`Container with ID ${containerId} does not exist.`);
                return;
            }
            this.closeArea = document.getElementById(closeAreaId); // prefix already set
            if (!this.closeArea) {
                console.error(`Close area with ID ${closeAreaId} does not exist.`);
                return;
            }

            this.languages = languages;
            this.lang = defaultLang;
            this.initialize({buttonId: buttonId});
        }

        initialize({buttonId}) {
            // Create locale root element
            const locale = document.createElement('div');
            locale.className = ns.configs[buttonId].prefix + 'locale';

            // Create localeButton
            const localeButton = document.createElement('div');
            localeButton.className = ns.configs[buttonId].prefix + 'locale-button';

            const localeIcon = document.createElement('img');
            localeIcon.src = ns.configs[buttonId].localeIconSrc;
            localeIcon.classList.add(ns.configs[buttonId].prefix + 'locale-icon');
            localeButton.appendChild(localeIcon);

            const arrowIcon = document.createElement('img');
            arrowIcon.src = ns.configs[buttonId].arrowDownIconSrc;
            arrowIcon.classList.add(ns.configs[buttonId].prefix + 'arrow-icon');
            localeButton.appendChild(arrowIcon);

            locale.appendChild(localeButton);

            // Create selector
            const selector = document.createElement('div');
            selector.className = ns.configs[buttonId].prefix + 'selector';
            selector.style.display = 'none';  // Initially hidden

            this.languages.forEach(language => {
                const langElement = document.createElement('p');
                langElement.textContent = language.langName;
                // Check if language is enabled
                if (language.enable) {
                    langElement.onclick = () => {
                        this.setLanguage(language.langCode, selector);
                    };
                } else {
                    langElement.classList.add('disabled'); // Add 'disabled' class for CSS styling
                    langElement.onclick = (e) => {
                        e.preventDefault(); // Prevent click action if not enabled
                    };
                }
                selector.appendChild(langElement);
            });

            locale.appendChild(selector);

            // Toggle selector on button click
            localeButton.onclick = (e) => {
                e.stopPropagation();
                selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
            };

            this.closeArea.addEventListener('mousedown', (e) => {
                // Close the locale only if the click is outside the locale button and selector
                if (!localeButton.contains(e.target) && !selector.contains(e.target)) {
                    e.preventDefault(); // Prevents default behavior
                    this.close();
                }
            });

            this.container.appendChild(locale);
            this.selector = selector;
        }

        setLanguage(langCode) {
            this.lang = langCode;
            this.close();
            console.log(`Language set to: ${this.lang}`);  // For demonstration
            this.dispatchLanguageChangeEvent({buttonId: this.buttonId, lang: lang});
        }

        dispatchLanguageChangeEvent({buttonId, lang}) {
            const event = new CustomEvent(ns.configs[buttonId].languageChangeEventName, {
                detail: {
                    buttonId: buttonId,
                    lang: lang 
                }
            });
            document.dispatchEvent(event);
        }
    
        close() {
            console.log('locale close');
            this.selector.style.display = 'none';  // Hide selector after selection
        }
    }
})(Quantz); 