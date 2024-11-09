//class InterviewResultsView {
//    constructor({
//        id,
//        interviewId,
//        locale,
//        lang
//    }) {
//        this.id = id;
//        this.interviewId = interviewId;
//        this.locale = locale;
//        this.lang = lang;
//
//        this.setupView();
//    }
//
//    setupView() {
//        this.$view = document.createElement('div');
//        this.$view.id = this.id;
//        this.$view.classList.add('InterviewResultsView');
//
//        // Basic structure, add content as needed
//        const $header = document.createElement('h3');
//        $header.textContent = this.locale.get('interview_results_title', this.lang);
//        this.$view.appendChild($header);
//
//        // Add more elements as required
//    }
//
//    mount(element) {
//        element.appendChild(this.$view);
//    }
//}

/**
 * interviewId -> interaction_model.client_ids -> chatdata -> chatdata.metadata
 */

class InterviewResultCellContent extends TableViewCellContent {
    constructor({
        interviewId = '',
        clientId = '',
        isChecked = false,
        title = '',
        text = '',
        label = '',
        icon = '',
        ...otherOptions
    }) {
        super({
            title: title,
            text: text,
            icon: icon,
            label: label,
            ...otherOptions
        });

        this.interviewId = interviewId;
        this.clientId = clientId;
        this.isChecked = isChecked;
    }
}

class InterviewResultCell extends TableViewCell {
    constructor({
        tableView,
        index,
        title = '',
        text = '',
        icon = '',
        isChecked = false,
        cellSelectedClassName = 'selected',
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
            cellSelectedClassName: cellSelectedClassName,
            ...otherOptions
        });

        this.maxDisplayTitleLength = maxDisplayTitleLength;
        this.maxDisplayTextLength = maxDisplayTextLength;
    }

    set text(text) {
        this._text = text;
        this.$text.textContent = truncateText(text, this.maxDisplayTextLength);
    }

    set isChecked(value) {
        this._isChecked = value;
        if (value == true) {
            this.$isChecked.classList.add('checked');
        } else {
            this.$isChecked.classList.remove('checked');
        }
    }

    get label() { this._label; }

    setContent(content) {
        this.content = content;
        this.title = content.title;
        this.text = content.text;
        this.label = content.label;
        this.isChecked = content.isChecked;
    }

    //updateTitle(title, maxCharacterLength = this.maxDisplayTitleLength, flashDuration = 10, cursorChar = ' ', truncateSuffix = "...") {
    //    flashText(this, 'title', truncateText(title, maxCharacterLength), flashDuration, 0, cursorChar);
    //}
}

class InterviewResults extends TableView {
    constructor({
        id,
        lang,
        locale,
        interviewId,
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
        this.locale = locale;
        this.interviewId = interviewId;
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

    fetchAndUpdate({limit = 20}) {
        this.loading(true);
        Http.get(`/v1/${this.lang}/interviews/${this.interviewId}/results/list?limit=${limit}`, 
            (res) => {
                this.loading(false);
    
                const { interview_results, count } = res;
                this.updateContents(interview_results);
                this.updateHeaderCount(count);
            },
            (error) => {
                this.loading(false);
                // TODO: show error message
            });
    }

    updateContents(interviewResults) {
        console.log("Received interviewResults:", interviewResults);  // Log the entire input array

        let contents = interviewResults.map(d => {
            console.log("Processing interview result:", d);  // Log each interview result
    
            // Safely access metadata and events
            let text = "";
            if (d.metadata && Array.isArray(d.metadata.events) && d.metadata.events.length > 3) {
                text = d.metadata.events[3].message + '...';
            } else {
                console.warn("Event at index 3 not found or metadata is missing for interview result:", d);
            }
            const title = d.name;
            const label = d.date_str;

            const contentData = {
                interviewId: this.interviewId,
                clientId: d.client_id,
                title: title,
                text: text,
                label: label,
                isChecked: d.is_result_checked,
            };

            console.log("Creating InterviewResultCellContent with:", contentData);  // Log the data used to create each InterviewResultCellContent

            return new InterviewResultCellContent(contentData);
        });
        this.contents = contents;
    }

    updateCount(count) {
        if (count > 1) {
            this.$count.textContent = this.locale('interview_results_count_plural', this.lang, [count])
        } else {
            this.$count.textContent = this.locale('interview_results_count_singular', this.lang, [count])
        }
    }

    addNewCell(interviewId, clientId, isChecked, dateString, title, text, delay = 0, insertCellIndex = 0) {
        this.insertCell(
            new InterviewListCellContent({
                clientId: clientId,
                isChecked: isChecked,
                dateString: dateString,
                title: title,
                text: text,
                interviewId: interviewId
            })
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
            "clickedInterviewResultCell", 
            { detail: { index: selectedIndex, clientId: cell.content.clientId, cell: cell } }));
    }

    updateTitleWithClientId(clientId, title) {
        let cell = this._cellByClientId(clientId);
        cell.updateTitle(title);
    }

    _cellByCleintId(clientId) {
        // Search for a cell with the matching interviewId
        let foundCell = this.cells.find(cell => cell.content && cell.content.clientId === clientId);
    
        // If a cell is found, return it
        if (foundCell) {
            return foundCell;
        }
    
        // If no cell is found, throw an error
        throw new Error(`No cell found with clientId: ${clientId}`);
    }

    createElements() {
        // Interview List Header
        this.createHeader();
    }

    createHeader () {
        this.$interviewResultsHeader = document.createElement('div');
        this.$interviewResultsHeader.classList.add('interviewResultsHeader');

        // Left Container
        this.$container = document.createElement('div');
        this.$container.classList.add('container');
        this.$interviewResultsHeader.appendChild(this.$container);

        this.$interviewResultsHeaderTitle = document.createElement('h1');
        this.$interviewResultsHeaderTitle.classList.add('interviewResultsHeaderTitle');
        this.$interviewResultsHeaderTitle.textContent = this.headerTitle;
        this.$container.appendChild(this.$interviewResultsHeaderTitle);

        this.$interviewResultsCount = document.createElement('h3');
        this.$interviewResultsCount.classList.add('interviewResultsCount');
        this.$interviewResultsCount.textContent = this.listCountText;
        this.$container.appendChild(this.$interviewResultsCount);

        // Insert interviewResultsHeader at the beginning of the $tableViewContainer
        this.$tableViewContainer.insertBefore(this.$interviewResultsHeader, this.$tableViewContainer.firstChild);
    }

    _addEventHandlers() {
        const _this = this;
        //this.$createNew.addEventListener('click', () => {
        //    console.log(`${this.id} ${this.$createNew.id} clicked`);
        //    // Dispatch event
        //    this.$view.dispatchEvent(new CustomEvent(
        //        "clickedNewInterviewButton", 
        //        { detail: { } }));
        //})
    }


}