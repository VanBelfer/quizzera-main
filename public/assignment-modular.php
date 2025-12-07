<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assignment</title>
    
    <!-- CSS Modules -->
    <link rel="stylesheet" href="assets/css/variables.css">
    <link rel="stylesheet" href="assets/css/base.css">
    <link rel="stylesheet" href="assets/css/buttons.css">
    <link rel="stylesheet" href="assets/css/forms.css">
    <link rel="stylesheet" href="assets/css/animations.css">
    
    <!-- Shared Components CSS -->
    <link rel="stylesheet" href="assets/css/components/help-panel.css">
    <link rel="stylesheet" href="assets/css/components/notifications.css">
    <link rel="stylesheet" href="assets/css/components/progress.css">
    <link rel="stylesheet" href="assets/css/components/cards.css">
    
    <!-- Player-specific CSS -->
    <link rel="stylesheet" href="assets/css/player/login.css">
    <link rel="stylesheet" href="assets/css/player/options.css">
    <link rel="stylesheet" href="assets/css/player/end-screen.css">
    <link rel="stylesheet" href="assets/css/player/question-types.css">
    
    <!-- External Dependencies -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        /* Assignment-specific styles */
        .assignment-header {
            text-align: center;
            margin-bottom: var(--spacing-lg);
        }
        
        .assignment-title {
            font-size: 1.5rem;
            color: var(--cyan-400);
            margin-bottom: 0.5rem;
        }
        
        .assignment-code {
            color: var(--text-secondary);
            font-family: monospace;
            font-size: 0.9rem;
        }
        
        .self-paced-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--spacing-md);
            margin-top: var(--spacing-lg);
            padding-top: var(--spacing-md);
            border-top: 1px solid var(--bg-gray-700);
        }
        
        .question-progress {
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .password-group {
            margin-top: var(--spacing-md);
        }
        
        .password-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
        }
        
        .options-container {
            min-height: 200px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Join Screen -->
        <div id="joinScreen" class="screen login-screen">
            <div class="assignment-header">
                <h1>📋 Assignment</h1>
                <p id="assignmentTitle" class="assignment-title"></p>
                <p id="assignmentCode" class="assignment-code"></p>
            </div>
            
            <form id="joinForm">
                <input type="text" id="nicknameInput" class="form-input" placeholder="Enter your name..." required autocomplete="off">
                
                <div id="passwordGroup" class="password-group hidden">
                    <label for="passwordInput">Password:</label>
                    <input type="password" id="passwordInput" class="form-input" placeholder="Enter password...">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-play"></i> Start Assignment
                </button>
            </form>
            
            <div id="joinError" class="error-message hidden"></div>
        </div>

        <!-- Assignment Screen -->
        <div id="assignmentScreen" class="screen hidden">
            <div class="question-display">
                <div class="question-number" id="questionNumber">
                    <i class="fas fa-question-circle"></i> Question 1 of 10
                </div>
                <div class="question-text" id="questionText">Question will appear here</div>
                <img id="questionImage" class="question-image hidden" src="" alt="Question image">
            </div>

            <!-- Dynamic content container for different question types -->
            <div id="optionsPhase">
                <div id="optionsContainer" class="options-container">
                    <!-- Content rendered by JS based on question type -->
                </div>
            </div>
            
            <!-- Self-paced navigation -->
            <div class="self-paced-nav" id="selfPacedNav">
                <button id="prevBtn" class="btn btn-secondary" disabled>
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <div class="question-progress" id="questionProgress">1 / 10</div>
                <button id="nextBtn" class="btn btn-primary">
                    Next <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>

        <!-- Completion Screen -->
        <div id="completionScreen" class="screen hidden">
            <div class="end-screen-content">
                <h1 class="trophy-title">
                    <i class="fas fa-check-circle"></i> Assignment Complete!
                </h1>
                <p class="congrats-text">
                    Your answers have been submitted.
                </p>
                
                <div id="scoreSummary" class="performance-summary">
                    <h3><i class="fas fa-chart-bar"></i> Your Results</h3>
                    <div id="scoreStats" class="performance-stats">
                        <!-- Stats populated by JavaScript -->
                    </div>
                </div>
                
                <div class="end-screen-actions">
                    <button id="reviewBtn" class="btn btn-primary">
                        <i class="fas fa-eye"></i> Review Answers
                    </button>
                    <button id="closeBtn" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Loading/Error States -->
        <div id="loadingScreen" class="screen">
            <div class="spinner"></div>
            <p>Loading assignment...</p>
        </div>
        
        <div id="errorScreen" class="screen hidden">
            <h2><i class="fas fa-exclamation-triangle"></i> Error</h2>
            <p id="errorMessage">Assignment not found or has expired.</p>
            <a href="/" class="btn btn-primary">Go Home</a>
        </div>
    </div>

    <!-- Network Status Indicator -->
    <div class="network-status" id="networkStatus">
        <i class="fas fa-circle-notch fa-spin"></i> Connecting...
    </div>

    <!-- Message System Container -->
    <div class="message-system" id="messageSystem"></div>

    <!-- App Entry Point -->
    <script type="module">
        import { api } from './assets/js/core/api.js';
        import { showSuccess, showError } from './assets/js/components/MessageSystem.js';
        import { MediaEmbed } from './assets/js/components/MediaEmbed.js';
        
        // Get assignment code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const assignmentCode = urlParams.get('code');
        
        let assignment = null;
        let questions = [];
        let currentIndex = 0;
        let playerId = null;
        let sessionId = null;
        let answers = {};
        
        // DOM elements
        const screens = {
            loading: document.getElementById('loadingScreen'),
            error: document.getElementById('errorScreen'),
            join: document.getElementById('joinScreen'),
            assignment: document.getElementById('assignmentScreen'),
            completion: document.getElementById('completionScreen')
        };
        
        function showScreen(name) {
            Object.values(screens).forEach(s => s.classList.add('hidden'));
            if (screens[name]) screens[name].classList.remove('hidden');
        }
        
        // Initialize
        async function init() {
            if (!assignmentCode) {
                document.getElementById('errorMessage').textContent = 'No assignment code provided. Add ?code=XXXXXX to the URL.';
                showScreen('error');
                return;
            }
            
            try {
                const result = await api.request('getAssignmentByCode', { code: assignmentCode });
                
                if (!result.success || !result.assignment) {
                    document.getElementById('errorMessage').textContent = result.error || 'Assignment not found.';
                    showScreen('error');
                    return;
                }
                
                assignment = result.assignment;
                sessionId = assignment.sessionId;
                
                // Update join screen
                document.getElementById('assignmentTitle').textContent = assignment.title;
                document.getElementById('assignmentCode').textContent = `Code: ${assignment.code}`;
                
                if (assignment.hasPassword) {
                    document.getElementById('passwordGroup').classList.remove('hidden');
                }
                
                showScreen('join');
                
            } catch (error) {
                console.error('Init error:', error);
                document.getElementById('errorMessage').textContent = 'Failed to load assignment.';
                showScreen('error');
            }
        }
        
        // Join form handler
        document.getElementById('joinForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nickname = document.getElementById('nicknameInput').value.trim();
            const password = document.getElementById('passwordInput').value;
            
            if (!nickname) return;
            
            try {
                const result = await api.request('joinAssignment', {
                    code: assignmentCode,
                    nickname: nickname,
                    password: password || null
                });
                
                if (result.success) {
                    playerId = result.playerId;
                    localStorage.setItem('playerId', playerId);
                    localStorage.setItem('assignmentSessionId', result.sessionId);
                    
                    await loadQuestions();
                    
                } else {
                    const errorEl = document.getElementById('joinError');
                    errorEl.textContent = result.error || 'Failed to join';
                    errorEl.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Join error:', error);
                showError('Network error');
            }
        });
        
        async function loadQuestions() {
            try {
                const result = await api.request('getGameState', { 
                    playerId: playerId,
                    sessionId: sessionId 
                });
                
                if (result.success) {
                    questions = result.questions || [];
                    currentIndex = 0;
                    showScreen('assignment');
                    renderQuestion();
                }
            } catch (error) {
                console.error('Load questions error:', error);
            }
        }
        
        function renderQuestion() {
            if (currentIndex >= questions.length) {
                showCompletion();
                return;
            }
            
            const question = questions[currentIndex];
            const type = question.type || 'single_choice';
            
            // Update header
            document.getElementById('questionNumber').innerHTML = 
                `<i class="fas fa-question-circle"></i> Question ${currentIndex + 1} of ${questions.length}`;
            document.getElementById('questionText').textContent = question.question;
            document.getElementById('questionProgress').textContent = `${currentIndex + 1} / ${questions.length}`;
            
            // Update nav buttons
            document.getElementById('prevBtn').disabled = currentIndex === 0;
            document.getElementById('nextBtn').textContent = 
                currentIndex === questions.length - 1 ? 'Finish' : 'Next';
            
            // Render options based on type
            const container = document.getElementById('optionsContainer');
            container.innerHTML = '';
            
            // Add media if present
            if (MediaEmbed.hasMedia(question.media)) {
                const mediaDiv = document.createElement('div');
                mediaDiv.className = 'question-media';
                MediaEmbed.render(question.media, mediaDiv);
                container.appendChild(mediaDiv);
            }
            
            // Render type-specific content
            if (type === 'single_choice') {
                renderSingleChoice(question, container);
            } else if (type === 'multi_select') {
                renderMultiSelect(question, container);
            } else if (type === 'fill_blanks') {
                renderFillBlanks(question, container);
            } else if (type === 'open_ended') {
                renderOpenEnded(question, container);
            }
        }
        
        function renderSingleChoice(question, container) {
            const grid = document.createElement('div');
            grid.className = 'options-grid';
            
            question.options.forEach((option, index) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.dataset.index = index;
                btn.textContent = option;
                
                if (answers[currentIndex]?.answer === index) {
                    btn.classList.add('selected');
                }
                
                btn.addEventListener('click', () => selectOption(index, btn, grid));
                grid.appendChild(btn);
            });
            
            container.appendChild(grid);
        }
        
        function selectOption(index, btn, grid) {
            grid.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            answers[currentIndex] = { answer: index, type: 'single_choice' };
        }
        
        function renderMultiSelect(question, container) {
            const wrapper = document.createElement('div');
            wrapper.className = 'multi-select-options';
            
            const selected = answers[currentIndex]?.answers || [];
            
            question.options.forEach((option, index) => {
                const label = document.createElement('label');
                label.className = 'multi-select-option';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = selected.includes(index);
                checkbox.addEventListener('change', (e) => {
                    let current = answers[currentIndex]?.answers || [];
                    if (e.target.checked) {
                        current.push(index);
                    } else {
                        current = current.filter(i => i !== index);
                    }
                    answers[currentIndex] = { answers: current, type: 'multi_select' };
                });
                
                const text = document.createElement('span');
                text.className = 'option-text';
                text.textContent = option;
                
                label.appendChild(checkbox);
                label.appendChild(text);
                wrapper.appendChild(label);
            });
            
            container.appendChild(wrapper);
        }
        
        function renderFillBlanks(question, container) {
            const content = document.createElement('div');
            content.className = 'fill-blanks-content';
            
            let html = question.question;
            let blankIndex = 0;
            const blanksConfig = question.blanksConfig || [];
            const savedAnswers = answers[currentIndex]?.answers || {};
            
            html = html.replace(/\{\{([^}]+)\}\}/g, (match) => {
                const blank = blanksConfig[blankIndex] || { id: blankIndex };
                const value = savedAnswers[blank.id] || '';
                const input = `<input type="text" class="blank-input" data-blank-id="${blank.id}" value="${value}" placeholder="...">`;
                blankIndex++;
                return input;
            });
            
            content.innerHTML = html;
            
            content.querySelectorAll('.blank-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const blankId = parseInt(e.target.dataset.blankId, 10);
                    if (!answers[currentIndex]) {
                        answers[currentIndex] = { answers: {}, type: 'fill_blanks' };
                    }
                    answers[currentIndex].answers[blankId] = e.target.value;
                });
            });
            
            container.appendChild(content);
        }
        
        function renderOpenEnded(question, container) {
            const wrapper = document.createElement('div');
            wrapper.className = 'open-ended-phase';
            
            const config = question.openConfig || {};
            const hints = config.hints || [];
            
            if (hints.length > 0) {
                const hintsDiv = document.createElement('div');
                hintsDiv.className = 'open-ended-hints';
                hintsDiv.innerHTML = '<strong>💡 Hints:</strong> ' + hints.join(' • ');
                wrapper.appendChild(hintsDiv);
            }
            
            const textarea = document.createElement('textarea');
            textarea.className = 'open-ended-textarea';
            textarea.placeholder = 'Type your answer here...';
            textarea.maxLength = config.maxLength || 1000;
            textarea.value = answers[currentIndex]?.text || '';
            textarea.addEventListener('input', (e) => {
                answers[currentIndex] = { text: e.target.value, type: 'open_ended' };
            });
            
            wrapper.appendChild(textarea);
            container.appendChild(wrapper);
        }
        
        // Navigation
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion();
            }
        });
        
        document.getElementById('nextBtn').addEventListener('click', async () => {
            // Submit current answer
            await submitCurrentAnswer();
            
            if (currentIndex < questions.length - 1) {
                currentIndex++;
                renderQuestion();
            } else {
                showCompletion();
            }
        });
        
        async function submitCurrentAnswer() {
            const answer = answers[currentIndex];
            if (!answer) return;
            
            try {
                let action = 'submitAnswer';
                let data = { playerId, sessionId };
                
                if (answer.type === 'single_choice') {
                    action = 'submitAnswer';
                    data.answer = answer.answer;
                } else if (answer.type === 'multi_select') {
                    action = 'submitMultiAnswer';
                    data.answers = answer.answers;
                } else if (answer.type === 'fill_blanks') {
                    action = 'submitBlanksAnswer';
                    data.answers = answer.answers;
                } else if (answer.type === 'open_ended') {
                    action = 'submitOpenAnswer';
                    data.answerText = answer.text;
                }
                
                await api.request(action, data);
            } catch (error) {
                console.error('Submit error:', error);
            }
        }
        
        function showCompletion() {
            const answered = Object.keys(answers).length;
            document.getElementById('scoreStats').innerHTML = `
                <div class="stat-box">
                    <div class="stat-value">${answered}/${questions.length}</div>
                    <div class="stat-label">Questions Answered</div>
                </div>
            `;
            showScreen('completion');
        }
        
        document.getElementById('reviewBtn').addEventListener('click', () => {
            currentIndex = 0;
            showScreen('assignment');
            renderQuestion();
        });
        
        document.getElementById('closeBtn').addEventListener('click', () => {
            window.close();
        });
        
        // Start
        init();
    </script>
</body>
</html>
