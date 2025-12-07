/**
 * MultiSelectPhase Component
 * Handles multi-select questions with checkboxes (multiple correct answers)
 */

import { api as defaultApi } from '../core/api.js';
import { MediaEmbed } from '../components/MediaEmbed.js';
import { showSuccess, showError } from '../components/MessageSystem.js';

export class MultiSelectPhase {
    constructor(options = {}) {
        this.options = {
            containerId: 'options-container',
            onSubmit: null,
            getPlayerId: null,
            ...options
        };

        // Use provided API or fallback to default singleton
        this.api = this.options.api || defaultApi;

        this.container = null;
        this.selectedIndices = [];
        this.submitted = false;
        this.currentQuestion = null;
    }

    /**
     * Initialize the phase
     */
    init() {
        this.container = document.getElementById(this.options.containerId);
    }

    /**
     * Render multi-select question
     */
    render(question, questionIndex) {
        // Initialize container if needed
        if (!this.container) {
            this.container = document.getElementById(this.options.containerId);
        }
        if (!this.container) return;

        this.currentQuestion = question;
        this.selectedIndices = [];
        this.submitted = false;

        this.container.innerHTML = '';
        this.container.className = 'options-container multi-select-phase';

        // Render media if present
        if (MediaEmbed.hasMedia(question.media)) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'question-media';
            MediaEmbed.render(question.media, mediaContainer);
            this.container.appendChild(mediaContainer);
        }

        // Instruction
        const instruction = document.createElement('p');
        instruction.className = 'multi-select-instruction';
        instruction.textContent = 'Select all correct answers:';
        this.container.appendChild(instruction);

        // Options as checkboxes
        const optionsWrapper = document.createElement('div');
        optionsWrapper.className = 'multi-select-options';

        question.options.forEach((option, index) => {
            const label = document.createElement('label');
            label.className = 'multi-select-option';
            label.setAttribute('data-index', index);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'multi-answer';
            checkbox.value = index;
            checkbox.id = 'option-' + index;
            checkbox.addEventListener('change', (e) => this.handleSelection(index, e.target.checked));

            const text = document.createElement('span');
            text.className = 'option-text';
            text.textContent = option;

            label.appendChild(checkbox);
            label.appendChild(text);
            optionsWrapper.appendChild(label);
        });

        this.container.appendChild(optionsWrapper);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-primary submit-multi-btn';
        submitBtn.textContent = 'Submit Answers';
        submitBtn.disabled = true;
        submitBtn.addEventListener('click', () => this.submit());
        this.submitBtn = submitBtn;
        this.container.appendChild(submitBtn);
    }

    /**
     * Handle checkbox selection
     */
    handleSelection(index, checked) {
        if (checked) {
            if (!this.selectedIndices.includes(index)) {
                this.selectedIndices.push(index);
            }
        } else {
            this.selectedIndices = this.selectedIndices.filter(i => i !== index);
        }

        // Enable submit button when at least one option selected
        if (this.submitBtn) {
            this.submitBtn.disabled = this.selectedIndices.length === 0;
        }
    }

    /**
     * Submit multi-select answer
     */
    async submit() {
        if (this.submitted || this.selectedIndices.length === 0) return;

        this.submitted = true;
        if (this.submitBtn) {
            this.submitBtn.disabled = true;
            this.submitBtn.textContent = 'Submitting...';
        }

        // Get player ID
        let playerId = null;
        if (this.options.getPlayerId) {
            playerId = this.options.getPlayerId();
        }
        if (!playerId) {
            playerId = localStorage.getItem('quizPlayerId');
        }

        try {
            const result = await this.api.post('submitMultiAnswer', {
                playerId: playerId,
                answers: this.selectedIndices
            });

            if (result.success) {
                this.showFeedback(result);
                if (this.options.onSubmit) {
                    this.options.onSubmit(result);
                }
            } else {
                showError(result.error || 'Failed to submit answer');
                this.submitted = false;
                if (this.submitBtn) {
                    this.submitBtn.disabled = false;
                    this.submitBtn.textContent = 'Submit Answers';
                }
            }
        } catch (error) {
            console.error('Multi-select submit error:', error);
            showError('Network error');
            this.submitted = false;
            if (this.submitBtn) {
                this.submitBtn.disabled = false;
                this.submitBtn.textContent = 'Submit Answers';
            }
        }
    }

    /**
     * Show feedback after submission
     */
    showFeedback(result) {
        // Mark correct/incorrect selections
        const options = this.container.querySelectorAll('.multi-select-option');
        const correctAnswers = this.currentQuestion.correctAnswers || [];

        options.forEach((option, index) => {
            option.classList.add('revealed');

            const isCorrect = correctAnswers.includes(index);
            const wasSelected = this.selectedIndices.includes(index);

            if (isCorrect && wasSelected) {
                option.classList.add('correct-selected');
            } else if (isCorrect && !wasSelected) {
                option.classList.add('correct-missed');
            } else if (!isCorrect && wasSelected) {
                option.classList.add('incorrect-selected');
            }

            // Disable checkbox
            const checkbox = option.querySelector('input');
            if (checkbox) checkbox.disabled = true;
        });

        // Show score
        const scoreEl = document.createElement('div');
        const scoreClass = result.isCorrect ? 'perfect' : 'partial';
        scoreEl.className = 'multi-select-score ' + scoreClass;

        if (result.isCorrect) {
            scoreEl.innerHTML = '✓ All correct!';
        } else {
            scoreEl.innerHTML = result.correctSelected + '/' + result.totalCorrect + ' correct answers selected';
        }

        if (this.submitBtn) {
            this.submitBtn.replaceWith(scoreEl);
        }
    }

    /**
     * Reset the phase
     */
    reset() {
        this.selectedIndices = [];
        this.submitted = false;
        this.currentQuestion = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default MultiSelectPhase;
