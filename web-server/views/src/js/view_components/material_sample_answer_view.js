/**
 * MaterialSampleAnswerView class.
 * 
 * html:
 * 
 *  <div id="MaterialSampleAnswerView" class="MaterialSampleAnswerView">
 *      <div class="mainContainer">
 *          <div class="answerContainer">
 *              <div class="answerTitleWrapper">
 *                  <img class="answerIcon">
 *                  <h6 class="title">Sample Answer</h6>
 *              </div>
 *              <p class="answerContent">
 *                  That is a good question! The humanity i<span class="fadein">s</span>
 *                  ...
 *              </p>
 *          </div>
 *          <div class="reviewContainer">
 *              <div class="reviewTitleWrapper">
 *                  <img class="reviewIcon">
 *                  <h6 class="title">Sample review</h6>
 *              </div>
 *              <p class="reviewContent">
 *                  That is a good question! The humanity i<span class="fadein">s</span>
 *                  ...
 *              </p>
 *          </div>
 *      </div>
 *      <div class="TitleFieldGradientLoader">...</div>
 *  </div>
 */
class MaterialSampleAnswerView extends ViewComponentBase {
    constructor({
        id,
        answerViewTitle = 'Sample Answer',  // Default provided if not specified
        reviewViewTitle = 'Sample Review',  // Default provided if not specified
        answerAnimationDelayMS = 300,  // Assuming milliseconds, realistic default provided
        reviewAnimationDelayMS = 300,  // Assuming milliseconds, realistic default provided
        fadeInClassName = 'fadein',  // Assuming typo corrected from 'fadin'
        visibleClassName = 'visible',  // Default CSS class names for state management
        invisibleClassName = 'invisible',  // Default CSS class names for state management
    }) {
        super(id);  // Correcting super to pass only necessary ID since ViewComponentBase likely only needs ID

        // Assign configuration properties directly within the constructor
        this.answerViewTitle = answerViewTitle;
        this.reviewViewTitle = reviewViewTitle;
        this.answerAnimationDelayMS = answerAnimationDelayMS;
        this.reviewAnimationDelayMS = reviewAnimationDelayMS;
        this.fadeInClassName = fadeInClassName;
        this.visibleClassName = visibleClassName;
        this.invisibleClassName = invisibleClassName;

        this.createElements(this.answerViewTitle, this.reviewViewTitle);
        this._setEventHandlers();
        this._addLoader();
    }

    updateAnswer(answer, animate = false) {
        if (animate) {
            this._displayText(
                this.$answerContent,
                answer,
                this.answerAnimationDelayMS
            );
        } else {
            this.$answerContent.innerText = answer;
        }
    }

    updateReview(review, animate = false) {
        if (animate) {
            this._displayText(
                this.$reviewContent,
                review,
                this.reviewAnimationDelayMS
            );
        } else {
            this.$reviewContent.innerText = review;
        }
    }

    showAnswer() {
        this.$answerContainer.classList.remove('hidden');
        this.$answerContainer.classList.add('visible');
        this.$answerContainer.style.display = 'flex';
    }

    showReview() {
        this.$reviewContainer.classList.remove('hidden');
        this.$reviewContainer.classList.add('visible');
        this.$reviewContainer.style.display = 'flex';
    }

    hideAnswer() {
        this.$answerContainer.classList.remove('visible');
        this.$answerContainer.classList.add('hidden');
        this.$answerContainer.style.display = 'none';
    }

    hideReview() {
        this.$reviewContainer.classList.remove('visible');
        this.$reviewContainer.classList.add('hidden');
        this.$reviewContainer.style.display = 'none';
    }

    startLoadingAnswer() {
        this.showAnswer();
        this.$answerContent.style.display = 'none';
        this.$answerLoader.style.display = 'block';
    }
    startLoadingReview() {
        this.showReview();
        this.$reviewContent.style.display = 'none';
        this.$reviewLoader.style.display = 'block';
    }

    stopLoadingAnswer() {
        this.$answerContent.style.display = 'block';
        this.$answerLoader.style.display = 'none';
    }

    stopLoadingReview() {
        this.$reviewContent.style.display = 'block';
        this.$reviewLoader.style.display = 'none';
    }


    createElements(answerViewTitle, reviewViewTitle) {
        this.$view.id = this.id;
        this.$view.classList.add(this.id);

        // Create main container
        const $mainContainer = document.createElement('div');
        $mainContainer.className = 'mainContainer';
        
        // Create answer container and its children
        const $answerContainer = document.createElement('div');
        $answerContainer.className = 'answerContainer';
        
        const $answerTitleWrapper = document.createElement('div');
        $answerTitleWrapper.className = 'answerTitleWrapper';
        const $answerIcon = document.createElement('img');
        $answerIcon.className = 'answerIcon';
        const $answerTitle = document.createElement('h6');
        $answerTitle.className = 'title';
        $answerTitle.textContent = answerViewTitle;
        
        $answerTitleWrapper.appendChild($answerIcon);
        $answerTitleWrapper.appendChild($answerTitle);
        $answerContainer.appendChild($answerTitleWrapper);
        
        const $answerContent = document.createElement('p');
        $answerContent.className = 'answerContent';
        $answerContent.innerText = `If the variables are becoming undefined, it could be a result of how your LESS is compiled or it might be an issue with your LESS environment. It would be beneficial to check whether your LESS compiler supports local scoping or if there are any issues in your build setup that could lead to this behavior.`;
        $answerContainer.appendChild($answerContent);
        
        // Create review container and its children
        const $reviewContainer = document.createElement('div');
        $reviewContainer.className = 'reviewContainer';
        
        const $reviewTitleWrapper = document.createElement('div');
        $reviewTitleWrapper.className = 'reviewTitleWrapper';
        const $reviewIcon = document.createElement('img');
        $reviewIcon.className = 'reviewIcon';
        const $reviewTitle = document.createElement('h6');
        $reviewTitle.className = 'title';
        $reviewTitle.textContent = reviewViewTitle;
        
        $reviewTitleWrapper.appendChild($reviewIcon);
        $reviewTitleWrapper.appendChild($reviewTitle);
        $reviewContainer.appendChild($reviewTitleWrapper);
        
        const $reviewContent = document.createElement('p');
        $reviewContent.className = 'reviewContent';
        $reviewContent.innerText = `If the variables are becoming undefined, it could be a result of how your LESS is compiled or it might be an issue with your LESS environment. It would be beneficial to check whether your LESS compiler supports local scoping or if there are any issues in your build setup that could lead to this behavior.`;
        $reviewContainer.appendChild($reviewContent);
        
        // Append children to main container
        $mainContainer.appendChild($answerContainer);
        $mainContainer.appendChild($reviewContainer);
        
        // Append main container and loader to view
        this.$view.appendChild($mainContainer);
        
        // Storing references to dynamically created elements for future use
        this.$mainContainer = $mainContainer;
        this.$answerContainer = $answerContainer;
        this.$answerTitleWrapper = $answerTitleWrapper;
        this.$answerIcon = $answerIcon;
        this.$answerTitle = $answerTitle;
        this.$answerContent = $answerContent;
        this.$reviewContainer = $reviewContainer;
        this.$reviewTitleWrapper = $reviewTitleWrapper;
        this.$reviewIcon = $reviewIcon;
        this.$reviewTitle = $reviewTitle;
        this.$reviewContent = $reviewContent;
    }

    _setEventHandlers() {

    }

    _addLoader() {
        // answer loader
        const answerLoader = new GradientViewLoader({
            id: 'SampleAnswerViewAnswerGradientLoader',
            numIndicator: 2,
            individualHeight: 1,
            animationDelay: 15,
        });
        this.answerLoader = answerLoader;
        this.$answerContainer.appendChild(answerLoader.$view);
        this.$answerLoader = answerLoader.$view;

        // review loader
        const reviewLoader = new GradientViewLoader({
            id: 'SampleReviewViewReviewGradientLoader',
            numIndicator: 2,
            individualHeight: 1,
            animationDelay: 15,
        });
        this.reviewLoader = reviewLoader;
        this.$reviewContainer.appendChild(reviewLoader.$view);
        this.$reviewLoader = reviewLoader.$view;
    }

    /**
     * Displays the given answer string in the this.$answerContent element.
     * 
     * - The answer variable should be a string.
     * - The answer text is added to this.$answerContent one character at a time.
     * - Each character is displayed every 30 ms.
     * - The latest character to be displayed is wrapped with <span class="fadein"></span>.
     * 
     * For example, if the answer variable is "ABC DEF", then after 180ms, the content will look like:
     * 
     *       <p class="answerContent">
     *              ABC D<span class="fadein">E</span>
     *          </p>
     * 
     * @param {string} answer - The answer string to display.
     */
    _displayText($contentElement, text, delay) {
        const fadeinClass = this.fadeInClassName;
        const visibleClass = this.visibleClassName;
        const invisibleClass = this.invisibleClassName;

        // Initialize $contentElement with all characters wrapped in <span class="invisible"></span>
        let initialText = text.split('').map(char => `<span class="${invisibleClass}">${char}</span>`).join('');
        $contentElement.innerHTML = initialText;

        const typeText = (index, elements) => {
            if (index < elements.length) {
                // Change the class name of the span at the current index
                elements[index].className = fadeinClass;

                // Change the class name of the previous span element if it exists
                if (index > 0) {
                    elements[index - 1].className = visibleClass;
                }

                setTimeout(() => {
                    typeText(index + 1, elements);
                }, delay);
            } else if (elements.length > 0) {
                // Change the class name of the last span element to 'visible'
                elements[elements.length - 1].className = visibleClass;
            }
        };

        const elements = Array.from($contentElement.querySelectorAll(`span.${invisibleClass}`));
        typeText(0, elements); // Start typing from the first character
    }

}