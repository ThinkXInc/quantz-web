/**
 * `MaterialKeywordsField` is an extension of the `KeywordsField` class.
 * 
 * State Format:
 *    keywords = ["Keyword 1", "Keyword 2", ... ]
 * 
 * HTML Structure:
 *    <div id="MaterialKeywordsField" class="textField">
 *      <div class="inputOuter">
 *          <h6 class="title">{this.__title__}</h6>
 *          <ul class="keywords">
 *              <li class="keyword">
 *                  <p class="label">Keyword 1</p>
 *                  <button class="delete">
 *                      <svg><!-- delete icon here --></svg>
 *                  </button>
 *              </li>
 *          </ul>
 *          <input class="keywordform" name="keyword" type="text" autocomplete="off">
 *          <div class="footer">
 *              <span class="indicator"></span>
 *              <span class="message"></span>
 *              <span class="counter"></span>
 *          </div>
 *          <span class="press">press<strong>Enter ↵</strong></span>
 *      </div>
 *    </div>
 * 
 * Usage:
 *   const config = new KeywordsFieldConfig({ maxTextLength: 100, ... });
 *   const keywordsField = new MaterialKeywordsField('MaterialKeywordsField', 'fieldName', 'title', 'locale', 'placeholder', 'lang', [validatorFn1, validatorFn2], config);
 * 
 *   keywordsField.$textField.addEventListener('keywordsFieldCustomEventSubmit', (event) => {
 *       const keywords = event.detail.keywords;
 *   });
 * 
 */
class MaterialKeywordsField extends KeywordsField {
    constructor({
        id,
        fieldName,
        maxTextLength,
        pressText = 'press',
        enterText = 'Enter ↵',
        title = "",
        placeholder = "",
        cookieExclude = true,
        isDefaultValueRestoredFromCookie = false,
        shouldMapTextToDeleteButtonBGColor = false,
        constantDeleteButtonBGColorSaturation = 31,
        constantDeleteButtonBGColorLightness = 38,
        initRows = 1,
        verticalFlex = false,
        hasTitle = true,
        passwordMode = false,
        defaultValue = null,
        hasCookiePrefix = false,
        scrollControlElementId = null,
        isCounter = false
    }) {
        super({
            id,
            fieldName,
            maxTextLength,
            type: TextFieldType.singleline,  // Assuming this constant is defined
            pressText,
            enterText,
            title,
            placeholder,
            cookieExclude,
            isDefaultValueRestoredFromCookie,
            shouldMapTextToDeleteButtonBGColor,
            constantDeleteButtonBGColorSaturation,
            constantDeleteButtonBGColorLightness,
            initRows,
            verticalFlex,
            hasTitle,
            passwordMode,
            defaultValue,
            hasCookiePrefix,
            scrollControlElementId,
            isCounter
        });

        // Additional initializations specific to MaterialKeywordsField
        this.$textField.classList.add(id);
        this._addLoader();
    }

    show() {
        this.$textField.style.display = 'block';
    }

    hide() {
        this.$textField.style.display = 'none';
    }

    startLoading() {
        this.$inputOuter.style.display = 'none';
        this.$loader.style.display = 'block';
    }

    stopLoading() {
        this.$inputOuter.style.display = 'flex';
        this.$loader.style.display = 'none';
    }


    // Additional methods or overrides for MaterialKeywordsField
    _addLoader() {

        // Create the 'keywordsFieldLoader' div
        const $loader = document.createElement('div');
        $loader.className = 'loader keywordsFieldLoader';

        // Create the 'elements' ul
        const $elements = document.createElement('ul');
        $elements.className = 'elements';

        // Create some 'element' li items and append them to the 'elements' ul
        for (let i = 0; i < 5; i++) { // Change 5 to the number of 'li' elements you want
          const $element = document.createElement('li');
          $element.className = 'element';
          // You can also set some text or other attributes if you want
          // elementLi.innerText = `Item ${i + 1}`;
          $elements.appendChild($element);
        }

        // Append the 'elements' ul to the 'keywordsFieldloader' div
        $loader.appendChild($elements);

        this.$textField.appendChild($loader);
        this.$loader = $loader;

        //const gradientViewLoaderConfig = new GradientViewLoaderConfig();
        //gradientViewLoaderConfig.numIndicator = 1;
        //gradientViewLoaderConfig.individualHeight = 2;
        //gradientViewLoaderConfig.animationDelay = 15;
        //gradientViewLoaderConfig.defalutShift = 30;
        //const loader = new GradientViewLoader(null, 'KeywordsFieldGradientLoader', gradientViewLoaderConfig);
        //this.loader = loader;
        //this.$textField.appendChild(loader.$view);
        //this.$view.style.display = 'none';
    }



}
