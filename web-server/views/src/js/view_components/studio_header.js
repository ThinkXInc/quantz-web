class StudioHeader {
    constructor({
        id,
        locale,
        lang
    }) {
        console.log(`[StudioHeader] constructor called. id=${id}, lang=${lang}`);
        this.id = id;
        this.locale = locale;
        this.lang = lang;
        this.$toggleMenu = document.getElementById('StudioHeaderToggleMenu');
        this.$logo = document.getElementById('StudioHeaderLogo');
        this.$createNew = document.getElementById('StudioHeaderCreateNew');
        this.$deploy = document.getElementById('StudioHeaderDeploy');
        this.isMenuOpen = false;
        this._initEventListeners();
    }

    _initEventListeners() {
        console.log('[StudioHeader] _initEventListeners called.');

        if (this.$toggleMenu) {
            console.log('[StudioHeader] Binding click event for $toggleMenu');
            this.$toggleMenu.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[StudioHeader] $toggleMenu clicked');
                this.toggleMenu();
            });
        } else {
            console.warn('[StudioHeader] $toggleMenu element not found.');
        }

        if (this.$logo) {
            console.log('[StudioHeader] Binding click event for $logo');
            this.$logo.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[StudioHeader] $logo clicked');
                this.onLogoClick();
            });
        } else {
            console.warn('[StudioHeader] $logo element not found.');
        }

        if (this.$createNew) {
            console.log('[StudioHeader] Binding click event for $createNew');
            this.$createNew.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[StudioHeader] $createNew clicked');
                this.onCreateNewClick();
            });
        } else {
            console.warn('[StudioHeader] $createNew element not found.');
        }

        if (this.$deploy) {
            console.log('[StudioHeader] Binding click event for $deploy');
            this.$deploy.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[StudioHeader] $deploy clicked');
                this.onDeployClick();
            });
        } else {
            console.warn('[StudioHeader] $deploy element not found.');
        }
    }

    toggleMenu() {
        console.log(`[StudioHeader] toggleMenu called. Current state isMenuOpen=${this.isMenuOpen}`);
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        console.log('[StudioHeader] openMenu called.');
        this.isMenuOpen = true;
        this.$toggleMenu?.classList.remove('close');
        this.$toggleMenu?.classList.add('open');
        console.log('[StudioHeader] Dispatching StudioHeader:menuOpened event.');
        const openEvent = new CustomEvent('StudioHeader:menuOpened', {
            detail: {
                isOpen: this.isMenuOpen
            }
        });
        document.dispatchEvent(openEvent);
    }

    closeMenu() {
        console.log('[StudioHeader] closeMenu called.');
        this.isMenuOpen = false;
        this.$toggleMenu?.classList.remove('open');
        this.$toggleMenu?.classList.add('close');
        console.log('[StudioHeader] Dispatching StudioHeader:menuClosed event.');
        const closeEvent = new CustomEvent('StudioHeader:menuClosed', {
            detail: {
                isOpen: this.isMenuOpen
            }
        });
        document.dispatchEvent(closeEvent);
    }

    onLogoClick() {
        console.log('[StudioHeader] onLogoClick called.');
        //window.location.href = `/${this.lang}/studio`;
        window.location.href = `/${this.lang}/create`;
    }

    onCreateNewClick() {
        console.log('[StudioHeader] onCreateNewClick called.');
        window.location.href = `/${this.lang}/create`;
    }

    onDeployClick() {
        console.log('[StudioHeader] onDeployClick called.');
        window.location.href = `/${this.lang}/deploy`;
    }
}
