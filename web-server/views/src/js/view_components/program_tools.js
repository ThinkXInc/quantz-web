class ProgramTools {
    constructor({
        id,
        locale,
        lang,
        onClickAdd,
        onClickDelete,
        onClickAddImage,
        onClickAddVideo
    } = {}) {
        this.id = id;
        this.locale  = locale;
        this.lang = lang;
        // Store the callback functions
        this.onClickAdd = onClickAdd;
        this.onClickDelete = onClickDelete;
        this.onClickAddImage = onClickAddImage;
        this.onClickAddVideo = onClickAddVideo;

        // Create the main tools container
        this.$view = document.createElement('div');
        this.$view.classList.add('tools');
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
        $addStepIcon.src = '/img/create/add-step-icon.svg';
        $addStepIcon.classList.add('icon');
        const $addStepTooltip = document.createElement('span');
        $addStepTooltip.classList.add('tooltip');
        $addStepTooltip.textContent = this.locale.get('create_tools_add', this.lang);

        this.$addStepItem.appendChild($addStepIcon);
        this.$addStepItem.appendChild($addStepTooltip);

        // Event handler: Add Step
        this.$addStepItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onClickAdd) {
                this.onClickAdd(e);
            }
        });

        this.$menuList.appendChild(this.$addStepItem);

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
    }
}
