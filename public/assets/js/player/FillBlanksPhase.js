/**
 * FillBlanksPhase Component
 * Handles fill-in-the-blanks questions with inline text inputs
 */

import { api as defaultApi } from '../core/api.js';
import { MediaEmbed } from '../components/MediaEmbed.js';
import { showSuccess, showError } from '../components/MessageSystem.js';

export class FillBlanksPhase {
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
        this.answers = {};
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
     * Render fill-in-blanks question
     */
    render(question, questionIndex) {
        if (!this.container) return;

        this.currentQuestion = question;
        this.answers = {};
        this.submitted = false;

        this.container.innerHTML = '';
        this.container.className = 'options-container fill-blanks-phase';

        // Render media if present
        if (MediaEmbed.hasMedia(question.media)) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'question-media';
            MediaEmbed.render(question.media, mediaContainer);
            this.container.appendChild(mediaContainer);
        }

        // Parse and render content with blanks
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'fill-blanks-content';
        contentWrapper.innerHTML = this.parseContent(question.question, question.blanksConfig || []);
        this.container.appendChild(contentWrapper);

        // Bind input events
        this.bindInputEvents(contentWrapper);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-primary submit-blanks-btn';
        submitBtn.textContent = 'Submit Answers';
        submitBtn.addEventListener('click', () => this.submit());
        this.submitBtn = submitBtn;
        this.container.appendChild(submitBtn);
    }

    /**
     * Parse content and replace {{blank}} with input fields
     */
    parseContent(content, blanksConfig) {
        let html = this.escapeHtml(content);
        let blankIndex = 0;

        // Replace {{word}} patterns with input fields
        html = html.replace(/\{\{([^}]+)\}\}/g, (match, blankText) => {
            const blank = blanksConfig[blankIndex] || { id: blankIndex };
            const inputHtml = `<input type="text" 
                class="blank-input" 
                data-blank-id="${blank.id ?? blankIndex}"
                placeholder="..."
                autocomplete="off"
                spellcheck="false">`;
            blankIndex++;
            return inputHtml;
        });

        return html;
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Bind input events for tracking answers
     */
    bindInputEvents(container) {
        const inputs = container.querySelectorAll('.blank-input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const blankId = parseInt(e.target.dataset.blankId, 10);
                this.answers[blankId] = e.target.value.trim();
            });

            // Submit on Enter in last input
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const allInputs = Array.from(container.querySelectorAll('.blank-input'));
                    const currentIndex = allInputs.indexOf(e.target);
                    if (currentIndex < allInputs.length - 1) {
                        allInputs[currentIndex + 1].focus();
                    } else {
                        this.submit();
                    }
                }
            });
        });

        // Focus first input
        if (inputs.length > 0) {
            setTimeout(() => inputs[0].focus(), 100);
        }
    }

    /**
     * Submit fill-in-blanks answer
     */
    async submit() {
        if (this.submitted) return;

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
            const result = await this.api.post('submitBlanksAnswer', {
                playerId: playerId,
                answers: this.answers
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
            console.error('Fill-blanks submit error:', error);
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
        const results = result.results || [];

        // Mark each input as correct or incorrect
        const inputs = this.container.querySelectorAll('.blank-input');
        inputs.forEach(input => {
            const blankId = parseInt(input.dataset.blankId, 10);
            const blankResult = results.find(r => r.blankId === blankId);

            input.disabled = true;

            if (blankResult) {
                if (blankResult.isCorrect) {
                    input.classList.add('correct');
                } else {
                    input.classList.add('incorrect');
                    // Show correct answer as hint
                    const hint = document.createElement('span');
                    hint.className = 'correct-hint';
                    hint.textContent = ` → ${blankResult.correctAnswer}`;
                    input.parentNode.insertBefore(hint, input.nextSibling);
                }
            }
        });

        // Show score
        const scoreEl = document.createElement('div');
        scoreEl.className = `fill-blanks-score ${result.isCorrect ? 'perfect' : 'partial'}`;
        scoreEl.innerHTML = result.isCorrect
            ? '✓ All correct!'
            : `${result.correctCount}/${result.totalBlanks} blanks correct (${Math.round(result.score * 100)}%)`;

        if (this.submitBtn) {
            this.submitBtn.replaceWith(scoreEl);
        }
    }

    /**
     * Reset the phase
     */
    reset() {
        this.answers = {};
        this.submitted = false;
        this.currentQuestion = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default FillBlanksPhase;
