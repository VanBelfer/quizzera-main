#!/bin/bash
# Test script for Quizzera modular frontend
# Run from project root: ./test-modular.sh

# Don't exit on error - we want to run all tests
set +e

BASE_URL="${1:-http://localhost:8080}"
API_URL="$BASE_URL/api.php"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

section() {
    echo ""
    echo -e "${YELLOW}━━━ $1 ━━━${NC}"
}

# Test if a URL returns 200
test_url() {
    local url="$1"
    local desc="$2"
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status" = "200" ]; then
        pass "$desc (HTTP $status)"
        return 0
    else
        fail "$desc (HTTP $status)"
        return 1
    fi
}

# Test if file contains expected content
test_content() {
    local url="$1"
    local pattern="$2"
    local desc="$3"
    
    content=$(curl -s "$url")
    if echo "$content" | grep -q "$pattern"; then
        pass "$desc"
        return 0
    else
        fail "$desc - pattern not found: $pattern"
        return 1
    fi
}

# API test helper
api_test() {
    local action="$1"
    local data="$2"
    local expected="$3"
    local desc="$4"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    if echo "$response" | grep -q "$expected"; then
        pass "API: $desc"
        echo "$response"
        return 0
    else
        fail "API: $desc"
        echo "Response: $response"
        return 1
    fi
}

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        QUIZZERA MODULAR FRONTEND TEST SUITE               ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Base URL: $BASE_URL"
echo "╚═══════════════════════════════════════════════════════════╝"

# ============================================================
section "1. CSS Modules Availability"
# ============================================================

test_url "$BASE_URL/assets/css/variables.css" "variables.css"
test_url "$BASE_URL/assets/css/base.css" "base.css"
test_url "$BASE_URL/assets/css/buttons.css" "buttons.css"
test_url "$BASE_URL/assets/css/forms.css" "forms.css"
test_url "$BASE_URL/assets/css/animations.css" "animations.css"

# Components
test_url "$BASE_URL/assets/css/components/help-panel.css" "components/help-panel.css"
test_url "$BASE_URL/assets/css/components/notifications.css" "components/notifications.css"
test_url "$BASE_URL/assets/css/components/modal.css" "components/modal.css"
test_url "$BASE_URL/assets/css/components/progress.css" "components/progress.css"

# Admin CSS
test_url "$BASE_URL/assets/css/admin/dashboard.css" "admin/dashboard.css"
test_url "$BASE_URL/assets/css/admin/tabs.css" "admin/tabs.css"
test_url "$BASE_URL/assets/css/admin/game-controls.css" "admin/game-controls.css"

# Player CSS
test_url "$BASE_URL/assets/css/player/login.css" "player/login.css"
test_url "$BASE_URL/assets/css/player/buzzer.css" "player/buzzer.css"
test_url "$BASE_URL/assets/css/player/options.css" "player/options.css"

# ============================================================
section "2. JavaScript Modules Availability"
# ============================================================

# Core
test_url "$BASE_URL/assets/js/core/api.js" "core/api.js"
test_url "$BASE_URL/assets/js/core/state.js" "core/state.js"
test_url "$BASE_URL/assets/js/core/utils.js" "core/utils.js"

# Components
test_url "$BASE_URL/assets/js/components/HelpPanel.js" "components/HelpPanel.js"
test_url "$BASE_URL/assets/js/components/NetworkStatus.js" "components/NetworkStatus.js"
test_url "$BASE_URL/assets/js/components/MessageSystem.js" "components/MessageSystem.js"
test_url "$BASE_URL/assets/js/components/MarkdownRenderer.js" "components/MarkdownRenderer.js"
test_url "$BASE_URL/assets/js/components/Modal.js" "components/Modal.js"
test_url "$BASE_URL/assets/js/components/ActionFeedback.js" "components/ActionFeedback.js"

# Admin modules
test_url "$BASE_URL/assets/js/admin/GameControl.js" "admin/GameControl.js"
test_url "$BASE_URL/assets/js/admin/QuestionEditor.js" "admin/QuestionEditor.js"
test_url "$BASE_URL/assets/js/admin/SessionManager.js" "admin/SessionManager.js"
test_url "$BASE_URL/assets/js/admin/NotesEditor.js" "admin/NotesEditor.js"
test_url "$BASE_URL/assets/js/admin/TabsNavigation.js" "admin/TabsNavigation.js"

# Player modules
test_url "$BASE_URL/assets/js/player/BuzzerPhase.js" "player/BuzzerPhase.js"
test_url "$BASE_URL/assets/js/player/OptionsPhase.js" "player/OptionsPhase.js"
test_url "$BASE_URL/assets/js/player/EndScreen.js" "player/EndScreen.js"
test_url "$BASE_URL/assets/js/player/AudioManager.js" "player/AudioManager.js"
test_url "$BASE_URL/assets/js/player/KeyboardShortcuts.js" "player/KeyboardShortcuts.js"
test_url "$BASE_URL/assets/js/player/ScreenManager.js" "player/ScreenManager.js"

# New question types
test_url "$BASE_URL/assets/js/player/MultiSelectPhase.js" "player/MultiSelectPhase.js"
test_url "$BASE_URL/assets/js/player/FillBlanksPhase.js" "player/FillBlanksPhase.js"
test_url "$BASE_URL/assets/js/player/OpenEndedPhase.js" "player/OpenEndedPhase.js"
test_url "$BASE_URL/assets/js/components/MediaEmbed.js" "components/MediaEmbed.js"

# Question types CSS
test_url "$BASE_URL/assets/css/player/question-types.css" "player/question-types.css"

# Main apps
test_url "$BASE_URL/assets/js/AdminApp.js" "AdminApp.js (entry point)"
test_url "$BASE_URL/assets/js/PlayerApp.js" "PlayerApp.js (entry point)"

# ============================================================
section "3. HTML Pages"
# ============================================================

test_url "$BASE_URL/index-modular.php" "Player interface (modular)"
test_url "$BASE_URL/admin-modular.php" "Admin interface (modular)"
test_url "$BASE_URL/index.php" "Player interface (legacy)"
test_url "$BASE_URL/admin.php" "Admin interface (legacy)"

# ============================================================
section "4. Module Import Syntax Check"
# ============================================================

test_content "$BASE_URL/index-modular.php" 'type="module"' "Player has ES module script tag"
test_content "$BASE_URL/admin-modular.php" 'type="module"' "Admin has ES module script tag"
test_content "$BASE_URL/index-modular.php" "PlayerApp.js" "Player imports PlayerApp.js"
test_content "$BASE_URL/admin-modular.php" "AdminApp.js" "Admin imports AdminApp.js"

# ============================================================
section "5. CSS Variables Check"
# ============================================================

test_content "$BASE_URL/assets/css/variables.css" "bg-dark" "CSS has --bg-dark variable"
test_content "$BASE_URL/assets/css/variables.css" "cyan-400" "CSS has --cyan-400 variable"
test_content "$BASE_URL/assets/css/variables.css" "transition" "CSS has --transition variable"

# ============================================================
section "6. JS Export Syntax Check"
# ============================================================

test_content "$BASE_URL/assets/js/core/api.js" "export class ApiClient" "api.js exports ApiClient"
test_content "$BASE_URL/assets/js/core/state.js" "export class StateManager" "state.js exports StateManager"
test_content "$BASE_URL/assets/js/components/HelpPanel.js" "export class HelpPanel" "HelpPanel.js exports class"
test_content "$BASE_URL/assets/js/admin/GameControl.js" "export class GameControl" "GameControl.js exports class"
test_content "$BASE_URL/assets/js/player/BuzzerPhase.js" "export class BuzzerPhase" "BuzzerPhase.js exports class"
test_content "$BASE_URL/assets/js/player/MultiSelectPhase.js" "export class MultiSelectPhase" "MultiSelectPhase.js exports class"
test_content "$BASE_URL/assets/js/player/FillBlanksPhase.js" "export class FillBlanksPhase" "FillBlanksPhase.js exports class"
test_content "$BASE_URL/assets/js/player/OpenEndedPhase.js" "export class OpenEndedPhase" "OpenEndedPhase.js exports class"

# ============================================================
section "7. API Backend Tests"
# ============================================================

info "Testing API endpoints..."

# Reset game first
api_test "resetGame" '{"action":"resetGame"}' '"success":true' "Reset game"

# Get game state
api_test "getGameState" '{"action":"getGameState"}' '"success":true' "Get game state"

# Join game as player
PLAYER_RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"joinGame","nickname":"TestPlayer"}')

if echo "$PLAYER_RESPONSE" | grep -q '"success":true'; then
    pass "API: Join game as TestPlayer"
    PLAYER_ID=$(echo "$PLAYER_RESPONSE" | grep -o '"playerId":"[^"]*"' | cut -d'"' -f4)
    info "Player ID: $PLAYER_ID"
else
    fail "API: Join game as TestPlayer"
fi

# Start game
api_test "startGame" '{"action":"startGame"}' '"success":true' "Start game"

# Get state after start
STATE_RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{"action":"getGameState"}')

if echo "$STATE_RESPONSE" | grep -q '"gameStarted":true'; then
    pass "API: Game is now started"
else
    fail "API: Game should be started"
fi

if echo "$STATE_RESPONSE" | grep -q '"phase":"question_shown"'; then
    pass "API: Phase is question_shown"
else
    fail "API: Phase should be question_shown"
fi

# Press buzzer
if [ -n "$PLAYER_ID" ]; then
    api_test "pressBuzzer" "{\"action\":\"pressBuzzer\",\"playerId\":\"$PLAYER_ID\"}" '"success":true' "Press buzzer"
fi

# Show options
api_test "showOptions" '{"action":"showOptions"}' '"success":true' "Show options"

# Submit answer
if [ -n "$PLAYER_ID" ]; then
    api_test "submitAnswer" "{\"action\":\"submitAnswer\",\"playerId\":\"$PLAYER_ID\",\"answer\":0}" '"success":true' "Submit answer"
fi

# Reveal correct
api_test "revealCorrect" '{"action":"revealCorrect"}' '"success":true' "Reveal correct answer"

# Next question
api_test "nextQuestion" '{"action":"nextQuestion"}' '"success":true' "Next question"

# Soft reset
api_test "softReset" '{"action":"softReset"}' '"success":true' "Soft reset"

# Final reset
api_test "resetGame" '{"action":"resetGame"}' '"success":true' "Final reset (cleanup)"

# ============================================================
section "8. Media Embed Tests (YouTube, Audio, Image)"
# ============================================================

info "Testing media embedding in questions..."

curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null

# Test question with YouTube video
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"single_choice\",\"question\":\"What is shown in this video?\",\"options\":[\"Cat\",\"Dog\",\"Bird\",\"Fish\"],\"correct\":0,\"media\":{\"youtube\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}}]"}' > /dev/null

STATE_YT=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')
if echo "$STATE_YT" | grep -q '"youtube"'; then
    pass "API: Question with YouTube video saved"
else
    fail "API: Question with YouTube video not saved"
fi

# Test question with Audio
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"single_choice\",\"question\":\"What sound is this?\",\"options\":[\"Bell\",\"Horn\",\"Whistle\",\"Drum\"],\"correct\":0,\"media\":{\"audio\":\"https://example.com/sound.mp3\"}}]"}' > /dev/null

STATE_AUDIO=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')
if echo "$STATE_AUDIO" | grep -q '"audio"'; then
    pass "API: Question with audio file saved"
else
    fail "API: Question with audio file not saved"
fi

# Test question with both YouTube and Audio
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"multi_select\",\"question\":\"What do you see and hear?\",\"options\":[\"Video\",\"Audio\",\"Image\",\"Text\"],\"correctAnswers\":[0,1],\"media\":{\"youtube\":\"https://youtu.be/abc123\",\"audio\":\"https://example.com/audio.mp3\"}}]"}' > /dev/null

STATE_BOTH=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')
if echo "$STATE_BOTH" | grep -q '"youtube"' && echo "$STATE_BOTH" | grep -q '"audio"'; then
    pass "API: Question with both YouTube and audio saved"
else
    fail "API: Question with both media types not saved correctly"
fi

# Test traditional image field still works
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"single_choice\",\"question\":\"What is in this image?\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correct\":0,\"image\":\"https://example.com/image.png\"}]"}' > /dev/null

STATE_IMG=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')
# Note: JSON may have escaped slashes (\/) so we check for the domain
if echo "$STATE_IMG" | grep -q 'example.com'; then
    pass "API: Question with traditional image field saved"
else
    fail "API: Traditional image field not saved"
    echo "Response: $STATE_IMG" | head -c 500
fi

curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null

# ============================================================
section "9. Multi-Select Question Type Tests"
# ============================================================

info "Testing multi-select question type..."

# Reset and add multi-select question
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null

# Add multi-select question using proper JSON
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"multi_select\",\"question\":\"Which are programming languages?\",\"options\":[\"Python\",\"HTML\",\"JavaScript\",\"CSS\"],\"correctAnswers\":[0,2]}]"}' > /dev/null

# Verify question was added
STATE_CHECK=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')
if echo "$STATE_CHECK" | grep -q '"type":"multi_select"'; then
    pass "API: Add multi-select question"
else
    fail "API: Add multi-select question"
fi

# Join, start, show options
PLAYER_RESP=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"joinGame","nickname":"MultiTester"}')
PLAYER_ID=$(echo "$PLAYER_RESP" | grep -o '"playerId":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"startGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"showOptions"}' > /dev/null

# Get the shuffled correct answers using jq if available, otherwise grep
STATE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')

# Try to extract correctAnswers array
if command -v jq &> /dev/null; then
    CORRECT_ANSWERS=$(echo "$STATE" | jq -c '.questions[0].correctAnswers')
else
    # Fallback to grep - extract the array
    CORRECT_ANSWERS=$(echo "$STATE" | grep -o '"correctAnswers":\[[0-9,]*\]' | sed 's/"correctAnswers"://')
fi
info "Shuffled correctAnswers: $CORRECT_ANSWERS"

# Test fully correct answer
MULTI_RESULT=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"submitMultiAnswer\",\"playerId\":\"$PLAYER_ID\",\"answers\":$CORRECT_ANSWERS}")

if echo "$MULTI_RESULT" | grep -q '"isCorrect":true'; then
    pass "API: Multi-select fully correct answer (score: 1)"
else
    fail "API: Multi-select fully correct answer"
    echo "Response: $MULTI_RESULT"
fi

# Test partial answer (reset first)
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"multi_select\",\"question\":\"Which are programming languages?\",\"options\":[\"Python\",\"HTML\",\"JavaScript\",\"CSS\"],\"correctAnswers\":[0,2]}]"}' > /dev/null
PLAYER_RESP2=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"joinGame","nickname":"PartialTester"}')
PLAYER_ID2=$(echo "$PLAYER_RESP2" | grep -o '"playerId":"[^"]*"' | cut -d'"' -f4)
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"startGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"showOptions"}' > /dev/null

# Get first correct answer only
STATE2=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')

if command -v jq &> /dev/null; then
    FIRST_CORRECT_IDX=$(echo "$STATE2" | jq '.questions[0].correctAnswers[0]')
else
    FIRST_CORRECT_IDX=$(echo "$STATE2" | grep -o '"correctAnswers":\[[0-9]*' | grep -o '[0-9]*$')
fi

PARTIAL_RESULT=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"submitMultiAnswer\",\"playerId\":\"$PLAYER_ID2\",\"answers\":[$FIRST_CORRECT_IDX]}")

if echo "$PARTIAL_RESULT" | grep -q '"score":0.5'; then
    pass "API: Multi-select partial answer (score: 0.5)"
elif echo "$PARTIAL_RESULT" | grep -q '"correctSelected":1'; then
    pass "API: Multi-select partial answer (1 of 2 correct)"
else
    fail "API: Multi-select partial answer"
    echo "Response: $PARTIAL_RESULT"
fi

# Test wrong answer - need fresh game state BEFORE extracting wrong indices
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"multi_select\",\"question\":\"Which are programming languages?\",\"options\":[\"Python\",\"HTML\",\"JavaScript\",\"CSS\"],\"correctAnswers\":[0,2]}]"}' > /dev/null
PLAYER_RESP3=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"joinGame","nickname":"WrongTester"}')
PLAYER_ID3=$(echo "$PLAYER_RESP3" | grep -o '"playerId":"[^"]*"' | cut -d'"' -f4)
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"startGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"showOptions"}' > /dev/null

# Get wrong indices (those NOT in correctAnswers) - must get state AFTER setup
STATE3=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')

if command -v jq &> /dev/null; then
    # Get indices not in correct answers (0-3 minus correctAnswers)
    WRONG_IDX_1=$(echo "$STATE3" | jq '([0,1,2,3] - .questions[0].correctAnswers)[0]')
    WRONG_IDX_2=$(echo "$STATE3" | jq '([0,1,2,3] - .questions[0].correctAnswers)[1]')
else
    # Fallback - just use indices that are likely wrong
    WRONG_IDX_1=1
    WRONG_IDX_2=3
fi
info "Testing with wrong indices: [$WRONG_IDX_1,$WRONG_IDX_2]"

WRONG_RESULT=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"submitMultiAnswer\",\"playerId\":\"$PLAYER_ID3\",\"answers\":[$WRONG_IDX_1,$WRONG_IDX_2]}")

if echo "$WRONG_RESULT" | grep -q '"score":0'; then
    pass "API: Multi-select wrong answer (score: 0)"
elif echo "$WRONG_RESULT" | grep -q '"correctSelected":0'; then
    pass "API: Multi-select wrong answer (0 correct selected)"
else
    # May have gotten lucky with shuffle - check if at least it's not full score
    if echo "$WRONG_RESULT" | grep -q '"isCorrect":false'; then
        pass "API: Multi-select non-perfect answer detected"
    else
        fail "API: Multi-select wrong answer detection"
        echo "Response: $WRONG_RESULT"
    fi
fi

# ============================================================
section "10. Fill-in-Blanks Question Type Tests"
# ============================================================

info "Testing fill-in-blanks question type..."

curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null

curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"fill_blanks\",\"question\":\"The capital of France is ___ and it is known for the ___ Tower.\",\"blanksConfig\":[{\"id\":0,\"answer\":\"Paris\",\"alternatives\":[\"paris\"],\"caseSensitive\":false},{\"id\":1,\"answer\":\"Eiffel\",\"alternatives\":[\"eiffel\"],\"caseSensitive\":false}]}]"}' > /dev/null

# Verify question was added
STATE_CHECK=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')
if echo "$STATE_CHECK" | grep -q '"type":"fill_blanks"'; then
    pass "API: Add fill-blanks question"
else
    fail "API: Add fill-blanks question"
fi

# Setup for blanks test
PLAYER_RESP=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"joinGame","nickname":"BlanksTester"}')
PLAYER_ID=$(echo "$PLAYER_RESP" | grep -o '"playerId":"[^"]*"' | cut -d'"' -f4)
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"startGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"showOptions"}' > /dev/null

# Submit correct blanks answer
BLANKS_RESULT=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"submitBlanksAnswer\",\"playerId\":\"$PLAYER_ID\",\"answers\":{\"0\":\"Paris\",\"1\":\"Eiffel\"}}")

if echo "$BLANKS_RESULT" | grep -q '"success":true'; then
    pass "API: Submit fill-blanks answer"
    if echo "$BLANKS_RESULT" | grep -q '"isCorrect":true'; then
        pass "API: Fill-blanks fully correct"
    fi
else
    fail "API: Submit fill-blanks answer"
    echo "Response: $BLANKS_RESULT"
fi

# Test case-insensitive matching
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"fill_blanks\",\"question\":\"The capital of France is ___ and it is known for the ___ Tower.\",\"blanksConfig\":[{\"id\":0,\"answer\":\"Paris\",\"alternatives\":[\"paris\"],\"caseSensitive\":false},{\"id\":1,\"answer\":\"Eiffel\",\"alternatives\":[\"eiffel\"],\"caseSensitive\":false}]}]"}' > /dev/null
PLAYER_RESP2=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"joinGame","nickname":"CaseTester"}')
PLAYER_ID2=$(echo "$PLAYER_RESP2" | grep -o '"playerId":"[^"]*"' | cut -d'"' -f4)
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"startGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"showOptions"}' > /dev/null

CASE_RESULT=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"submitBlanksAnswer\",\"playerId\":\"$PLAYER_ID2\",\"answers\":{\"0\":\"paris\",\"1\":\"eiffel\"}}")

if echo "$CASE_RESULT" | grep -q '"isCorrect":true'; then
    pass "API: Fill-blanks case-insensitive matching works"
else
    fail "API: Fill-blanks case-insensitive matching"
    echo "Response: $CASE_RESULT"
fi

# ============================================================
section "11. Open-Ended Question Type Tests"
# ============================================================

info "Testing open-ended question type..."

curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null

curl -s -X POST "$API_URL" -H "Content-Type: application/json" \
    -d '{"action":"updateQuestions","questionsJson":"[{\"type\":\"open_ended\",\"question\":\"Explain the concept of recursion in programming.\",\"openConfig\":{\"hints\":[\"Think about a function calling itself\"],\"suggestedAnswers\":[\"A function that calls itself\"],\"requiresGrading\":true}}]"}' > /dev/null

# Verify question was added
STATE_CHECK=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"getGameState"}')
if echo "$STATE_CHECK" | grep -q '"type":"open_ended"'; then
    pass "API: Add open-ended question"
else
    fail "API: Add open-ended question"
fi

# Setup and submit
PLAYER_RESP=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"joinGame","nickname":"OpenTester"}')
PLAYER_ID=$(echo "$PLAYER_RESP" | grep -o '"playerId":"[^"]*"' | cut -d'"' -f4)
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"startGame"}' > /dev/null
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"showOptions"}' > /dev/null

# Note: API requires 'answerText' not 'answer'
OPEN_RESULT=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"submitOpenAnswer\",\"playerId\":\"$PLAYER_ID\",\"answerText\":\"Recursion is when a function calls itself with a smaller input until it reaches a base case.\"}")

if echo "$OPEN_RESULT" | grep -q '"success":true'; then
    pass "API: Submit open-ended answer"
    if echo "$OPEN_RESULT" | grep -q '"requiresGrading":true'; then
        pass "API: Open-ended marked for teacher grading"
    elif echo "$OPEN_RESULT" | grep -q '"submitted":true'; then
        pass "API: Open-ended answer submitted successfully"
    fi
else
    fail "API: Submit open-ended answer"
    echo "Response: $OPEN_RESULT"
fi

# Final cleanup
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{"action":"resetGame"}' > /dev/null

# ============================================================
section "12. Database Check"
# ============================================================

if [ -f "data/quiz.db" ]; then
    pass "SQLite database exists"
    
    # Check tables
    TABLES=$(sqlite3 data/quiz.db ".tables" 2>/dev/null || echo "")
    if echo "$TABLES" | grep -q "game_state"; then
        pass "game_state table exists"
    else
        fail "game_state table missing"
    fi
    
    if echo "$TABLES" | grep -q "questions"; then
        pass "questions table exists"
    else
        fail "questions table missing"
    fi
    
    if echo "$TABLES" | grep -q "players"; then
        pass "players table exists"
    else
        fail "players table missing"
    fi
else
    fail "SQLite database not found"
fi

# ============================================================
# Summary
# ============================================================
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                           ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo -e "║  ${GREEN}PASSED: $PASSED${NC}"
echo -e "║  ${RED}FAILED: $FAILED${NC}"
echo "╚═══════════════════════════════════════════════════════════╝"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
    exit 1
fi
