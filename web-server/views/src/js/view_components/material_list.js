class MaterialListCellContent extends TableViewCellContent {
    constructor({
        materialId = '',
        title = '',
        text = '',
        icon = '',
        ...otherOptions
    }) {
        super({
            title: title,
            text: text,
            icon: icon,
            ...otherOptions
        });

        this.materialId = materialId;
    }
}

class MaterialListCell extends TableViewCell {
    constructor({
        tableView,
        index,
        title = '',
        text = '',
        icon = '',
        maxDisplayTitleLength = 100,
        maxDisplayTextLength = 100,
        ...otherOptions
    }) {
        super({
            tableView: tableView,
            index: index,
            title: title,
            text: text,
            icon: icon,
            ...otherOptions
        });

        this.maxDisplayTitleLength = maxDisplayTitleLength;
        this.maxDisplayTextLength = maxDisplayTextLength;
    }

    set text(text) {
        this._text = text;
        this.$text.textContent = truncateText(text, this.maxDisplayTextLength);
    }

    updateTitle(title, maxCharacterLength = this.maxDisplayTitleLength, flashDuration = 10, cursorChar = ' ', truncateSuffix = "...") {
        flashText(this, 'title', truncateText(title, maxCharacterLength), flashDuration, 0, cursorChar);
    }
}


/**
    <div id="MaterialList" class="materialList">
        <div class="tableViewConteiner">

            <div class="materialListHeader">
                <div class="leftContainer">
                    <h1 class="materialListHeaderTitle">Neuman's Knowledge</h1>
                    <h3 class="materialListCount">5 Materials</h3>
                </div>
                <div class="rightContainer">
                    <img class="search_icon" src="/img/search-icon.png" srcset="/img/search-icon@2x.png">
                </div>
            </div>

            <div class="createNew">
                <img class="plusIcon" src="/img/plus-icon.png" srcset="/img/plus-icon@2x.png">
                <h4 class="title">Add new material</h4>
            </div>

            <div class="MaterialListTable TableView">
                <div class="tableListViewWrapper">
                    <ul class="materials tableListView">
                        <li class="material">
                            <h6 class="title">Title 5</h6>
                            <p class="text">
                                The incredible demand to build out AI capacity has been primarily limited by Nvidia’s lack of ability to increase production. 
                            </p>
                        </li>
                        <li class="material">
                            <h6 class="title">Title 5</h6>
                            <p class="text">
                                The incredible demand to build out AI capacity has been primarily limited by Nvidia’s lack of ability to increase production. 
                            </p>
                        </li>
                        <li class="material">
                            <h6 class="title">Title 5</h6>
                            <p class="text">
                                The incredible demand to build out AI capacity has been primarily limited by Nvidia’s lack of ability to increase production. 
                            </p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
 */
class MaterialList extends TableView {
    constructor({
        id,
        lang,
        tableViewId = "MaterialListTable",
        cellClass = MaterialListCell,
        cellContentClass = MaterialListCellContent,
        maxDisplayTitleLength = 100,
        maxDisplayTextLength = 100,
        deleteCellAnimationType = TableViewDeleteCellAnimationType.noAnimation,
        createNewButtonTitle = 'Add new knowledge',
        headerTitle = 'Quantz\'s Knowledge',
        listCountTextSingular = ' Item',
        listCountTextPlural = ' Items',
        ...otherOptions
    }){
        super({
            id: id,
            cellClass: cellClass,
            cellContentClass: cellContentClass,
            deleteCellAnimationType: deleteCellAnimationType,
            ...otherOptions
        });

        this.lang = lang;
        this.tableViewId = tableViewId;
        this.maxDisplayTitleLength = maxDisplayTitleLength;
        this.maxDisplayTextLength = maxDisplayTextLength;
        this.createNewButtonTitle = createNewButtonTitle;
        this.headerTitle = headerTitle;
        this.listCountTextPlural = listCountTextPlural;
        this.listCountTextSingular = listCountTextSingular;

        this.createElements();
        this._addEventHandlers();
    }

    loadMaterials() {
        this.loading(true);
        Http.get(`/v1/${this.lang}/materials/list`, 
            (res) => {
                this.loading(false);

                const { materials, count } = res
                this.updateHeaderMaterialCounts(count);
                debuglog(materials)
                this.updateContentsFromMaterials(materials);
            },
            (error) => {
                this.loading(false);
                // TODO: show error message
            });
    }

    updateContentsFromMaterials(materials) {
        let contents = materials.map(d => new MaterialListCellContent({
            materialId: d._id,
            title: d.title,
            text: d.text
        }));
        this.contents = contents;
    }

    updateHeaderMaterialCounts(count) {
        if (count > 1) {
            this.$materialListCount.textContent = `${count} ${this.listCountTextPlural}`
        } else {
            this.$materialListCount.textContent = `${count} ${this.listCountTextSingular}`
        }
    }

    addNewCell(title, text, materialId, delay = 0, insertCellIndex = 0) {
        this.insertCell(
            new MaterialListCellContent({title: '', text: text, materialId: materialId })
            , insertCellIndex, delay, (newCell)=> {
                newCell.updateTitle(title)
                this.selectCellAtIndex(newCell.index, newCell);
            });
    }

    /**
     * TableView class protocol function
     * 
     * @protocol
     * @param {Int} selectedIndex 
     * @param {TableViewCell} cell 
     */
    tableViewCellSelectedAtIndex(selectedIndex, cell) {
        console.log(`${this.id}: cell ID:${cell.id} Index:${selectedIndex} clicked`)
        // Dispatch event
        this.$view.dispatchEvent(new CustomEvent(
            MaterialsEventKeys.CLICKED_MATERIAL_TABLE_VIEW_CELL, 
            { detail: { index: selectedIndex, materialId: cell.content.materialId, cell: cell } }));
    }

    updateTitleWithMaterialId(materialId, title) {
        let cell = this._cellByMaterialId(materialId);
        cell.updateTitle(title);
    }

    _cellByMaterialId(materialId) {
        // Search for a cell with the matching materialId
        let foundCell = this.cells.find(cell => cell.content && cell.content.materialId === materialId);
    
        // If a cell is found, return it
        if (foundCell) {
            return foundCell;
        }
    
        // If no cell is found, throw an error
        throw new Error(`No cell found with materialId: ${materialId}`);
    }

    _addEventHandlers() {
        const _this = this;
        this.$createNew.addEventListener('click', () => {
            console.log(`${this.id} ${this.$createNew.id} clicked`);
            // Dispatch event
            this.$view.dispatchEvent(new CustomEvent(
                MaterialsEventKeys.CLICKED_CREATE_NEW_BUTTON, 
                { detail: { } }));
        })
    }

    createElements() {
        // Material List Header
        this.createElementsListHeader();

        // Create New Section
        this.createElementsCreateNewButton();
    }

    createElementsListHeader () {
        this.$materialListHeader = document.createElement('div');
        this.$materialListHeader.classList.add('materialListHeader');

        // Left Container
        this.$leftContainer = document.createElement('div');
        this.$leftContainer.classList.add('leftContainer');
        this.$materialListHeader.appendChild(this.$leftContainer);

        this.$materialListHeaderTitle = document.createElement('h1');
        this.$materialListHeaderTitle.classList.add('materialListHeaderTitle');
        this.$materialListHeaderTitle.textContent = this.headerTitle;
        this.$leftContainer.appendChild(this.$materialListHeaderTitle);

        this.$materialListCount = document.createElement('h3');
        this.$materialListCount.classList.add('materialListCount');
        this.$materialListCount.textContent = this.listCountText;
        this.$leftContainer.appendChild(this.$materialListCount);

        // Right Container
        this.$rightContainer = document.createElement('div');
        this.$rightContainer.classList.add('rightContainer');
        this.$materialListHeader.appendChild(this.$rightContainer);

        this.$search_icon = document.createElement('img');
        this.$search_icon.classList.add('search_icon');
        this.$search_icon.src = '/img/search-icon.png';
        this.$search_icon.srcset = '/img/search-icon@2x.png';
        this.$rightContainer.appendChild(this.$search_icon);

        // Insert materialListHeader at the beginning of the $tableViewContainer
        this.$tableViewContainer.insertBefore(this.$materialListHeader, this.$tableViewContainer.firstChild);
    }

    createElementsCreateNewButton() {
        this.$createNew = document.createElement('div');
        this.$createNew.classList.add('createNew');
        this.$createNew.id = 'CreateNew';
        this.$view.appendChild(this.$createNew);

        this.$plusIcon = document.createElement('img');
        this.$plusIcon.classList.add('plusIcon');
        this.$plusIcon.src = '/img/plus-icon.png';
        this.$plusIcon.srcset = '/img/plus-icon@2x.png';
        this.$createNew.appendChild(this.$plusIcon);

        this.$title = document.createElement('h4');
        this.$title.classList.add('title');
        this.$title.textContent = this.createNewButtonTitle;
        this.$createNew.appendChild(this.$title);


        // Insert createNew after materialListHeader
        this.$tableViewContainer.insertBefore(this.$createNew, this.$materialListHeader.nextSibling);
    }

}