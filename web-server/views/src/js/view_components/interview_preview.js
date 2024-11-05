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
        $editButton.textContent = this.locale.get('interview_preview_edit_button_label', this.lang) || 'Edit';

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

        // **Introduction Label**
        const $introductionLabel = document.createElement('span');
        $introductionLabel.classList.add('introductionLabel');
        $introductionLabel.textContent = this.locale.get('interview_summary_introduction_label', this.lang) || 'Introduction:';
        $interviewSummaryView.appendChild($introductionLabel);

        // **Introduction Text**
        const $introduction = document.createElement('p');
        $introduction.classList.add('introduction');
        $introduction.textContent = this.interview.introduction;
        $interviewSummaryView.appendChild($introduction);

        // **Steps**
        this.interview.steps.forEach((step, index) => {
            // **Arrow Between Steps**
            if (index > 0) {
                const $arrow = document.createElement('img');
                $arrow.src = '/img/interview/step-arrow.svg';
                $arrow.classList.add('stepArrow');
                $interviewSummaryView.appendChild($arrow);
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

            // **More Detail Link**
            const $moreDetailLink = document.createElement('span');
            $moreDetailLink.classList.add('moreDetailLink');
            $moreDetailLink.textContent = this.locale.get('interview_summary_step_more_detail_label', this.lang) || 'More detail';
            $moreDetailLink.style.color = 'blue';
            $moreDetailLink.style.cursor = 'pointer';
            $stepContent.appendChild($moreDetailLink);

            // **Hidden Content Wrapper**
            const $hiddenContent = document.createElement('div');
            $hiddenContent.classList.add('hiddenContent');
            $hiddenContent.style.display = 'none'; // Hide by default

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

            // Append hiddenContent to stepContent
            $stepContent.appendChild($hiddenContent);

            // **Instructions Label and List**
            const $instructionsLabel = document.createElement('span');
            $instructionsLabel.classList.add('instructionsLabel');
            $instructionsLabel.textContent = this.locale.get('interview_summary_step_instructions_label', this.lang) || 'Instructions:';
            $stepContent.appendChild($instructionsLabel);

            const $instructionsList = document.createElement('ul');
            $instructionsList.classList.add('instructions');

            step.instructions.forEach(instruction => {
                const $li = document.createElement('li');
                $li.textContent = instruction;
                $instructionsList.appendChild($li);
            });

            $stepContent.appendChild($instructionsList);

            // **More Detail Link Event Listener**
            $moreDetailLink.addEventListener('click', () => {
                if ($hiddenContent.style.display === 'none') {
                    $hiddenContent.style.display = 'block';
                } else {
                    $hiddenContent.style.display = 'none';
                }
            });

            // Append the step content to the step container
            $stepContainer.appendChild($stepContent);

            // Append the step container to the summary view
            $interviewSummaryView.appendChild($stepContainer);
        });

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
