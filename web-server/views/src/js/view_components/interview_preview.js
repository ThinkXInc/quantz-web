class InterviewPreviewView {
    constructor({ id, interview, locale, lang }) {
        this.id = id;
        this.interview = interview;
        this.locale = locale;
        this.lang = lang;
        this.createView();
    }

    createView() {
        // Create the main view container
        this.$view = document.createElement('div');
        this.$view.id = this.id;
        this.$view.classList.add('InterviewPreviewView');

        // **Edit Button**
        const $editButton = document.createElement('button');
        $editButton.classList.add('editButton');

        // Insert SVG icon into the button
        $editButton.innerHTML = `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="24px" height="24px">
            <style type="text/css">
                .st2{fill:none;stroke:currentColor;stroke-width:5;stroke-miterlimit:10;}
                .st3{fill:none;stroke:currentColor;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}
            </style>
            <path class="st2" d="M52.3,7l-3.9-3.9c0,0-0.6-0.9-1.5,0c-0.9,0.9-40,40-40,40s-0.5,0.3-0.5,1
                c-0.2,0.6-3.1,11.4-3.1,11.4s-0.2,0.5,0,0.7c0.2,0.2,0.8,0,0.8,0l11.9-3.8
                c0,0,0.4-0.1,0.9-0.5s39.7-39.7,39.7-39.7s0.4-0.5,0.1-0.7C56.6,11.2,52.4,7,52.3,7z"/>
            <line class="st3" x1="4.2" y1="56.4" x2="28.5" y2="56.4"/>
            <line class="st3" x1="34.8" y1="56.4" x2="47.7" y2="56.4"/>
        </svg>
        `;

        // Event listener for the Edit button
        $editButton.addEventListener('click', () => {
            // Dispatch a custom event to be handled by InterviewHomeViewController
            const event = new CustomEvent('editInterview', { detail: { interviewId: this.interview.id } });
            this.$view.dispatchEvent(event);
        });

        // Append the Edit button to the view
        this.$view.appendChild($editButton);

        // **InterviewSummaryView**
        const $interviewSummaryView = document.createElement('div');
        $interviewSummaryView.classList.add('InterviewSummaryView');

        // **Interview Title**
        const $title = document.createElement('h2');
        $title.textContent = this.interview.title;
        $interviewSummaryView.appendChild($title);

        // **Introduction Container**
        const $introductionContainer = document.createElement('div');
        $introductionContainer.classList.add('introductionContainer');

        // **Introduction Label**
        const $introductionLabel = document.createElement('span');
        $introductionLabel.classList.add('introductionLabel');
        $introductionLabel.textContent = this.locale.get('interview_summary_introduction_label', this.lang) || 'Introduction:';
        $introductionContainer.appendChild($introductionLabel);

        // **Introduction Text**
        const $introduction = document.createElement('p');
        $introduction.classList.add('introduction');
        $introduction.textContent = this.interview.introduction;
        $introductionContainer.appendChild($introduction);

        // Append introductionContainer to $interviewSummaryView
        $interviewSummaryView.appendChild($introductionContainer);

        // **Steps**
        this.interview.steps.forEach((step, index) => {
            // **Arrow Between Steps**
            if (index > 0) {
                const $arrowContainer = document.createElement('div');
                $arrowContainer.classList.add('stepArrowContainer');

                const $arrow = document.createElement('img');
                $arrow.src = '/img/interviews/step-arrow.svg';
                $arrow.classList.add('stepArrow');
                $arrowContainer.appendChild($arrow);

                $interviewSummaryView.appendChild($arrowContainer);
            }

            // **Step Container**
            const $stepContainer = document.createElement('div');
            $stepContainer.classList.add('stepContainer');

            // **Step Title**
            const $stepTitle = document.createElement('h3');
            $stepTitle.classList.add('stepTitle');
            const stepLabelTemplate = this.locale.get('interview_summary_steps_label', this.lang) || 'Step $0';
            $stepTitle.textContent = stepLabelTemplate.replace('$0', index + 1);
            $stepContainer.appendChild($stepTitle);

            // **Step Content Container**
            const $stepContent = document.createElement('div');
            $stepContent.classList.add('stepContent');

            // **Question Wrapper**
            const $questionWrapper = document.createElement('div');
            $questionWrapper.classList.add('questionWrapper');

            // **Question Label and Text**
            const $questionLabel = document.createElement('span');
            $questionLabel.classList.add('questionLabel');
            $questionLabel.textContent = this.locale.get('interview_summary_step_question_label', this.lang) || 'Question:';
            $questionWrapper.appendChild($questionLabel);

            const $question = document.createElement('p');
            $question.classList.add('question');
            $question.textContent = step.question;
            $questionWrapper.appendChild($question);

            // Append questionWrapper to stepContent
            $stepContent.appendChild($questionWrapper);

            // **Instructions Wrapper**
            const $instructionsWrapper = document.createElement('div');
            $instructionsWrapper.classList.add('instructionsWrapper');

            // **Instructions Label**
            const $instructionsLabel = document.createElement('span');
            $instructionsLabel.classList.add('instructionsLabel');
            $instructionsLabel.textContent = this.locale.get('interview_summary_step_instructions_label', this.lang) || 'Instructions:';
            $instructionsWrapper.appendChild($instructionsLabel);

            // **Instructions List**
            const $instructionsList = document.createElement('ul');
            $instructionsList.classList.add('instructions');

            step.instructions.forEach((instruction, idx) => {
                const $li = document.createElement('li');
                $li.style.listStyle = 'none';

                // Create a span.index with the number
                const $indexSpan = document.createElement('span');
                $indexSpan.classList.add('index');
                $indexSpan.textContent = idx + 1;

                // Append the indexSpan and instruction text to the li
                $li.appendChild($indexSpan);
                $li.append(' ' + instruction);

                $instructionsList.appendChild($li);
            });

            $instructionsWrapper.appendChild($instructionsList);

            // **More Detail**
            const $moreDetail = document.createElement('span');
            $moreDetail.classList.add('moreDetail');

            const $arrowIcon = document.createElement('img');
            $arrowIcon.src = '/img/interviews/down-arrow.svg';
            $arrowIcon.classList.add('moreDetailArrow');

            const $moreDetailLabel = document.createElement('p');
            $moreDetailLabel.classList.add('moreDetailLabel');
            $moreDetailLabel.textContent = this.locale.get('interview_summary_step_more_detail_label', this.lang) || 'More detail';
            $moreDetailLabel.style.color = '#eee'; // light gray

            $moreDetail.appendChild($arrowIcon);
            $moreDetail.appendChild($moreDetailLabel);

            // Append $moreDetailLabel to $instructionsWrapper
            $instructionsWrapper.appendChild($moreDetail);

            // **Hidden Content**
            const $hiddenContent = document.createElement('div');
            $hiddenContent.classList.add('hiddenContent');
            // Hide by default using CSS classes

            // **Finish Condition Wrapper**
            const $finishConditionWrapper = document.createElement('div');
            $finishConditionWrapper.classList.add('finishConditionWrapper');

            // **Finish Condition Label and Text**
            const $finishConditionLabel = document.createElement('span');
            $finishConditionLabel.classList.add('finishConditionLabel');
            $finishConditionLabel.textContent = this.locale.get('interview_summary_step_finish_condition_label', this.lang) || 'Finish Condition:';
            $finishConditionWrapper.appendChild($finishConditionLabel);

            const $finishCondition = document.createElement('p');
            $finishCondition.classList.add('finishCondition');
            $finishCondition.textContent = step.finish_condition;
            $finishConditionWrapper.appendChild($finishCondition);

            // **Max Turns Wrapper**
            const $maxTurnsWrapper = document.createElement('div');
            $maxTurnsWrapper.classList.add('maxTurnsWrapper');

            // **Max Turns Label and Value**
            const $maxTurnsLabel = document.createElement('span');
            $maxTurnsLabel.classList.add('maxTurnsLabel');
            $maxTurnsLabel.textContent = this.locale.get('interview_summary_step_max_turns_label', this.lang) || 'Max Turns:';
            $maxTurnsWrapper.appendChild($maxTurnsLabel);

            const $maxTurns = document.createElement('span');
            $maxTurns.classList.add('maxTurns');
            $maxTurns.textContent = step.max_turns;
            $maxTurnsWrapper.appendChild($maxTurns);

            // Append finishConditionWrapper and maxTurnsWrapper to hiddenContent
            $hiddenContent.appendChild($finishConditionWrapper);
            $hiddenContent.appendChild($maxTurnsWrapper);

            // Append hiddenContent to instructionsWrapper
            $instructionsWrapper.appendChild($hiddenContent);

            // **More Detail Label Event Listener**
            $moreDetail.addEventListener('click', () => {
                $hiddenContent.classList.toggle('expanded');
                $moreDetail.classList.toggle('rotated');
            });

            // Append instructionsWrapper to stepContent
            $stepContent.appendChild($instructionsWrapper);

            // Append the step content to the step container
            $stepContainer.appendChild($stepTitle);
            $stepContainer.appendChild($stepContent);

            // Append the step container to the summary view
            $interviewSummaryView.appendChild($stepContainer);
        });

        // **End Container**
        if (this.interview.end) {
            const $endContainer = document.createElement('div');
            $endContainer.classList.add('endContainer');

            // **End Label**
            const $endLabel = document.createElement('span');
            $endLabel.classList.add('endLabel');
            $endLabel.textContent = this.locale.get('interview_summary_end_label', this.lang) || 'Closing Remarks:';
            $endContainer.appendChild($endLabel);

            // **End Text**
            const $endText = document.createElement('p');
            $endText.classList.add('endText');
            $endText.textContent = this.interview.end;
            $endContainer.appendChild($endText);

            // Append endContainer to $interviewSummaryView
            $interviewSummaryView.appendChild($endContainer);
        }

        // Append the summary view to the main view
        this.$view.appendChild($interviewSummaryView);

        // **InterviewLatestResultsView Placeholder**
        const $interviewLatestResultsView = document.createElement('div');
        $interviewLatestResultsView.classList.add('InterviewLatestResultsView');
        $interviewLatestResultsView.textContent = 'Interview Latest Results View';

        // Append the latest results view to the main view
        this.$view.appendChild($interviewLatestResultsView);
    }

    mount($parent) {
        // Clear previous content
        $parent.innerHTML = '';
        $parent.appendChild(this.$view);
    }

    updateInterview(interview) {
        this.interview = interview;
        // Recreate the view with updated interview data
        this.$view.innerHTML = '';
        this.createView();
    }
}
