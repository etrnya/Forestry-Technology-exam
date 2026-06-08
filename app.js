/* app.js - Forestry Technology Exam Study Portal Logic */

// Global State
let currentSubject = 'all';
let selectedQuestionId = null;
let currentQuestions = [];
let userDrafts = {}; // Store text drafts by question ID in memory (backup of LocalStorage)

// UI Elements
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const subjectBtns = document.querySelectorAll('#subject-list .nav-btn');
const searchInput = document.getElementById('search-input');
const yearFilter = document.getElementById('year-filter');
const levelFilter = document.getElementById('level-filter');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const totalFilteredCount = document.getElementById('total-filtered-count');
const questionsContainer = document.getElementById('questions-list-container');
const workspacePanel = document.getElementById('workspace-panel');
const emptyState = document.getElementById('empty-state');
const detailScrollArea = document.getElementById('detail-scroll-area');

// Detail Elements
const detailYear = document.getElementById('detail-year');
const detailLevel = document.getElementById('detail-level');
const detailSubject = document.getElementById('detail-subject');
const detailDifficulty = document.getElementById('detail-difficulty');
const detailQuestionContent = document.getElementById('detail-question-content');
const detailTagsContainer = document.getElementById('detail-tags-container');
const detailHintsList = document.getElementById('detail-hints-list');
const outlineTextarea = document.getElementById('outline-textarea');
const wordCountEl = document.getElementById('word-count');
const saveStatus = document.getElementById('save-status');

// Button Elements
const btnAiEvaluate = document.getElementById('btn-ai-evaluate');
const btnToggleRef = document.getElementById('btn-toggle-ref');
const btnResetOutline = document.getElementById('btn-reset-outline');

// Panels
const refAnswerPanel = document.getElementById('ref-answer-panel');
const evaluationResultPanel = document.getElementById('evaluation-result-panel');
const refKeyConcepts = document.getElementById('ref-key-concepts');
const refStandardOutline = document.getElementById('ref-standard-outline');

// Loader
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Settings Modal Elements
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const apiEngineSelect = document.getElementById('api-engine-select');
const apiKeyInput = document.getElementById('api-key-input');
const btnTestApi = document.getElementById('btn-test-api');
const btnSaveSettings = document.getElementById('btn-save-settings');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// 手機版 Backdrop 元素
let mobileBackdrop;

function initApp() {
    // 建立手機版遮罩
    mobileBackdrop = document.createElement('div');
    mobileBackdrop.className = 'sidebar-backdrop';
    document.body.appendChild(mobileBackdrop);

    // 載入既有草稿與設定
    loadUserDrafts();
    loadSettings();
    initTheme();

    // 事件監聽器綁定
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // 手機版漢堡選單事件
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            mobileBackdrop.classList.add('show');
        });
    }

    // 點選遮罩關閉側邊欄
    mobileBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileBackdrop.classList.remove('show');
    });

    // 手機版返回按鈕
    const mobileBackBtn = document.getElementById('mobile-back-btn');
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', () => {
            document.body.classList.remove('show-detail');
            selectedQuestionId = null;
            document.querySelectorAll('.question-item').forEach(item => item.classList.remove('active'));
        });
    }
    
    subjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            subjectBtns.forEach(b => b.classList.remove('active'));
            const button = e.currentTarget;
            button.classList.add('active');
            currentSubject = button.getAttribute('data-subject');
            renderQuestions();

            // 手機上點選科目後自動關閉抽屜
            sidebar.classList.remove('open');
            mobileBackdrop.classList.remove('show');
        });
    });

    searchInput.addEventListener('input', debounce(renderQuestions, 300));
    yearFilter.addEventListener('change', renderQuestions);
    levelFilter.addEventListener('change', renderQuestions);
    themeToggleBtn.addEventListener('click', toggleTheme);

    // 擬答區域事件
    outlineTextarea.addEventListener('input', handleOutlineInput);
    btnResetOutline.addEventListener('click', resetOutline);
    btnToggleRef.addEventListener('click', toggleRefAnswer);
    btnAiEvaluate.addEventListener('click', handleAiEvaluation);

    // 即時解題與複製提示詞事件
    const btnSolveLive = document.getElementById('btn-solve-live');
    if (btnSolveLive) btnSolveLive.addEventListener('click', handleLiveAiSolve);
    
    const btnClearAiCache = document.getElementById('btn-clear-ai-cache');
    if (btnClearAiCache) btnClearAiCache.addEventListener('click', handleClearLiveAiCache);
    
    const btnCopyPrompt = document.getElementById('btn-copy-prompt');
    if (btnCopyPrompt) btnCopyPrompt.addEventListener('click', handleCopyPrompt);

    const btnCopyAiAnswer = document.getElementById('btn-copy-ai-answer');
    if (btnCopyAiAnswer) btnCopyAiAnswer.addEventListener('click', handleCopyAiAnswer);

    const btnDownloadAiAnswer = document.getElementById('btn-download-ai-answer');
    if (btnDownloadAiAnswer) btnDownloadAiAnswer.addEventListener('click', handleDownloadAiAnswer);

    // 設定視窗事件
    openSettingsBtn.addEventListener('click', () => settingsModal.classList.add('show'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('show'));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('show');
    });
    btnSaveSettings.addEventListener('click', saveSettings);
    btnTestApi.addEventListener('click', testApiConnection);

    // 載入資料庫資料並進行渲染
    updateSubjectBadgeCounts();
    renderQuestions();
}

// Sidebar logic
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    const icon = sidebarToggle.querySelector('i');
    if (sidebar.classList.contains('collapsed')) {
        icon.className = 'fa-solid fa-chevron-right';
    } else {
        icon.className = 'fa-solid fa-chevron-left';
    }
}

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// Load and Save settings
function loadSettings() {
    const engine = localStorage.getItem('api_engine') || 'deepseek';
    const key = localStorage.getItem('api_key') || '';
    
    apiEngineSelect.value = engine;
    apiKeyInput.value = key;
}

function saveSettings() {
    const engine = apiEngineSelect.value;
    const key = apiKeyInput.value.trim();
    
    localStorage.setItem('api_engine', engine);
    localStorage.setItem('api_key', key);
    
    showToast('設定已安全儲存！', 'success');
    settingsModal.classList.remove('show');
}

// Local Storage for User Drafts
function loadUserDrafts() {
    const stored = localStorage.getItem('forestry_exam_drafts');
    if (stored) {
        try {
            userDrafts = JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored drafts:', e);
            userDrafts = {};
        }
    }
}

function saveDraft(questionId, content) {
    userDrafts[questionId] = content;
    localStorage.setItem('forestry_exam_drafts', JSON.stringify(userDrafts));
    
    // 顯示「已自動儲存」狀態
    saveStatus.classList.add('show');
    setTimeout(() => {
        saveStatus.classList.remove('show');
    }, 2000);

    // 同步更新列表中卡片的狀態
    updateQuestionCardStatus(questionId, content);
}

function updateQuestionCardStatus(questionId, content) {
    const card = document.querySelector(`.question-item[data-id="${questionId}"]`);
    if (card) {
        const badge = card.querySelector('.item-status-badge');
        if (badge) {
            // 檢查是否進行過 AI 評估或 AI 即時解題
            const evalKey = `eval_result_${questionId}`;
            const hasEval = localStorage.getItem(evalKey);
            const liveAiKey = `live_ai_answer_${questionId}`;
            const hasLiveAi = localStorage.getItem(liveAiKey);

            if (hasLiveAi || hasEval) {
                badge.className = 'item-status-badge status-completed';
                badge.innerText = '已AI解題';
            } else if (content.trim().length > 10) {
                badge.className = 'item-status-badge status-draft';
                badge.innerText = '已擬答草稿';
            } else {
                badge.className = 'item-status-badge status-pending';
                badge.innerText = '未作答';
            }
        }
    }
}

// Calculate subject counts
function updateSubjectBadgeCounts() {
    if (typeof questions_db === 'undefined') return;

    const counts = {
        all: questions_db.length,
        'forest-ecology': 0,
        'silviculture': 0,
        'forest-management': 0,
        'forest-products': 0,
        'ecology-management': 0
    };

    questions_db.forEach(q => {
        if (counts[q.subject_code] !== undefined) {
            counts[q.subject_code]++;
        }
    });

    Object.keys(counts).forEach(key => {
        const badge = document.getElementById(`count-${key}`);
        if (badge) {
            badge.innerText = counts[key];
        }
    });
}

// Render questions list
function renderQuestions() {
    if (typeof questions_db === 'undefined') {
        questionsContainer.innerHTML = '<div style="color: var(--error); padding: 1rem;">[錯誤] 無法讀取 questions_db.js</div>';
        return;
    }

    const searchQuery = searchInput.value.toLowerCase().trim();
    const selectedYear = yearFilter.value;
    const selectedLevel = levelFilter.value;

    // Filter array
    currentQuestions = questions_db.filter(q => {
        // 科目篩選
        if (currentSubject !== 'all' && q.subject_code !== currentSubject) return false;
        
        // 年份篩選
        if (selectedYear !== 'all' && q.year.toString() !== selectedYear) return false;
        
        // 等級篩選
        if (selectedLevel !== 'all') {
            const isHigh = q.category.includes('高考') || q.category.includes('三等');
            if (selectedLevel === 'high' && !isHigh) return false;
            if (selectedLevel === 'normal' && isHigh) return false;
        }

        // 關鍵字搜尋
        if (searchQuery) {
            const inQuestion = q.question.toLowerCase().includes(searchQuery);
            const inTags = q.tags.some(tag => tag.toLowerCase().includes(searchQuery));
            const inSubject = q.subject.toLowerCase().includes(searchQuery);
            if (!inQuestion && !inTags && !inSubject) return false;
        }

        return true;
    });

    // Update count UI
    totalFilteredCount.innerText = currentQuestions.length;

    // Render HTML
    if (currentQuestions.length === 0) {
        questionsContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem; font-size: 0.9rem;">沒有符合篩選條件的題目</div>';
        return;
    }

    questionsContainer.innerHTML = currentQuestions.map(q => {
        const isSelected = q.id === selectedQuestionId ? 'active' : '';
        
        // 判斷草稿狀態
        const draftContent = userDrafts[q.id] || '';
        const evalKey = `eval_result_${q.id}`;
        const hasEval = localStorage.getItem(evalKey);
        const liveAiKey = `live_ai_answer_${q.id}`;
        const hasLiveAi = localStorage.getItem(liveAiKey);

        let statusClass = 'status-pending';
        let statusText = '未作答';
        if (hasLiveAi || hasEval) {
            statusClass = 'status-completed';
            statusText = '已AI解題';
        } else if (draftContent.trim().length > 10) {
            statusClass = 'status-draft';
            statusText = '已擬答草稿';
        }

        let diffClass = 'diff-medium';
        if (q.difficulty === '易') diffClass = 'diff-easy';
        if (q.difficulty === '難') diffClass = 'diff-hard';

        return `
            <div class="question-item ${isSelected}" data-id="${q.id}" onclick="selectQuestion('${q.id}')">
                <div class="item-meta">
                    <span class="item-year-tag">${q.year}年 / ${q.category.replace('三級', '')}</span>
                    <span class="item-difficulty ${diffClass}">${q.difficulty}</span>
                </div>
                <div class="item-title">${q.q_num}、${q.question}</div>
                <div class="item-footer">
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${q.subject}</span>
                    <span class="item-status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Select a question and display detail
function selectQuestion(questionId) {
    selectedQuestionId = questionId;
    
    // 更新清單中的 active 狀態
    const items = document.querySelectorAll('.question-item');
    items.forEach(item => {
        if (item.getAttribute('data-id') === questionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    const question = questions_db.find(q => q.id === questionId);
    if (!question) return;

    // 隱藏 Empty State, 顯示 Workspace
    emptyState.style.display = 'none';
    detailScrollArea.style.display = 'flex';

    // 填充細節資訊
    detailYear.innerText = `${question.year}年`;
    detailLevel.innerText = question.category;
    detailSubject.innerText = question.subject;
    detailDifficulty.innerText = `難度：${question.difficulty}`;
    
    let diffClass = 'diff-medium';
    if (question.difficulty === '易') diffClass = 'diff-easy';
    if (question.difficulty === '難') diffClass = 'diff-hard';
    detailDifficulty.className = `item-difficulty ${diffClass}`;

    detailQuestionContent.innerText = `${question.q_num}、${question.question}`;
    
    // 渲染 tags
    detailTagsContainer.innerHTML = question.tags.map(tag => `<span class="keyword-tag"><i class="fa-solid fa-tag" style="margin-right: 0.25rem;"></i>${tag}</span>`).join('');

    // 渲染 AI hints
    if (question.ai_hints && question.ai_hints.length > 0) {
        detailHintsList.innerHTML = question.ai_hints.map(hint => `<li>${hint}</li>`).join('');
    } else {
        detailHintsList.innerHTML = '<li>無可用思考大綱，請直接在大綱區開始練習。</li>';
    }

    // 載入該題目的草稿
    const draft = userDrafts[questionId] || '';
    outlineTextarea.value = draft;
    wordCountEl.innerText = draft.length;

    // 收合參考答案，清除既有評估面板
    refAnswerPanel.classList.remove('show');
    btnToggleRef.innerHTML = '<i class="fa-solid fa-eye"></i> 顯示參考解答與核心概念';
    
    // 載入該題的既有評估結果（如果有）
    loadSavedEvaluation(questionId);

    // 載入該題的即時解題快取（如果有）
    loadLiveAiAnswerCache(questionId);

    // 更新提示詞預覽文字
    const previewEl = document.getElementById('prompt-preview-text');
    if (previewEl) {
        previewEl.innerText = `請幫我解答「${question.year}年${question.category} - ${question.subject}第${question.q_num}題...」`;
    }

    // 手機尺寸下，選取題目後切換至詳細畫面
    if (window.innerWidth <= 768) {
        document.body.classList.add('show-detail');
    }

    // 滾動回到頂部
    detailScrollArea.scrollTop = 0;
}

// User inputs outline
function handleOutlineInput(e) {
    if (!selectedQuestionId) return;
    const content = e.target.value;
    wordCountEl.innerText = content.length;
    saveDraft(selectedQuestionId, content);
}

// Reset textarea outline
function resetOutline() {
    if (!selectedQuestionId) return;
    if (confirm('確定要清除目前的擬答草稿嗎？此動作無法復原。')) {
        outlineTextarea.value = '';
        wordCountEl.innerText = 0;
        saveDraft(selectedQuestionId, '');
        
        // 同時清除評估結果
        const evalKey = `eval_result_${selectedQuestionId}`;
        localStorage.removeItem(evalKey);
        evaluationResultPanel.classList.remove('show');
        
        updateQuestionCardStatus(selectedQuestionId, '');
    }
}

// Toggle reference answer
function toggleRefAnswer() {
    console.log('[toggleRefAnswer] Clicked. selectedQuestionId =', selectedQuestionId);
    if (!selectedQuestionId) {
        console.warn('[toggleRefAnswer] No question selected. Returning.');
        return;
    }

    console.log('[toggleRefAnswer] refAnswerPanel classes before toggle:', refAnswerPanel.className);
    if (refAnswerPanel.classList.contains('show')) {
        refAnswerPanel.classList.remove('show');
        btnToggleRef.innerHTML = '<i class="fa-solid fa-eye"></i> 顯示參考解答與核心概念';
        console.log('[toggleRefAnswer] Hiding panel.');
    } else {
        // 載入參考答案
        console.log('[toggleRefAnswer] Showing panel and loading data...');
        loadReferenceAnswerData(selectedQuestionId);
        refAnswerPanel.classList.add('show');
        btnToggleRef.innerHTML = '<i class="fa-solid fa-eye-slash"></i> 隱藏參考解答';
        
        // 滾動到參考答案位置
        setTimeout(() => {
            console.log('[toggleRefAnswer] Scrolling to panel.');
            refAnswerPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Render reference answer details
function loadReferenceAnswerData(questionId) {
    console.log('[loadReferenceAnswerData] Loading data for', questionId);
    if (typeof answers_db === 'undefined') {
        console.error('[loadReferenceAnswerData] answers_db is undefined!');
        refKeyConcepts.innerHTML = '<div style="color: var(--error);">[錯誤] 無法讀取 answers_db.js</div>';
        return;
    }

    const answer = answers_db[questionId];
    console.log('[loadReferenceAnswerData] Found answer object:', answer);
    if (!answer) {
        refKeyConcepts.innerHTML = '<div style="color: var(--text-secondary);">本題暫無預存核心關鍵名詞。</div>';
        refStandardOutline.innerHTML = '<p style="color: var(--text-secondary);">本題暫無預存參考答題大綱。</p>';
        return;
    }

    // 核心名詞
    if (answer.key_concepts && answer.key_concepts.length > 0) {
        refKeyConcepts.innerHTML = answer.key_concepts.map(concept => `<span class="coverage-tag covered"><i class="fa-solid fa-bookmark" style="margin-right: 0.25rem;"></i>${concept}</span>`).join('');
    } else {
        refKeyConcepts.innerHTML = '<span style="color: var(--text-secondary);">未設定核心名詞。</span>';
    }

    // 標準大綱
    if (answer.standard_outline && answer.standard_outline.length > 0) {
        refStandardOutline.innerHTML = answer.standard_outline.map(line => `<p style="margin-bottom: 0.5rem; text-indent: -1.5rem; padding-left: 1.5rem;">${line}</p>`).join('');
    } else {
        refStandardOutline.innerHTML = '<p style="color: var(--text-secondary);">無可用標準參考大綱。</p>';
    }
}

// Load saved evaluation if present
function loadSavedEvaluation(questionId) {
    const evalKey = `eval_result_${questionId}`;
    const stored = localStorage.getItem(evalKey);
    if (stored) {
        try {
            const result = JSON.parse(stored);
            displayEvaluationResult(result);
        } catch (e) {
            console.error('Error loading saved evaluation:', e);
            evaluationResultPanel.classList.remove('show');
        }
    } else {
        evaluationResultPanel.classList.remove('show');
    }
}

// AI Evaluation Logic
async function handleAiEvaluation() {
    console.log('[AI解題] 按鈕點擊，selectedQuestionId =', selectedQuestionId);

    if (!selectedQuestionId) {
        showToast('請先在左側題目列表中選擇一道申論題！', 'warning');
        return;
    }
    
    const userOutline = outlineTextarea.value.trim();
    console.log('[AI解題] 擬答內容長度 =', userOutline.length);
    if (!userOutline) {
        showToast('請先輸入您的答題大綱 / 擬答草稿，再進行 AI 解題！', 'warning');
        return;
    }

    const apiKey = localStorage.getItem('api_key') || '';
    const engine = localStorage.getItem('api_engine') || 'deepseek';
    console.log('[AI解題] API Engine =', engine, '| API Key 長度 =', apiKey.length);
    if (!apiKey) {
        showToast('請先設定您的 AI API 金鑰 (API Key)！', 'warning');
        settingsModal.classList.add('show');
        return;
    }

    // 準備考題資訊與參考解答
    const questionObj = questions_db.find(q => q.id === selectedQuestionId);
    const answerObj = answers_db[selectedQuestionId] || { key_concepts: [], standard_outline: [] };

    // 按鈕 Loading 狀態
    const originalBtnHTML = btnAiEvaluate.innerHTML;
    btnAiEvaluate.disabled = true;
    btnAiEvaluate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> AI 解題中...`;

    // 顯示 Loading Overlay
    loadingText.innerText = '正在連結 AI 解題引擎進行分析...';
    loadingOverlay.classList.add('show');

    try {
        console.log('[AI解題] 開始呼叫 API，engine =', engine);
        const evaluation = await callAiApi(engine, apiKey, questionObj, answerObj, userOutline);
        console.log('[AI解題] API 回傳成功，evaluation =', evaluation);
        
        // 儲存評估結果
        const evalKey = `eval_result_${selectedQuestionId}`;
        localStorage.setItem(evalKey, JSON.stringify(evaluation));
        
        // 顯示結果
        displayEvaluationResult(evaluation);
        
        // 更新左側卡片狀態
        updateQuestionCardStatus(selectedQuestionId, userOutline);
        
        showToast('AI 解題完成！', 'success');

        // 滾動到評估面板
        setTimeout(() => {
            evaluationResultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 200);

    } catch (error) {
        console.error('[AI解題] API 錯誤:', error);
        showToast(`解題失敗: ${error.message}`, 'error');
    } finally {
        loadingOverlay.classList.remove('show');
        btnAiEvaluate.disabled = false;
        btnAiEvaluate.innerHTML = originalBtnHTML;
    }
}

// Display AI evaluation onto UI elements
function displayEvaluationResult(result) {
    evaluationResultPanel.classList.add('show');

    // 評分與條形圖
    const gradeEl = document.getElementById('eval-grade');
    gradeEl.innerText = result.grade || 'C';
    gradeEl.className = `eval-grade-badge grade-${(result.grade || 'C').toLowerCase()}`;

    // 核心概念比例
    const conceptPct = result.concept_coverage_percentage || 0;
    document.getElementById('eval-concept-pct').innerText = `${conceptPct}%`;
    
    const totalConcepts = result.covered_concepts.length + (result.missing_concepts || []).length;
    document.getElementById('eval-concept-count').innerText = `${result.covered_concepts.length}/${totalConcepts} 個`;
    document.getElementById('eval-concept-bar').style.width = `${conceptPct}%`;

    // 結構分數
    const structScore = result.structure_score || 0;
    document.getElementById('eval-structure-score').innerText = structScore;
    document.getElementById('eval-structure-bar').style.width = `${structScore}%`;

    // 概念清單比對標記
    const keywordsStatusEl = document.getElementById('eval-keywords-status');
    let keywordsHtml = '';
    
    result.covered_concepts.forEach(concept => {
        keywordsHtml += `<span class="coverage-tag covered"><i class="fa-solid fa-circle-check" style="margin-right: 0.25rem;"></i>${concept} (涵蓋)</span>`;
    });
    
    if (result.missing_concepts && result.missing_concepts.length > 0) {
        result.missing_concepts.forEach(concept => {
            keywordsHtml += `<span class="coverage-tag missing"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 0.25rem;"></i>${concept} (遺漏)</span>`;
        });
    }

    if (!keywordsHtml) keywordsHtml = '<span style="color: var(--text-secondary);">本題無核心評分概念對照。</span>';
    keywordsStatusEl.innerHTML = keywordsHtml;

    // 詳細評語 (使用 Marked 解析 Markdown 字串)
    document.getElementById('eval-strengths').innerHTML = marked.parse(result.strengths || '');
    document.getElementById('eval-weaknesses').innerHTML = marked.parse(result.weaknesses || '');
    document.getElementById('eval-suggestions').innerHTML = marked.parse(result.suggestions || '');
}

// Real API call logic
async function callAiApi(engine, apiKey, questionObj, answerObj, userOutline) {
    const systemPrompt = `你是一位台灣林業技術高普考的評卷委員，專精於森林生態學、育林學、森林經營學與林產學。請以嚴格、客觀的態度評估考生的申論題作答大綱。你必須以繁體中文回答，並且回傳一個符合規定格式的 JSON 物件。`;

    const userPrompt = `
請評估以下林業技術考生針對以下題目的答題大綱：

【申論考科】
${questionObj.subject} (${questionObj.category})

【申論題目】
${questionObj.q_num}、${questionObj.question}

【官方評分核心學科名詞（必須涵蓋或涉及其核心概念，如有提及應在答案中分析）】
${(answerObj.key_concepts || []).join(", ") || "無特定預設名詞"}

【參考答題架構與大綱】
${(answerObj.standard_outline || []).join("\n") || "無特定預設架構"}

【考生的答題大綱 / 擬答草稿】
${userOutline}

---
請根據上述內容進行精準評卷，並「只」回傳一個 JSON 物件，格式必須完全符合以下結構（不要包含任何 markdown code block 標記如 \`\`\`json，只要純 JSON 字串）：
{
  "grade": "評等，如 S, A, B, C, D 之一",
  "concept_coverage_percentage": 0至100之間的整數,
  "structure_score": 0至100之間的整數,
  "covered_concepts": ["考生大綱中已涵蓋或提及的核心概念名詞A", "名詞B"],
  "missing_concepts": ["考生大綱中完全遺漏或描述錯誤的核心概念名詞C", "名詞D"],
  "strengths": "優點與亮點（請用條列式 Markdown 表示，例如: 1. ... \\n2. ...）",
  "weaknesses": "缺失與遺漏要點（請用條列式 Markdown 表示，例如: 1. ... \\n2. ...）",
  "suggestions": "具體修改與優化建議（請用條列式 Markdown 表示，例如: 1. ... \\n2. ...）"
}

重要規則：
1. grade: 只能是 S (90-100分), A (80-89分), B (70-79分), C (60-69分), D (60分以下) 之一。
2. covered_concepts / missing_concepts 的元素必須嚴格來自上方列出的【官方評分核心學科名詞】，切勿無中生有。
3. 如果使用者的大綱有提及該概念、或用同義詞清楚表達，請將其判定為 covered_concepts，其餘為 missing_concepts。
4. strengths, weaknesses, suggestions 請至少提供兩條詳細的條列式回饋，這對考生修正大綱非常有價值！
`;

    if (engine === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API 回傳錯誤 (${response.status})`);
        }

        const data = await response.json();
        const jsonStr = data.choices[0].message.content;
        return parseJsonResponse(jsonStr);

    } else if (engine.startsWith('gemini')) {
        const modelName = engine;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.3
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API 回傳錯誤 (${response.status})`);
        }

        const data = await response.json();
        const jsonStr = data.candidates[0].content.parts[0].text;
        return parseJsonResponse(jsonStr);
    }
}

// Clean JSON codeblock wrapper if LLM mistakenly includes it
function parseJsonResponse(jsonStr) {
    let cleanStr = jsonStr.trim();
    if (cleanStr.startsWith('```')) {
        cleanStr = cleanStr.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanStr);
}

// Test API Connection
async function testApiConnection() {
    const engine = apiEngineSelect.value;
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showToast('請先輸入 API 金鑰！', 'warning');
        return;
    }

    btnTestApi.disabled = true;
    btnTestApi.innerText = '連線測試中...';

    try {
        if (engine === 'deepseek') {
            const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: "Hello. Answer in 3 words." }],
                    max_tokens: 10
                })
            });
            if (res.ok) {
                showToast('DeepSeek 金鑰驗證成功！連線正常。', 'success');
            } else {
                throw new Error(`回傳狀態碼 ${res.status}`);
            }
        } else {
            const modelName = engine;
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hi" }] }],
                    generationConfig: { maxOutputTokens: 5 }
                })
            });
            if (res.ok) {
                showToast('Gemini 金鑰驗證成功！連線正常。', 'success');
            } else {
                throw new Error(`回傳狀態碼 ${res.status}`);
            }
        }
    } catch (e) {
        showToast(`連線失敗: ${e.message}。請確認金鑰是否正確及網路狀態。`, 'error');
    } finally {
        btnTestApi.disabled = false;
        btnTestApi.innerText = '測試連線';
    }
}

// Show Custom Toast Notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-circle-exclamation';
    if (type === 'error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 載入該題的即時解題快取
function loadLiveAiAnswerCache(questionId) {
    const cacheKey = `live_ai_answer_${questionId}`;
    const cached = localStorage.getItem(cacheKey);
    const box = document.getElementById('live-ai-response-box');
    const actions = document.getElementById('live-ai-actions');
    const warning = document.getElementById('ai-hallucination-warning');
    const indicator = document.getElementById('ai-cache-indicator');
    const btnSolveLive = document.getElementById('btn-solve-live');
    const btnClearCache = document.getElementById('btn-clear-ai-cache');

    if (cached) {
        box.style.display = 'block';
        box.innerHTML = marked.parse(cached);
        actions.style.display = 'flex';
        warning.style.display = 'flex';
        indicator.style.display = 'flex';
        indicator.querySelector('span').innerText = '✨ 已載入本機快取解答（不消耗 API 額度）';
        btnSolveLive.innerHTML = '<i class="fa-solid fa-robot"></i> 重新呼叫 AI 即時解題';
        btnClearCache.style.display = 'block';
    } else {
        box.style.display = 'none';
        box.innerHTML = '';
        actions.style.display = 'none';
        warning.style.display = 'none';
        indicator.style.display = 'none';
        btnSolveLive.innerHTML = '<i class="fa-solid fa-robot"></i> 呼叫 AI 即時解題';
        btnClearCache.style.display = 'none';
    }
}

// 清除即時解題快取
function handleClearLiveAiCache() {
    if (!selectedQuestionId) return;
    if (confirm('是否確定刪除此題的 AI 即時解題快取？此操作不可復原。')) {
        localStorage.removeItem(`live_ai_answer_${selectedQuestionId}`);
        showToast('快取已清除！', 'success');
        loadLiveAiAnswerCache(selectedQuestionId);
        
        // 同步更新列表中卡片的狀態
        const content = userDrafts[selectedQuestionId] || '';
        updateQuestionCardStatus(selectedQuestionId, content);
        renderQuestions();
    }
}

// 複製外部提問提示詞
function handleCopyPrompt() {
    if (!selectedQuestionId) return;
    const question = questions_db.find(q => q.id === selectedQuestionId);
    if (!question) return;

    const answer = answers_db[selectedQuestionId] || { key_concepts: [], standard_outline: [] };

    const promptText = `
你是一位林業技術領域的國家考試專家。請為我解答以下這道國家考試申論題目，並提供：
1. 核心考點與學術概念解析。
2. 結構化的精準滿分擬答（包含大項與標題如：一、(一)、1.，字數約 800 - 1200 字）。
3. 延伸常考的關聯知識與易錯陷阱。

【考題資訊】
年度與考試：${question.year}年 ${question.category}
考科科目：${question.subject}
核心評分學術名詞：${answer.key_concepts.join(', ') || '無特定'}
題目內容：
${question.q_num}、${question.question}
`;

    navigator.clipboard.writeText(promptText.trim()).then(() => {
        const btn = document.getElementById('btn-copy-prompt');
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        btn.style.color = 'var(--success)';
        showToast('提示詞與中繼資料已複製到剪貼簿！', 'success');
        setTimeout(() => {
            icon.className = 'fa-solid fa-copy';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        showToast('複製失敗：' + err.message, 'error');
    });
}

// 複製 AI 解答 Markdown
function handleCopyAiAnswer() {
    if (!selectedQuestionId) return;
    const cacheKey = `live_ai_answer_${selectedQuestionId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return;

    navigator.clipboard.writeText(cached).then(() => {
        const btn = document.getElementById('btn-copy-ai-answer');
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        btn.style.color = 'var(--success)';
        showToast('解答 Markdown 已複製到剪貼簿！', 'success');
        setTimeout(() => {
            icon.className = 'fa-solid fa-copy';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        showToast('複製失敗：' + err.message, 'error');
    });
}

// 下載 AI 解答 .md 檔案
function handleDownloadAiAnswer() {
    if (!selectedQuestionId) return;
    const cacheKey = `live_ai_answer_${selectedQuestionId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return;

    const question = questions_db.find(q => q.id === selectedQuestionId);
    if (!question) return;

    try {
        const blob = new Blob([cached], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${question.year}年_${question.category.replace('三級','')}_${question.subject}_第${question.q_num}題_AI解題.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Markdown 解答已下載！', 'success');
    } catch (e) {
        showToast('下載失敗：' + e.message, 'error');
    }
}

// AI 即時串流解題核心
async function handleLiveAiSolve() {
    if (!selectedQuestionId) return;

    const apiKey = localStorage.getItem('api_key') || '';
    if (!apiKey) {
        showToast('請先設定您的 AI API 金鑰 (API Key)！', 'warning');
        settingsModal.classList.add('show');
        return;
    }

    const engine = localStorage.getItem('api_engine') || 'deepseek';
    const questionObj = questions_db.find(q => q.id === selectedQuestionId);
    const answerObj = answers_db[selectedQuestionId] || { key_concepts: [], standard_outline: [] };

    const loader = document.getElementById('live-ai-loading');
    const box = document.getElementById('live-ai-response-box');
    const actions = document.getElementById('live-ai-actions');
    const warning = document.getElementById('ai-hallucination-warning');
    const indicator = document.getElementById('ai-cache-indicator');

    loader.style.display = 'flex';
    box.style.display = 'block';
    warning.style.display = 'flex';
    actions.style.display = 'none';
    indicator.style.display = 'none';
    box.innerHTML = '<p style="color: var(--text-secondary);">正在連接 AI 解題引擎，建立串流連線...</p>';

    // 滾動到解題盒子
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const callback = (text, isFinished, error) => {
        if (error) {
            loader.style.display = 'none';
            box.innerHTML = `<p style="color: var(--error);"><i class="fa-solid fa-triangle-exclamation"></i> 解題出錯: ${error}</p>`;
            return;
        }

        box.innerHTML = marked.parse(text);

        if (isFinished) {
            loader.style.display = 'none';
            localStorage.setItem(`live_ai_answer_${selectedQuestionId}`, text);
            actions.style.display = 'flex';
            
            // 顯示快取已儲存狀態
            indicator.style.display = 'flex';
            indicator.querySelector('span').innerText = '✨ 解答已自動保存至本機（下次開啟不消耗 API 額度）';
            
            // 更新狀態與按鈕
            loadLiveAiAnswerCache(selectedQuestionId);
            
            // 同步更新列表中卡片的狀態
            const content = outlineTextarea.value || '';
            updateQuestionCardStatus(selectedQuestionId, content);
            renderQuestions();
            
            showToast('AI 即時解題完成！', 'success');
        }
    };

    if (engine === 'deepseek') {
        callDeepSeekAPIStream(apiKey, questionObj, answerObj, callback);
    } else {
        const modelName = engine;
        callGeminiAPIStream(apiKey, modelName, questionObj, answerObj, callback);
    }
}

// Stream call for Gemini
async function callGeminiAPIStream(apiKey, model, q, a, callback) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;
    const promptText = `
你是一位林業技術國考評分官與輔導教練。請針對以下考題，提供一份可信度高、條理清晰且切合考點的解答：
1. 【考點分析】歸納本題的核心物理、生態或經營學理。
2. 【法規依據與公式】若涉及林業法規（如森林法、國有林林產物處分規則）或計算公式，請列出具體條文名稱與計算式。
3. 【滿分申論擬答卡】模擬考生最佳作答格式，大項層次分明（一、(一)、1.），字數約 800-1200 字，必須詳盡完整。
4. 【易錯避坑點】警告考生最常寫錯的關鍵語詞或學名、科名混淆。

【考題內容】
年度：${q.year}年
等級：${q.category}
考科：${q.subject}
題號：第${q.q_num}題
核心名詞：${a.key_concepts.join(', ') || '無特定'}
題目：
${q.question}
`;

    const payload = {
        contents: [{
            parts: [{ text: promptText }]
        }],
        generationConfig: {
            temperature: 0.3
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            callback(null, false, `API 請求失敗 (${response.status}): ${errText}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let accumulatedText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let inString = false;
            let escape = false;
            let braceCount = 0;
            let startIdx = -1;

            for (let i = 0; i < buffer.length; i++) {
                const char = buffer[i];
                if (inString) {
                    if (escape) {
                        escape = false;
                    } else if (char === '\\') {
                        escape = true;
                    } else if (char === '"') {
                        inString = false;
                    }
                } else {
                    if (char === '"') {
                        inString = true;
                    } else if (char === '{') {
                        if (braceCount === 0) startIdx = i;
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0 && startIdx !== -1) {
                            const jsonStr = buffer.substring(startIdx, i + 1);
                            try {
                                const parsed = JSON.parse(jsonStr);
                                if (parsed.candidates && parsed.candidates[0].content && parsed.candidates[0].content.parts[0].text) {
                                    accumulatedText += parsed.candidates[0].content.parts[0].text;
                                    callback(accumulatedText, false, null);
                                }
                            } catch (e) {
                                // ignore partial parsing errors
                            }
                            buffer = buffer.substring(i + 1);
                            i = -1;
                            startIdx = -1;
                        }
                    }
                }
            }
        }
        callback(accumulatedText, true, null);
    } catch (err) {
        callback(null, false, err.message);
    }
}

// Stream call for DeepSeek (SSE format)
async function callDeepSeekAPIStream(apiKey, q, a, callback) {
    const url = 'https://api.deepseek.com/v1/chat/completions';
    const promptText = `
你是一位林業技術國考評分官與輔導教練。請針對以下考題，提供一份可信度高、條理清晰且切合考點的解答：
1. 【考點分析】歸納本題的核心物理、生態或經營學理。
2. 【法規依據與公式】若涉及林業法規（如森林法、國有林林產物處分規則）或計算公式，請列出具體條文名稱與計算式。
3. 【滿分申論擬答卡】模擬考生最佳作答格式，大項層次分明（一、(一)、1.），字數約 800-1200 字，必須詳盡完整。
4. 【易錯避坑點】警告考生最常寫錯的關鍵語詞或學名、科名混淆。

【考題內容】
年度：${q.year}年
等級：${q.category}
考科：${q.subject}
題號：第${q.q_num}題
核心名詞：${a.key_concepts.join(', ') || '無特定'}
題目：
${q.question}
`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "You are a forestry tech exam expert providing detailed answers." },
                    { role: "user", content: promptText }
                ],
                stream: true,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            callback(null, false, `API 請求失敗 (${response.status}): ${errText}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let accumulatedText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep last incomplete line

            for (const line of lines) {
                const cleaned = line.trim();
                if (!cleaned) continue;
                if (cleaned.startsWith('data: ')) {
                    const dataStr = cleaned.slice(6);
                    if (dataStr === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(dataStr);
                        const chunk = parsed.choices[0]?.delta?.content || "";
                        accumulatedText += chunk;
                        callback(accumulatedText, false, null);
                    } catch (e) {
                        // ignore parsing error for incomplete chunks
                    }
                }
            }
        }
        callback(accumulatedText, true, null);
    } catch (err) {
        callback(null, false, err.message);
    }
}
