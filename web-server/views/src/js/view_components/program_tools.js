class ProgramTools {
    constructor({
        id,
        locale,
        lang,
        onClickAddFlow,
        onClickAddFunction,
        onClickDelete,
        onClickAddImage,
        onClickAddVideo,
        showOnAttachedElementDisplayed = false
    } = {}) {
        this.id = id;
        this.locale  = locale;
        this.lang = lang;
        // Store the callback functions
        this.onClickAddFlow = onClickAddFlow;
        this.onClickAddFunction = onClickAddFunction;
        this.onClickDelete = onClickDelete;
        this.onClickAddImage = onClickAddImage;
        this.onClickAddVideo = onClickAddVideo;

        this.showOnAttachedElementDisplayed = showOnAttachedElementDisplayed;

        // Create the main tools container
        this.$view = document.createElement('div');
        this.$view.classList.add('ProgramTools');
        if (this.id) {
            this.$view.id = this.id;
        }

        // Create the inner wrapper
        this.$toolsWrapper = document.createElement('div');
        this.$toolsWrapper.classList.add('toolsWrapper');
        this.$view.appendChild(this.$toolsWrapper);

        // Create the menu list
        this.$menuList = document.createElement('ul');
        this.$menuList.classList.add('menu');
        this.$toolsWrapper.appendChild(this.$menuList);

        // ─────────────────────────────────────────────────────────────────────
        //  1) Add Step
        // ─────────────────────────────────────────────────────────────────────
        this.$addStepItem = document.createElement('li');
        this.$addStepItem.classList.add('item', 'addStep');
        
        const $addStepIcon = document.createElement('img');
        $addStepIcon.src = '/img/create/add-flow-icon.svg';
        $addStepIcon.classList.add('icon');
        const $addStepTooltip = document.createElement('span');
        $addStepTooltip.classList.add('tooltip');
        $addStepTooltip.textContent = this.locale.get('create_tools_add_flow', this.lang);

        this.$addStepItem.appendChild($addStepIcon);
        this.$addStepItem.appendChild($addStepTooltip);

        // Event handler: Add Step
        this.$addStepItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onClickAddFlow) {
                // If you want a direct callback, use `this.onClickAddFlow(e)`:
                // this.onClickAddFlow(e);
                // If you prefer an internal method, you can define `this.onClickAdd(e)` and call it here:
                this.onClickAddFlow(e);
            }
        });

        this.$menuList.appendChild(this.$addStepItem);

        // ─────────────────────────────────────────────────────────────────────
        //  2) Add Function
        // ─────────────────────────────────────────────────────────────────────
        this.$addFunctionItem = document.createElement('li');
        this.$addFunctionItem.classList.add('item', 'addFunction');

        // Adjust these values to your icons / text keys
        const $addFunctionIcon = document.createElement('img');
        $addFunctionIcon.src = '/img/create/add-function-icon.svg'; 
        $addFunctionIcon.classList.add('icon');
        const $addFunctionTooltip = document.createElement('span');
        $addFunctionTooltip.classList.add('tooltip');
        $addFunctionTooltip.textContent = this.locale.get('create_tools_add_function', this.lang);

        this.$addFunctionItem.appendChild($addFunctionIcon);
        this.$addFunctionItem.appendChild($addFunctionTooltip);

        // Event handler: Add Function
        this.$addFunctionItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onClickAddFunction) {
                this.onClickAddFunction(e);
            }
        });

        this.$menuList.appendChild(this.$addFunctionItem);
 
        // ─────────────────────────────────────────────────────────────────────
        //  2) Delete Step
        // ─────────────────────────────────────────────────────────────────────
        this.$deleteStepItem = document.createElement('li');
        this.$deleteStepItem.classList.add('item', 'deleteStep');
        
        const $deleteStepIcon = document.createElement('img');
        $deleteStepIcon.src = '/img/create/delete-icon.svg';
        $deleteStepIcon.classList.add('icon');
        const $deleteStepTooltip = document.createElement('span');
        $deleteStepTooltip.classList.add('tooltip');
        $deleteStepTooltip.textContent = this.locale.get('create_tools_delete', this.lang);

        this.$deleteStepItem.appendChild($deleteStepIcon);
        this.$deleteStepItem.appendChild($deleteStepTooltip);

        // Event handler: Delete Step
        this.$deleteStepItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onClickDelete) {
                this.onClickDelete(e);
            }
        });

        this.$menuList.appendChild(this.$deleteStepItem);

       // ─────────────────────────────────────────────────────────────────────
        //  3) Add Image (hidden for now)
        // ─────────────────────────────────────────────────────────────────────
        this.$addImageItem = document.createElement('li');
        this.$addImageItem.classList.add('item', 'addImage');
        // Hide by default if not ready
        this.$addImageItem.style.display = 'none';

        const $addImageIcon = document.createElement('img');
        $addImageIcon.src = '/img/create/add-image-icon.svg';
        $addImageIcon.classList.add('icon');
        const $addImageTooltip = document.createElement('span');
        $addImageTooltip.classList.add('tooltip');
        $addImageTooltip.textContent = this.locale.get('create_tools_image', this.lang);

        this.$addImageItem.appendChild($addImageIcon);
        this.$addImageItem.appendChild($addImageTooltip);

        // Event handler: Add Image
        this.$addImageItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onClickAddImage) {
                this.onClickAddImage(e);
            }
        });

        this.$menuList.appendChild(this.$addImageItem);

        // ─────────────────────────────────────────────────────────────────────
        //  4) Add Video (hidden for now)
        // ─────────────────────────────────────────────────────────────────────
        this.$addVideoItem = document.createElement('li');
        this.$addVideoItem.classList.add('item', 'addVideo');
        // Hide by default if not ready
        this.$addVideoItem.style.display = 'none';

        const $addVideoIcon = document.createElement('img');
        $addVideoIcon.src = '/img/create/add-video-icon.svg';
        $addVideoIcon.classList.add('icon');
        const $addVideoTooltip = document.createElement('span');
        $addVideoTooltip.classList.add('tooltip');
        $addVideoTooltip.textContent = this.locale.get('create_tools_video', this.lang);

        this.$addVideoItem.appendChild($addVideoIcon);
        this.$addVideoItem.appendChild($addVideoTooltip);

        // Event handler: Add Video
        this.$addVideoItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onClickAddVideo) {
                this.onClickAddVideo(e);
            }
        });

        this.$menuList.appendChild(this.$addVideoItem);

    }

    attach($stepContainer) {
        // Attach the entire tools view to the step container
        $stepContainer.appendChild(this.$view);

        if (this.showOnAttachedElementDisplayed) {
            this._initShowOnViewCenter($stepContainer);
        }
    }

    _initShowOnViewCenter($stepContainer) {
        // Attach a scroll event listener (and maybe also a resize listener)
        this._scrollHandler = () => {
            const rect = $stepContainer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
    
            // For “center of the screen,” we check if the center (both x and y) 
            // is within $stepContainer’s bounding rect.
            const centerX = windowWidth / 2;
            const centerY = windowHeight / 2;
    
            const isCenterInside =
                rect.left < centerX &&
                rect.right > centerX &&
                rect.top < centerY &&
                rect.bottom > centerY;
    
            if (isCenterInside) {
                this.$view.classList.add('show');
            } else {
                this.$view.classList.remove('show');
            }
        };
    
        // Call once initially
        this._scrollHandler();
    
        // Then attach
        window.addEventListener('scroll', this._scrollHandler, { passive: true });
        window.addEventListener('resize', this._scrollHandler);
    }

    // Example for an internal "add" method if you want to keep consistent naming:
    onClickAddFlow(e) {
        // Just call the provided callback
        if (this.onClickAddFlow) {
            this.onClickAddFlow(e);
        }
    }

    onClickAddFunction(e) {
        // Just call the provided callback
        if (this.onClickAddFunction) {
            this.onClickAddFunction(e);
        }
    }

    onClickDelete(e) {
        // Just call the provided callback
        if (this.onClickDelete) {
            this.onClickDelete(e);
        }
    }

    destroy() {
        if (this._scrollHandler) {
            window.removeEventListener('scroll', this._scrollHandler);
            window.removeEventListener('resize', this._scrollHandler);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
        // etc.
    }
}
