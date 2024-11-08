class InterviewResultsView {
    constructor({
        id,
        interviewId,
        locale,
        lang
    }) {
        this.id = id;
        this.interviewId = interviewId;
        this.locale = locale;
        this.lang = lang;

        this.setupView();
    }

    setupView() {
        this.$view = document.createElement('div');
        this.$view.id = this.id;
        this.$view.classList.add('InterviewResultsView');

        // Basic structure, add content as needed
        const $header = document.createElement('h3');
        $header.textContent = this.locale.get('interview_results_title', this.lang);
        this.$view.appendChild($header);

        // Add more elements as required
    }

    mount(element) {
        element.appendChild(this.$view);
    }
}

/**
 * interviewId -> interaction_model.client_ids -> chatdata -> chatdata.metadata
 */

class InterviewResultCellContent extends TableViewCellContent {
    constructor({
        interviewId = '',
        clientId = '',
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

        this.interviewId = interviewId;
    }
}

class InterviewResultCell extends TableViewCell {
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

class InterviewResults extends TableView {
    constructor({
        id,
        lang,
        tableViewId = "InterviewResults",
        cellClass = InterviewListCell,
        cellContentClass = InterviewListCellContent,
        maxDisplayTitleLength = 100,
        maxDisplayTextLength = 100,
        deleteCellAnimationType = TableViewDeleteCellAnimationType.noAnimation,
        createNewButtonTitle = '',
        headerTitle = '',
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

    loadResults() {
        this.loading(true);
        Http.get(`/v1/${this.lang}/interviews/results/list`, 
            (res) => {
                this.loading(false);

                const { interviewResults, count } = res
                this.updateHeaderInterviewCounts(count);
                debuglog(interviewResults)
                this.updateContentsFromInterviewResults(interviewResults);
            },
            (error) => {
                this.loading(false);
                // TODO: show error message
            });
    }

    updateContentsFromInterviewResults(interviewResults) {
        let contents = interviewResults.map(d => new InterviewResultCellContent({
            interviewId: d.interviewId,
            clientId: d.clientId,
            title: d.title,
            text: d.introduction
        }));
        this.contents = contents;
    }

    updateHeaderInterviewCounts(count) {
        if (count > 1) {
            this.$interviewListCount.textContent = `${count} ${this.listCountTextPlural}`
        } else {
            this.$interviewListCount.textContent = `${count} ${this.listCountTextSingular}`
        }
    }

    addNewCell(title, text, interviewId, delay = 0, insertCellIndex = 0) {
        this.insertCell(
            new InterviewListCellContent({title: '', text: text, interviewId: interviewId })
            , insertCellIndex, delay, (newCell)=> {
                newCell.updateTitle(title)
                this.selectCellAtIndex(newCell.index, newCell);
                this.toggleButtonInteractionModeAtIndex(newCell.index, false);
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
            "clickedInterviewCell", 
            { detail: { index: selectedIndex, interviewId: cell.content.interviewId, cell: cell } }));
    }

    updateTitleWithInterviewId(interviewId, title) {
        let cell = this._cellByInterviewId(interviewId);
        cell.updateTitle(title);
    }

    _cellByInterviewId(interviewId) {
        // Search for a cell with the matching interviewId
        let foundCell = this.cells.find(cell => cell.content && cell.content.interviewId === interviewId);
    
        // If a cell is found, return it
        if (foundCell) {
            return foundCell;
        }
    
        // If no cell is found, throw an error
        throw new Error(`No cell found with interviewId: ${interviewId}`);
    }

    _addEventHandlers() {
        const _this = this;
        this.$createNew.addEventListener('click', () => {
            console.log(`${this.id} ${this.$createNew.id} clicked`);
            // Dispatch event
            this.$view.dispatchEvent(new CustomEvent(
                "clickedNewInterviewButton", 
                { detail: { } }));
        })
    }

    createElements() {
        // Interview List Header
        this.createElementsListHeader();

        // Create New Section
        this.createElementsCreateNewButton();
    }

    createElementsListHeader () {
        this.$interviewListHeader = document.createElement('div');
        this.$interviewListHeader.classList.add('interviewListHeader');

        // Left Container
        this.$leftContainer = document.createElement('div');
        this.$leftContainer.classList.add('leftContainer');
        this.$interviewListHeader.appendChild(this.$leftContainer);

        this.$interviewListHeaderTitle = document.createElement('h1');
        this.$interviewListHeaderTitle.classList.add('interviewListHeaderTitle');
        this.$interviewListHeaderTitle.textContent = this.headerTitle;
        this.$leftContainer.appendChild(this.$interviewListHeaderTitle);

        this.$interviewListCount = document.createElement('h3');
        this.$interviewListCount.classList.add('interviewListCount');
        this.$interviewListCount.textContent = this.listCountText;
        this.$leftContainer.appendChild(this.$interviewListCount);

        // Right Container
        this.$rightContainer = document.createElement('div');
        this.$rightContainer.classList.add('rightContainer');
        this.$interviewListHeader.appendChild(this.$rightContainer);

        this.$search_icon = document.createElement('img');
        this.$search_icon.classList.add('search_icon');
        this.$search_icon.src = '/img/search-icon.png';
        this.$search_icon.srcset = '/img/search-icon@2x.png';
        this.$rightContainer.appendChild(this.$search_icon);

        // Insert interviewListHeader at the beginning of the $tableViewContainer
        this.$tableViewContainer.insertBefore(this.$interviewListHeader, this.$tableViewContainer.firstChild);
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


        // Insert createNew after interviewListHeader
        this.$tableViewContainer.insertBefore(this.$createNew, this.$interviewListHeader.nextSibling);
    }

}