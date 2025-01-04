class RootViewController {
    constructor({ id, locale, lang = 'en' }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;

        // Attempt to fetch the user, then decide which ViewController to use.
        this._init();
    }

    async _init() {
        try {
            // Fetch the user (redirect on failure).
            const user = await this.fetchUser();

            // Decide which screen to mount based on the URL path (or any other condition).
            const path = window.location.pathname; // e.g. "/en/deploy" or "/en/materials" or "/en/create"
            if (path.includes('materials')) {
                // Show the MaterialsViewController
                this.controller = new MaterialsViewController({
                    id: 'MainContent',
                    locale: this.locale,
                    lang: this.lang,
                    user: user
                });
            } else if (path.includes('deploy')) {
                // Show the DeployViewController
                this.controller = new DeployViewController({
                    id: 'MainContent',
                    locale: this.locale,
                    lang: this.lang,
                    user: user
                });
            } else if (path.includes('create')) {
                // Show the CreateViewController (for example)
                this.controller = new CreateViewController({
                    id: 'MainContent',
                    locale: this.locale,
                    lang: this.lang,
                    user: user
                });
            } else {
                // Default or fallback: you can choose whichever view you want here
                this.controller = new DeployViewController({
                    id: 'MainContent',
                    locale: this.locale,
                    lang: this.lang,
                    user: user
                });
            }
        } catch (err) {
            console.error('[RootViewController] Failed to fetch user or error:', err);
            // If user is not fetched, redirect to sign-in
            window.location.href = `/v1/${this.lang}/signin`;
        }
    }

    async fetchUser() {
        const endpoint = `/v1/${this.lang}/user`;
        const response = await fetch(endpoint, { method: 'GET' });

        if (!response.ok) {
            // Possibly handle unauthorized or not found
            if (response.status === 401 || response.status === 404) {
                throw new Error('User not authorized or not found');
            }
            // If some other error, parse the JSON for a message.
            const errJson = await response.json();
            throw new Error(errJson.message || 'Failed to fetch user');
        }

        const data = await response.json();
        return data.user; // or however your JSON returns the user
    }
}