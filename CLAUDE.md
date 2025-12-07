# Quizerka - Claude Context Document

> **TL;DR for Claude**: Interactive quiz platform with PHP/SQLite backend and vanilla JS ES6 modules frontend. Four question types, assignment mode, real-time buzzer system.

---

## 🚀 Quick Reference (Read This First!)

### Essential Files
| File | Purpose |
|------|---------|
| `public/api.php` | ALL backend API endpoints (switch/case on `action`) |
| `src/QuizManager.php` | Core game logic - ALL backend methods |
| `src/Database.php` | SQLite connection with WAL mode |
| `public/assets/js/PlayerApp.js` | Player main entry point |
| `public/assets/js/AdminApp.js` | Admin main entry point |
| `public/assets/js/core/api.js` | `ApiClient` class - frontend API calls |
| `public/assets/js/core/state.js` | `StateManager` class - polling & state |
| `public/assignment-modular.php` | Student interface for self-paced assignments |

### ⚠️ CRITICAL NAMING CONVENTIONS (AI often gets these wrong!)

```javascript
// CORRECT API action names (case-sensitive strings in api.php):
'pressBuzzer'      // NOT 'buzz', 'buzzer', 'submitBuzz'
'submitAnswer'     // For single_choice - sends { answer: index }
'submitMultiAnswer' // For multi_select - sends { answers: [indices] }
'submitBlanksAnswer' // For fill_blanks - sends { answers: ['text1', 'text2'] }
'submitOpenAnswer'  // For open_ended - sends { answer: 'text' }
'revealCorrect'    // NOT 'reveal', 'showCorrect', 'showAnswer'
'showOptions'      // NOT 'revealOptions', 'showAnswers'
'softReset'        // Resets current question only (keeps players)
'resetGame'        // Full reset (clears players too)
'getGameState'     // Player polling endpoint
'getGameData'      // Admin polling endpoint (includes answerStats)
'markSpoken'       // NOT 'markAsSpoken', 'setSpoken'

// Question type identifiers (in question.type field):
'single_choice'    // NOT 'single', 'choice', 'multiple_choice'
'multi_select'     // NOT 'multi', 'multiple', 'multiselect'  
'fill_blanks'      // NOT 'fill_blank', 'fillBlanks', 'blanks'
'open_ended'       // NOT 'open', 'openEnded', 'text'

// Question fields per type:
// single_choice: { question, options[], correct: index, image?, youtube?, audio? }
// multi_select:  { question, options[], correctAnswers: [indices], ... }
// fill_blanks:   { question, blanksConfig: [{correct, alternatives?}], ... }
// open_ended:    { question, openConfig: {suggestedAnswer?, hint?, requiresGrading?}, ... }

// CORRECT: correctAnswers (plural, camelCase) for multi_select
// WRONG: correctAnswer, correct_answers, correctIndexes

// CORRECT: blanksConfig (camelCase, Config suffix)
// WRONG: blanks_config, blanksData, fillConfig

// CORRECT: openConfig 
// WRONG: open_config, openEndedConfig
```

### Game State Structure
```javascript
// From getGameState (player) or getGameData (admin)
{
  success: true,
  stateVersion: 123,        // Integer - increments on ANY change
  gameState: {
    gameStarted: boolean,
    currentQuestion: number, // 0-indexed
    phase: 'waiting' | 'question_shown' | 'options_shown' | 'reveal' | 'finished',
    buzzers: [{playerId, nickname, timestamp}],  // Current question's buzzers
    spokenPlayers: ['playerId1', 'playerId2'],   // Who already answered verbally
    answers: [{playerId, question, answer, isCorrect, timestamp, score}]
  },
  questions: [...],         // Array of question objects
  players: [{id, nickname, score, joinedAt}],
  // Admin only (getGameData):
  answerStats: { total, correct, byOption: {0: count, 1: count, ...} },
  allAnswers: [...]
}
```

### Phase Flow
```
waiting → [startGame] → question_shown → [showOptions] → options_shown → [revealCorrect] → reveal → [nextQuestion] → question_shown... → finished
```
**Phase check order in code**: `finished` → `!gameStarted` → specific phases

### API Actions Reference

#### Player Actions
| Action | Parameters | Returns |
|--------|------------|---------|
| `joinGame` | `{nickname}` | `{success, playerId, nickname}` |
| `getGameState` | `{}` | Full state object |
| `pressBuzzer` | `{playerId}` | `{success, position, message}` |
| `submitAnswer` | `{playerId, answer: index}` | `{success, isCorrect, correctAnswer}` |
| `submitMultiAnswer` | `{playerId, answers: [indices]}` | `{success, score, correctSelected, totalCorrect}` |
| `submitBlanksAnswer` | `{playerId, answers: ['a','b']}` | `{success, score, results: [{correct, userAnswer}]}` |
| `submitOpenAnswer` | `{playerId, answer: 'text'}` | `{success, requiresGrading, autoScore}` |
| `getPlayerSummary` | `{playerId}` | `{totalQuestions, correctAnswers, score, answers}` |
| `getNotes` | `{}` | `{content, updatedAt}` |

#### Admin Actions
| Action | Parameters | Returns |
|--------|------------|---------|
| `startGame` | `{}` | `{success, stateVersion}` |
| `showOptions` | `{}` | `{success, stateVersion}` |
| `revealCorrect` | `{}` | `{success, stateVersion}` |
| `nextQuestion` | `{}` | `{success, stateVersion, currentQuestion}` |
| `markSpoken` | `{playerId}` | `{success}` |
| `softReset` | `{}` | `{success}` - resets current Q, keeps players |
| `resetGame` | `{}` | `{success}` - full reset |
| `updateQuestions` | `{questionsJson: 'string'}` | `{success, questionCount}` |
| `getGameData` | `{}` | Full state + answerStats |
| `saveNotes` | `{content}` | `{success, updatedAt}` |
| `gradeAnswer` | `{playerId, questionIndex, grade, feedback?}` | `{success}` |

#### Assignment Actions
| Action | Parameters | Returns |
|--------|------------|---------|
| `createAssignment` | `{title, password?, expiresAt?}` | `{success, assignmentId, code}` |
| `getAssignmentByCode` | `{code}` | `{success, assignment, questions}` |
| `joinAssignment` | `{code, nickname, password?}` | `{success, sessionId, nickname}` |
| `getAssignments` | `{}` | `{success, assignments: [...]}` |
| `getAssignmentResults` | `{assignmentId}` | `{success, submissions: [...]}` |
| `deleteAssignment` | `{assignmentId}` | `{success}` |

#### Session Actions
| Action | Parameters | Returns |
|--------|------------|---------|
| `saveSession` | `{name}` | `{success, sessionId}` |
| `getSessions` | `{}` | `{success, sessions: [...]}` |
| `loadSession` | `{sessionId}` | `{success}` |
| `deleteSession` | `{sessionId}` | `{success}` |

---

## Question Types & JSON Format

### 1. Single Choice (default)
```json
{
  "type": "single_choice",
  "question": "What is 2+2?",
  "options": ["3", "4", "5", "6"],
  "correct": 1,
  "image": "optional-url",
  "youtube": "https://youtube.com/watch?v=xxx",
  "audio": "https://example.com/audio.mp3",
  "explanation": "Admin notes (not shown to students)"
}
```
**Note**: `correct` is 0-indexed. Options get shuffled, correct index is remapped.

### 2. Multi-Select
```json
{
  "type": "multi_select",
  "question": "Select all prime numbers:",
  "options": ["2", "4", "7", "9", "11"],
  "correctAnswers": [0, 2, 4],
  "youtube": "optional"
}
```
**Scoring**: Partial credit = correctSelected / totalCorrect (0 to 1)

### 3. Fill in the Blanks
```json
{
  "type": "fill_blanks",
  "question": "The capital of France is ___. The capital of Germany is ___.",
  "blanksConfig": [
    {"correct": "Paris", "alternatives": ["paris"]},
    {"correct": "Berlin", "alternatives": ["berlin"]}
  ]
}
```
**Matching**: Case-insensitive, trims whitespace, checks alternatives

### 4. Open-Ended
```json
{
  "type": "open_ended", 
  "question": "Explain photosynthesis in your own words.",
  "openConfig": {
    "suggestedAnswer": "Plants convert sunlight...",
    "hint": "Think about sunlight and CO2",
    "requiresGrading": true
  }
}
```
**Note**: If `requiresGrading: true`, teacher must manually grade via `gradeAnswer` action.

---

## Frontend Architecture

### ES Modules Structure (No Bundler)
```
public/assets/js/
├── PlayerApp.js          # Player entry - imports all player modules
├── AdminApp.js           # Admin entry - imports all admin modules
├── core/
│   ├── api.js            # ApiClient class
│   ├── state.js          # StateManager with polling
│   └── utils.js          # escapeHtml, formatTime, onReady, debounce
├── components/           # Shared UI
│   ├── HelpPanel.js
│   ├── NetworkStatus.js
│   ├── MessageSystem.js  # Toast notifications
│   ├── MarkdownRenderer.js
│   ├── Modal.js
│   ├── ActionFeedback.js
│   └── MediaEmbed.js     # YouTube & audio player
├── admin/
│   ├── GameControl.js    # Play/pause/next buttons
│   ├── QuestionEditor.js
│   ├── SessionManager.js
│   ├── NotesEditor.js
│   ├── TabsNavigation.js
│   └── AssignmentManager.js  # Create/manage assignments
└── player/
    ├── BuzzerPhase.js
    ├── OptionsPhase.js   # Single choice UI
    ├── MultiSelectPhase.js
    ├── FillBlanksPhase.js
    ├── OpenEndedPhase.js
    ├── EndScreen.js
    ├── AudioManager.js   # Buzzer sounds
    ├── KeyboardShortcuts.js
    └── ScreenManager.js
```

### Key Classes

**ApiClient** (`core/api.js`)
```javascript
const api = new ApiClient('api.php');
await api.post('actionName', {data});  // Generic
await api.pressBuzzer(playerId);       // Convenience methods
await api.request('anyAction', data);  // Alternative (if exists)
```

**StateManager** (`core/state.js`)
```javascript
const state = new StateManager(api, {
  pollingInterval: 500,    // Player: 500ms, Admin: 1000ms
  fetchMethod: 'getGameState',  // or 'getGameData' for admin
  autoStart: true
});
state.subscribe(callback);  // Called on state change
state.refresh();            // Force immediate fetch
```

### CSS Architecture
```
public/assets/css/
├── variables.css    # --cyan-400, --bg-gray-800, etc.
├── base.css, buttons.css, forms.css, animations.css
├── components/      # help-panel, modal, notifications, badges, cards
├── admin/           # dashboard, tabs, game-controls, assignments, etc.
└── player/          # login, buzzer, options, question-types, end-screen
```

**Key CSS Variables**:
```css
--cyan-400, --cyan-500, --cyan-600  /* Primary brand */
--green-500, --red-500              /* Success/Error */
--bg-gray-700, --bg-gray-800, --bg-gray-900  /* Backgrounds */
--text-white, --text-gray-300, --text-gray-400  /* Text */
--border-gray-600, --border-gray-700  /* Borders */
```

---

## Backend Architecture

### Database Schema (SQLite)
```sql
-- Core tables
players (id, session_id, nickname, score, joined_at, is_active)
questions (id, session_id, position, question, type, options, correct, 
           correct_answers, blanks_config, open_config, image, youtube, audio, explanation)
game_state (session_id, key, value)  -- Key-value store for state
buzzers (id, session_id, player_id, question_index, timestamp)
answers (id, session_id, player_id, question_index, answer, answer_text, 
         is_correct, score, timestamp, graded_at, feedback)
spoken_players (id, session_id, player_id, question_index)

-- Sessions & Assignments
saved_sessions (id, name, data, created_at)
assignments (id, session_id, code, title, delivery_mode, password_hash, 
             created_at, expires_at)
assignment_submissions (id, assignment_id, nickname, score, answers, 
                        started_at, completed_at)
```

### QuizManager Key Methods
```php
// Player methods
joinGame(string $nickname): array
recordBuzzer(string $playerId, int $questionIndex): array
submitAnswer(string $playerId, int $questionIndex, int $answerIndex): array
submitMultiAnswer(string $playerId, int $questionIndex, array $selectedIndices): array
submitBlanksAnswer(string $playerId, int $questionIndex, array $answers): array
submitOpenAnswer(string $playerId, int $questionIndex, string $answerText): array
getPlayerSummary(string $playerId): array

// Admin methods
startGame(): array
nextQuestion(int $expectedVersion = 0): array
showOptions(): array
revealCorrect(): array
markSpoken(string $playerId, int $questionIndex): bool
softReset(): array
resetGame(): array
updateQuestions(array $newQuestions): array
gradeOpenAnswer(string $playerId, int $questionIndex, int $grade, string $feedback): array

// Assignment methods  
createAssignment(string $title, string $deliveryMode, ?string $password, ?string $expiresAt): array
getAssignmentByCode(string $code): ?array
joinAssignment(string $code, string $nickname, ?string $password): array
getAssignments(): array
deleteAssignment(string $assignmentId): bool
```

---

## Testing

### Run Full Test Suite
```bash
./test-modular.sh http://localhost:8080
# 98 tests covering: CSS, JS, API flow, question types, assignments, database
```

### Quick API Tests
```bash
# Get state
curl -s -X POST http://localhost:8080/api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"getGameState"}' | jq .

# Join game
curl -s -X POST http://localhost:8080/api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"joinGame","nickname":"TestPlayer"}' | jq .

# Create assignment
curl -s -X POST http://localhost:8080/api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"createAssignment","title":"Quiz 1","password":"secret"}' | jq .
```

### Start Dev Server
```bash
php -S localhost:8080 -t public/
```

---

## URLs & Entry Points

| URL | Purpose |
|-----|---------|
| `/index-modular.php` | Student interface (live quiz) |
| `/admin-modular.php` | Teacher dashboard |
| `/assignment-modular.php?code=XXXX` | Self-paced assignment |
| `/template_manager.php` | Question template builder |
| `/api.php` | All API endpoints |

---

## Common Pitfalls for AI

1. **Don't use** `correct_answers` (snake_case) - use `correctAnswers` in JSON
2. **Don't use** `buzz` action - it's `pressBuzzer`
3. **Don't use** `answer` parameter for multi-select - use `answers` (array)
4. **Don't assume** questions have `options` - open_ended and fill_blanks don't
5. **Don't forget** phase checks - UI depends heavily on `gameState.phase`
6. **Don't skip** `stateVersion` - it's how polling detects changes
7. **Don't mix** `getGameState` (player) with `getGameData` (admin)
8. **Options get shuffled** - `correct` index is remapped after shuffle
9. **Assignment codes** are 6 chars uppercase alphanumeric (e.g., "4BGMLL")
10. **Notes API** returns `{content, updatedAt}` not just string

---

## Project Structure
```
quizzera/
├── public/                    # Web root
│   ├── index-modular.php      # Player interface
│   ├── admin-modular.php      # Admin interface  
│   ├── assignment-modular.php # Self-paced quiz interface
│   ├── template_manager.php   # Question builder tool
│   ├── api.php                # Central API controller
│   └── assets/
│       ├── css/               # Modular CSS
│       └── js/                # ES6 Modules
├── src/
│   ├── Database.php           # SQLite with WAL mode
│   └── QuizManager.php        # All game logic
├── data/
│   └── quiz.db                # SQLite database
├── test-modular.sh            # Test suite (98 tests)
├── CLAUDE.md                  # This file
├── ROADMAP.md                 # Future plans
└── legacy_dont_edit/          # Old code - DO NOT MODIFY
```

---

## Warnings

1. **No npm/composer** - Zero external dependencies
2. **Don't modify** `legacy_dont_edit/` directory
3. **Don't use** `migrate.php` - migration completed
4. **`data/` must be writable** by PHP for SQLite
5. **`index.php` and `admin.php`** are legacy duplicates - use `-modular` versions
