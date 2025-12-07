/**
 * AssignmentManager - Manages assignment creation and viewing
 * Allows teachers to create shareable URLs for unsupervised quizzes
 */

import { escapeHtml, formatTime } from '../core/utils.js';

export class AssignmentManager {
    constructor({ api, messages, feedback }) {
        this.api = api;
        this.messages = messages;
        this.feedback = feedback;
        
        this.assignments = [];
        this.currentSort = { field: 'createdAt', direction: 'desc' };
    }

    /**
     * Initialize the module
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Create assignment button
        const createBtn = document.getElementById('createAssignmentBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Modal form submission
        const form = document.getElementById('assignmentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAssignment();
            });
        }

        // Cancel button in create modal
        const cancelBtn = document.getElementById('cancelAssignment');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreateModal());
        }

        // Close modal on X click
        const closeBtn = document.querySelector('#assignmentModal .modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideCreateModal());
        }

        // Close detail modal
        const detailCloseBtn = document.querySelector('#assignmentDetailModal .modal-close');
        if (detailCloseBtn) {
            detailCloseBtn.addEventListener('click', () => this.hideDetailModal());
        }
        
        const detailDoneBtn = document.getElementById('assignmentDetailDone');
        if (detailDoneBtn) {
            detailDoneBtn.addEventListener('click', () => this.hideDetailModal());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshAssignmentsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAssignments());
        }
    }

    /**
     * Load assignments from server
     */
    async loadAssignments() {
        try {
            const result = await this.api.request('getAssignments', {});
            
            if (result.success) {
                // Map snake_case to camelCase
                this.assignments = (result.assignments || []).map(a => ({
                    id: a.id,
                    code: a.code,
                    title: a.title,
                    deliveryMode: a.delivery_mode || a.deliveryMode,
                    createdAt: a.created_at || a.createdAt,
                    expiresAt: a.expires_at || a.expiresAt,
                    hasPassword: a.has_password === '1' || a.has_password === 1 || a.hasPassword,
                    submissionCount: a.submission_count || a.submissionCount || 0
                }));
                this.renderAssignmentsList();
            } else {
                this.messages.error(result.error || 'Failed to load assignments');
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            this.messages.error('Failed to load assignments');
        }
    }

    /**
     * Render the assignments list
     */
    renderAssignmentsList() {
        const container = document.getElementById('assignmentsList');
        if (!container) return;

        if (this.assignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No assignments yet</p>
                    <p class="hint">Create an assignment to share a self-paced quiz with students</p>
                </div>
            `;
            return;
        }

        // Sort assignments
        const sorted = [...this.assignments].sort((a, b) => {
            const aVal = a[this.currentSort.field];
            const bVal = b[this.currentSort.field];
            const dir = this.currentSort.direction === 'asc' ? 1 : -1;
            
            if (typeof aVal === 'string') {
                return aVal.localeCompare(bVal) * dir;
            }
            return (aVal - bVal) * dir;
        });

        container.innerHTML = `
            <table class="assignments-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Code</th>
                        <th>Password</th>
                        <th>Submissions</th>
                        <th>Created</th>
                        <th>Expires</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => this.renderAssignmentRow(a)).join('')}
                </tbody>
            </table>
        `;

        // Attach event listeners to action buttons
        this.attachRowEventListeners();
    }

    /**
     * Render a single assignment row
     */
    renderAssignmentRow(assignment) {
        const baseUrl = window.location.origin + window.location.pathname.replace('admin-modular.php', 'assignment-modular.php');
        const assignmentUrl = `${baseUrl}?code=${assignment.code}`;
        const isExpired = assignment.expiresAt && new Date(assignment.expiresAt) < new Date();
        const statusClass = isExpired ? 'status-expired' : 'status-active';
        const statusText = isExpired ? 'Expired' : 'Active';

        return `
            <tr class="${isExpired ? 'expired' : ''}" data-id="${escapeHtml(assignment.id)}">
                <td>
                    <strong>${escapeHtml(assignment.title)}</strong>
                    <span class="assignment-status ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <code class="assignment-code">${escapeHtml(assignment.code)}</code>
                </td>
                <td>
                    ${assignment.hasPassword ? 
                        '<span class="badge badge-info"><i class="fas fa-lock"></i> Yes</span>' : 
                        '<span class="badge badge-secondary"><i class="fas fa-lock-open"></i> No</span>'}
                </td>
                <td class="submissions-count">
                    ${assignment.submissionCount || 0}
                </td>
                <td>${this.formatDate(assignment.createdAt)}</td>
                <td>${assignment.expiresAt ? this.formatDate(assignment.expiresAt) : '<span class="text-muted">Never</span>'}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-primary copy-url-btn" data-url="${escapeHtml(assignmentUrl)}" title="Copy URL">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-info view-results-btn" data-id="${escapeHtml(assignment.id)}" title="View Results">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${escapeHtml(assignment.id)}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Attach event listeners to row action buttons
     */
    attachRowEventListeners() {
        // Copy URL buttons
        document.querySelectorAll('.copy-url-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                await this.copyToClipboard(url);
            });
        });

        // View results buttons
        document.querySelectorAll('.view-results-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.viewResults(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.deleteAssignment(id);
            });
        });
    }

    /**
     * Copy URL to clipboard
     */
    async copyToClipboard(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.messages.success('URL copied to clipboard!');
            this.feedback.show('Copied!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.messages.success('URL copied to clipboard!');
        }
    }

    /**
     * Show create assignment modal
     */
    showCreateModal() {
        const modal = document.getElementById('assignmentModal');
        if (modal) {
            // Reset form
            const form = document.getElementById('assignmentForm');
            if (form) form.reset();
            
            // Set default expiration to 7 days from now
            const expiresInput = document.getElementById('assignmentExpires');
            if (expiresInput) {
                const defaultExpiry = new Date();
                defaultExpiry.setDate(defaultExpiry.getDate() + 7);
                expiresInput.value = defaultExpiry.toISOString().slice(0, 16);
            }
            
            modal.classList.remove('hidden');
        }
    }

    /**
     * Hide create assignment modal
     */
    hideCreateModal() {
        const modal = document.getElementById('assignmentModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Create a new assignment
     */
    async createAssignment() {
        const titleInput = document.getElementById('assignmentTitle');
        const passwordInput = document.getElementById('assignmentPassword');
        const expiresInput = document.getElementById('assignmentExpires');

        const title = titleInput?.value?.trim();
        const password = passwordInput?.value?.trim() || null;
        const expiresAt = expiresInput?.value ? new Date(expiresInput.value).toISOString() : null;

        if (!title) {
            this.messages.error('Please enter a title');
            return;
        }

        try {
            const result = await this.api.request('createAssignment', {
                title,
                password,
                expiresAt,
                deliveryMode: 'self_paced'
            });

            if (result.success) {
                this.hideCreateModal();
                this.messages.success('Assignment created successfully!');
                this.feedback.show('Created!', 'success');
                
                // Show the detail modal with copy URL
                this.showDetailModal(result);
                
                // Reload assignments list
                await this.loadAssignments();
            } else {
                this.messages.error(result.error || 'Failed to create assignment');
            }
        } catch (error) {
            console.error('Error creating assignment:', error);
            this.messages.error('Failed to create assignment');
        }
    }

    /**
     * Show assignment detail modal (after creation)
     */
    showDetailModal(assignment) {
        const modal = document.getElementById('assignmentDetailModal');
        if (!modal) return;

        const baseUrl = window.location.origin + window.location.pathname.replace('admin-modular.php', 'assignment-modular.php');
        const assignmentUrl = `${baseUrl}?code=${assignment.code}`;

        const content = modal.querySelector('.modal-body');
        if (content) {
            content.innerHTML = `
                <div class="assignment-detail">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>Assignment Created!</h3>
                    
                    <div class="detail-section">
                        <label>Title:</label>
                        <p><strong>${escapeHtml(assignment.title)}</strong></p>
                    </div>
                    
                    <div class="detail-section">
                        <label>Access Code:</label>
                        <p class="code-display">${escapeHtml(assignment.code)}</p>
                    </div>
                    
                    <div class="detail-section">
                        <label>Share this URL with students:</label>
                        <div class="url-box">
                            <input type="text" value="${escapeHtml(assignmentUrl)}" readonly id="assignmentUrlInput">
                            <button class="btn btn-primary" id="copyUrlBtn">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                    
                    ${assignment.hasPassword ? `
                        <div class="detail-section">
                            <label>Password Protected:</label>
                            <p><i class="fas fa-lock"></i> Yes - students will need the password to access</p>
                        </div>
                    ` : ''}
                </div>
            `;

            // Attach copy button handler
            const copyBtn = document.getElementById('copyUrlBtn');
            const urlInput = document.getElementById('assignmentUrlInput');
            if (copyBtn && urlInput) {
                copyBtn.addEventListener('click', async () => {
                    await this.copyToClipboard(urlInput.value);
                });
            }
        }

        modal.classList.remove('hidden');
    }

    /**
     * Hide assignment detail modal
     */
    hideDetailModal() {
        const modal = document.getElementById('assignmentDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * View results for an assignment
     */
    async viewResults(assignmentId) {
        try {
            const result = await this.api.request('getAssignmentResults', { assignmentId });
            
            if (result.success) {
                this.showResultsModal(result);
            } else {
                this.messages.error(result.error || 'Failed to load results');
            }
        } catch (error) {
            console.error('Error loading results:', error);
            this.messages.error('Failed to load results');
        }
    }

    /**
     * Show results modal
     */
    showResultsModal(data) {
        const modal = document.getElementById('assignmentDetailModal');
        if (!modal) return;

        const submissions = data.submissions || [];
        
        const content = modal.querySelector('.modal-body');
        if (content) {
            if (submissions.length === 0) {
                content.innerHTML = `
                    <div class="results-empty">
                        <i class="fas fa-inbox"></i>
                        <h3>No Submissions Yet</h3>
                        <p>Share the assignment URL with your students to collect responses.</p>
                    </div>
                `;
            } else {
                // Calculate stats
                const avgScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length;
                
                content.innerHTML = `
                    <div class="results-summary">
                        <h3><i class="fas fa-chart-bar"></i> Assignment Results</h3>
                        
                        <div class="stats-row">
                            <div class="stat-box">
                                <span class="stat-value">${submissions.length}</span>
                                <span class="stat-label">Submissions</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-value">${avgScore.toFixed(1)}%</span>
                                <span class="stat-label">Average Score</span>
                            </div>
                        </div>
                        
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Score</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${submissions.map(s => `
                                    <tr>
                                        <td>${escapeHtml(s.nickname)}</td>
                                        <td>
                                            <span class="score-badge ${s.score >= 70 ? 'score-good' : s.score >= 50 ? 'score-ok' : 'score-low'}">
                                                ${s.score || 0}%
                                            </span>
                                        </td>
                                        <td>${this.formatDate(s.completedAt)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

        modal.classList.remove('hidden');
    }

    /**
     * Delete an assignment
     */
    async deleteAssignment(assignmentId) {
        if (!confirm('Are you sure you want to delete this assignment? This will also delete all submissions.')) {
            return;
        }

        try {
            const result = await this.api.request('deleteAssignment', { assignmentId });
            
            if (result.success) {
                this.messages.success('Assignment deleted');
                this.feedback.show('Deleted', 'success');
                await this.loadAssignments();
            } else {
                this.messages.error(result.error || 'Failed to delete assignment');
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            this.messages.error('Failed to delete assignment');
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
