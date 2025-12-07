/**
 * OpenEndedPhase Component
 * Handles open-ended questions with textarea and optional hints
 */

import { api as defaultApi } from '../core/api.js';
import { MediaEmbed } from '../components/MediaEmbed.js';
import { showSuccess, showError } from '../components/MessageSystem.js';

export class OpenEndedPhase {
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
        this.submitted = false;
        this.currentQuestion = null;
        this.textarea = null;
    }

    /**
     * Initialize the phase
     */
    init() {
        this.container = document.getElementById(this.options.containerId);
    }

    /**
     * Render open-ended question
     */
    render(question, questionIndex) {
        if (!this.container) return;

        this.currentQuestion = question;
        this.submitted = false;

        this.container.innerHTML = '';
        this.container.className = 'options-container open-ended-phase';

        const config = question.openConfig || {};
        const maxLength = config.maxLength || 1000;
        const hints = config.hints || [];
        const gradingMode = config.gradingMode || 'none';

        // Render media if present
        if (MediaEmbed.hasMedia(question.media)) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'question-media';
            MediaEmbed.render(question.media, mediaContainer);
            this.container.appendChild(mediaContainer);
        }

        // Show hints if available
        if (hints.length > 0 && gradingMode === 'hints') {
            const hintsContainer = document.createElement('div');
            hintsContainer.className = 'open-ended-hints';
            hintsContainer.innerHTML = '<strong>💡 Hints:</strong> ' + hints.join(' • ');
            this.container.appendChild(hintsContainer);
        }

        // Textarea for answer
        const textareaWrapper = document.createElement('div');
        textareaWrapper.className = 'textarea-wrapper';

        this.textarea = document.createElement('textarea');
        this.textarea.className = 'open-ended-textarea';
        this.textarea.placeholder = 'Type your answer here...';
        this.textarea.maxLength = maxLength;
        this.textarea.rows = 5;
        this.textarea.addEventListener('input', () => this.updateCharCount());

        textareaWrapper.appendChild(this.textarea);

        // Character counter
        const charCount = document.createElement('div');
        charCount.className = 'char-count';
        charCount.id = 'char-count';
        charCount.textContent = `0 / ${maxLength}`;
        textareaWrapper.appendChild(charCount);

        this.container.appendChild(textareaWrapper);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-primary submit-open-btn';
        submitBtn.textContent = 'Submit Answer';
        submitBtn.addEventListener('click', () => this.submit());
        this.submitBtn = submitBtn;
        this.container.appendChild(submitBtn);

        // Info about grading
        if (gradingMode === 'none') {
            const info = document.createElement('p');
            info.className = 'grading-info';
            info.textContent = 'Your answer will be reviewed by the teacher.';
            this.container.appendChild(info);
        }

        // Focus textarea
        setTimeout(() => this.textarea?.focus(), 100);
    }

    /**
     * Update character counter
     */
    updateCharCount() {
        const charCountEl = document.getElementById('char-count');
        if (charCountEl && this.textarea) {
            const config = this.currentQuestion?.openConfig || {};
            const maxLength = config.maxLength || 1000;
            const current = this.textarea.value.length;
            charCountEl.textContent = `${current} / ${maxLength}`;

            // Warn when approaching limit
            if (current > maxLength * 0.9) {
                charCountEl.classList.add('warning');
            } else {
                charCountEl.classList.remove('warning');
            }
        }
    }

    /**
     * Submit open-ended answer
     */
    async submit() {
        if (this.submitted) return;

        const answerText = this.textarea?.value?.trim() || '';
        if (!answerText) {
            showError('Please enter an answer');
            return;
        }

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
            const result = await this.api.post('submitOpenAnswer', {
                playerId: playerId,
                answerText: answerText
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
                    this.submitBtn.textContent = 'Submit Answer';
                }
            }
        } catch (error) {
            console.error('Open-ended submit error:', error);
            showError('Network error');
            this.submitted = false;
            if (this.submitBtn) {
                this.submitBtn.disabled = false;
                this.submitBtn.textContent = 'Submit Answer';
            }
        }
    }

    /**
     * Show feedback after submission
     */
    showFeedback(result) {
        // Disable textarea
        if (this.textarea) {
            this.textarea.disabled = true;
            this.textarea.classList.add('submitted');
        }

        // Show submission confirmation
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'open-ended-feedback';

        if (result.gradingMode === 'fixed' && result.autoScore !== null) {
            feedbackEl.className += result.autoScore > 0 ? ' correct' : ' incorrect';
            feedbackEl.innerHTML = result.autoScore > 0
                ? '✓ Correct!'
                : '✗ Incorrect';
        } else {
            feedbackEl.className += ' pending';
            feedbackEl.innerHTML = '✓ Answer submitted for review';
        }

        if (this.submitBtn) {
            this.submitBtn.replaceWith(feedbackEl);
        }
    }

    /**
     * Reset the phase
     */
    reset() {
        this.submitted = false;
        this.currentQuestion = null;
        this.textarea = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default OpenEndedPhase;
