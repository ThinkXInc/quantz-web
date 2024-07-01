class MaterialDeleteModalView extends ModalView {
    constructor({
        id,
        locale,
        lang = 'en',
        title = "Delete material?",
        text = "This will delete a material",
        cancelButtonText = "Cancel",
        doneButtonText = "Delete",
        shouldCloseOnTapBG = true,
        htmlTag = 'div',
        protocols = [],
        validators = []
    }) {
        super({
            id,
            title,
            text,
            cancelButtonText,
            doneButtonText,
            shouldCloseOnTapBG,
            htmlTag,
            protocols,
            validators
        });

        this.text = text;
        this.locale = locale;
        this.lang = lang;

        this.createElements();
    }

    createElements() {
        super.createElements(); // Ensure base elements are created

        this.$materialTitle = document.createElement('span');
        this.$materialTitle.classList.add('materialTitle');
        this.$mainContent.appendChild(this.$materialTitle);
    }

    show(cell) {
        this.$materialTitle.textContent = cell.$title.textContent;
        this.$mainContent.textContent = `${this.text} "${cell.$title.textContent}"`;;
        this.cell = cell;
        super.show();
    }

    cancel() {
        // Close modal logic
        this.$view.style.display = 'none';
    }

    done() {
        // Trigger custom event
        if (!this.cell) {
            throw Error('No cell is set to MaterialDeleteModalView before confirming deletion.');
        }
        this.$view.dispatchEvent(
            new CustomEvent(
                MaterialsEventKeys.CONFIRMED_DELETE_MATERIAL,
                { detail: { materialId: this.cell.content.materialId, cell: this.cell } }));
    }
}