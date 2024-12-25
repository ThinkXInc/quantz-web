document.addEventListener('DOMContentLoaded', ()=>{
    const lang = window.lang;
    const locale = window.locale;
    const unitPrice = window.unitPrice;
    const freeCall = window.freeCall;

    console.log(`set up studio view.\nlang:${lang}`);

    // initialize studio app
    const studio = new Studio({
        locale: locale,
        lang: lang});
});

class Studio {
    constructor({
        locale,
        lang
    }) {
        this.locale = locale;
        this.lang = lang;
        this.user = {};

        this.setupView();
    }

    setupView() {
        const studioHeader = new StudioHeader({
            locale: this.locale,
            lang: this.lang
        })

    }

    setupMaterialsView() {

        const SMARTPHONE_WIDTH = 480;

        if (window.innerWidth <= SMARTPHONE_WIDTH) { // Check if the screen size is within the mobile range
            const $createNewButton = document.getElementById('CreateNew');
            const $listViewContainer = document.getElementById('MaterialListContainer')
            const $listView = document.getElementById('MaterialList')
            const $createView = document.getElementById('MaterialCreateView')

            // append header with back button to CreateView
            const $createViewHeader = document.createElement('div');
            $createViewHeader.classList.add('CreateViewHeader');

            const $back = document.createElement('img');
            $back.src = '/img/back-arrow.svg';
            $back.classList.add('back');
            $createViewHeader.appendChild($back);

            $createView.insertBefore($createViewHeader, $createView.firstChild);

            function isCreateViewShown() {
                return $createView.classList.contains('showCreateViewToLeft')
            }
            function showCreateView() {
                $listViewContainer.classList.remove('showListViewToRight');
                $createView.classList.remove('hideCreateViewToRight');
 
                $listViewContainer.classList.add('hideListViewToLeft');
                $createView.classList.add('showCreateViewToLeft');
            }
            function showListView() {
                $listViewContainer.classList.remove('hideListViewToLeft');
                $createView.classList.remove('showCreateViewToLeft');
 
                $listViewContainer.classList.add('showListViewToRight');
                $createView.classList.add('hideCreateViewToRight');

            }
    
            $createNewButton.addEventListener('click', function() {
                toCreateView();
            });

            $back.addEventListener('click', function() {
                toListView();
            })

            $listView.addEventListener(MaterialsEventKeys.CLICKED_MATERIAL_TABLE_VIEW_CELL, function(e) {
                toCreateView();
            });

            function toCreateView() {
                if (!isCreateViewShown()) {
                    showCreateView()
                }
            }
            function toListView() {
                if (isCreateViewShown()) {
                    showListView()
                }

            }
        }

    }
}
