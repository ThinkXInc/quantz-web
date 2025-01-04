class DeployViewController {
    constructor({ 
        id, 
        locale, 
        lang = 'en', 
        user 
    }) {
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.user = user;

        // Optional body styling
        document.body.classList.add('dark');
        document.body.style.overflow = 'hidden';

        // The main container in which we'll mount the CustomizeView
        this.$mainContent = document.getElementById('MainContent');

        // Initialize the CustomizeView
        this._initCustomizeView();
    }

    _initCustomizeView() {
        // Create the CustomizeView instance
        this.customizeView = new CustomizeView({
            user: this.user,
            lang: this.lang,
            locale: this.locale
        });

        // Mount it into our main container
        this.customizeView.mount(this.$mainContent);

        // If desired, do something after the view is "ready"
        this.customizeView.viewReady
            .then(() => {
                console.log('CustomizeView is ready and data loaded.');
            })
            .catch(err => {
                console.error('CustomizeView failed to load:', err);
            });
    }
}
