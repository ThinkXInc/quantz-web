class InterviewListCellContent extends TableViewCellContent {
    constructor({
        interviewId = '',
        title = '',
        text = '',
        icon = '',
        label = '',
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
    }
}

class InterviewListCell extends TableViewCell {
    constructor({
        tableView,
        index,
        title = '',
        text = '',
        icon = '',
        label = '',
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
            label: label,
            ...otherOptions
        });

        this.maxDisplayTitleLength = maxDisplayTitleLength;
        this.maxDisplayTextLength = maxDisplayTextLength;

        // Append $isChecked to the cell
        // TODO: option in modalview
        this.$isChecked = document.createElement('div');
        this.$isChecked.classList.add('isChecked');
        if (this.isChecked) {
            this.$isChecked.classList.add('hide');
        }
        this.$header.style.position = 'relative';
        this.$header.appendChild(this.$isChecked);
    }

    set text(text) {
        this._text = text;
        this.$text.textContent = truncateText(text, this.maxDisplayTextLength);
    }

    set isChecked(value) {
        this._isChecked = value;
        if (value == true) {
            this.$isChecked.classList.add('hide');
        } else {
            this.$isChecked.classList.remove('hide');
        }
    }

    updateTitle(title, maxCharacterLength = this.maxDisplayTitleLength, flashDuration = 10, cursorChar = ' ', truncateSuffix = "...") {
        flashText(this, 'title', truncateText(title, maxCharacterLength), flashDuration, 0, cursorChar);
    }
}


/**
    <div id="InterviewList" class="interviewList">
        <div class="tableViewConteiner">

            <div class="interviewListHeader">
                <div class="leftContainer">
                    <h1 class="interviewListHeaderTitle">Neuman's Knowledge</h1>
                    <h3 class="interviewListCount">5 Interviews</h3>
                </div>
                <div class="rightContainer">
                    <img class="search_icon" src="/img/search-icon.png" srcset="/img/search-icon@2x.png">
                </div>
            </div>

            <div class="createNew">
                <img class="plusIcon" src="/img/plus-icon.png" srcset="/img/plus-icon@2x.png">
                <h4 class="title">Add new interview</h4>
            </div>

            <div class="InterviewListTable TableView">
                <div class="tableListViewWrapper">
                    <ul class="interviews tableListView">
                        <li class="interview">
                            <h6 class="title">Title 5</h6>
                            <p class="text">
                                The incredible demand to build out AI capacity has been primarily limited by Nvidia’s lack of ability to increase production. 
                            </p>
                        </li>
                        <li class="interview">
                            <h6 class="title">Title 5</h6>
                            <p class="text">
                                The incredible demand to build out AI capacity has been primarily limited by Nvidia’s lack of ability to increase production. 
                            </p>
                        </li>
                        <li class="interview">
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
class InterviewList extends TableView {
    constructor({
        id,
        lang,
        locale,
        tableViewId = "InterviewListTable",
        cellClass = InterviewListCell,
        cellContentClass = InterviewListCellContent,
        maxDisplayTitleLength = 100,
        maxDisplayTextLength = 100,
        deleteCellAnimationType = TableViewDeleteCellAnimationType.noAnimation,
        createNewButtonTitle = 'Create new interview',
        headerTitle = 'Your Interviews',
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

    loadInterviews() {
        this.loading(true);
        Http.get(`/v1/${this.lang}/interviews/list`, 
            (res) => {
                this.loading(false);

                const { interviews, count } = res
                this.updateHeaderInterviewCounts(count);
                debuglog(interviews)
                this.updateContentsFromInterviews(interviews);
            },
            (error) => {
                this.loading(false);
                // TODO: show error message
            });
    }

    updateContentsFromInterviews(interviews) {
        this.contents = interviews.map(d => {
            const contentData = {
                interviewId: d.id,
                title: d.title,
                text: d.introduction,
                label: this.locale.get('interview_list_cell_label', this.lang, [new Set(d.client_ids).size]),
                isChecked: d.is_result_checked,
            };
    
            console.log("Processing interview:", d);  // Log the entire interview object
            console.log("Creating InterviewListCellContent with:", contentData);  // Log the data used to create InterviewListCellContent
            
            return new InterviewListCellContent(contentData);
        });
    
        console.warn("Contents created:", this.contents);  // Log the final list of InterviewListCellContent objects
    }

    updateHeaderInterviewCounts(count) {
        if (count > 1) {
            this.$interviewListCount.textContent = `${count} ${this.listCountTextPlural}`
        } else {
            this.$interviewListCount.textContent = `${count} ${this.listCountTextSingular}`
        }
    }

    addNewCell(title, text, label, interviewId, isChecked, delay = 0, insertCellIndex = 0) {
        this.insertCell(
            new InterviewListCellContent({title: '', text: text, label: label, interviewId: interviewId, isChecked: isChecked })
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
        cell.isChecked = true;
        this.$view.dispatchEvent(new CustomEvent(
            "clickedInterviewCell", 
            { detail: { index: selectedIndex, interviewId: cell.content.interviewId, cell: cell } }));
    }

    updateTitleWithInterviewId(interviewId, title) {
        let cell = this._cellByInterviewId(interviewId);
        cell.updateTitle(title);
    }

    setChecked(clientId) {
        try {
            const cell = this._cellByClientId(clientId);
            cell.isChecked = true;
            console.log(`Cell with clientId ${clientId} has been set to checked.`);
        } catch (error) {
            console.error(`Failed to set cell as checked for clientId: ${clientId}`, error);
        }
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