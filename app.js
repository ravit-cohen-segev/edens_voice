// Application State
const state = {
    voices: [],
    selectedVoiceName: localStorage.getItem('selectedVoiceName') || '',
    voiceSource: localStorage.getItem('voiceSource') || 'system', // 'system' or 'cloud'
    preferredGender: localStorage.getItem('preferredGender') || 'all', // 'all', 'female', 'male'
    rate: parseFloat(localStorage.getItem('speechRate')) || 1.0,
    pitch: parseFloat(localStorage.getItem('speechPitch')) || 1.0,
    volume: parseFloat(localStorage.getItem('speechVolume')) || 1.0,
    theme: localStorage.getItem('theme') || 'dark',
    instantSpeak: localStorage.getItem('instantSpeak') === 'true',
    customPhrases: JSON.parse(localStorage.getItem('customPhrases')) || [],
    history: JSON.parse(localStorage.getItem('speechHistory')) || [],
    categoryFilter: 'all',
    synth: window.speechSynthesis,
    activeUtterance: null,
    activeAudio: null, // For cloud fallback playback

    // Typo Corrector state
    vocabList: [],
    lastCorrectedTypo: '',
    ignoredTypos: new Set()
};

// Common Hebrew Words for Typo Corrector Dictionary
const commonHebrewWords = [
    "אני", "אתה", "את", "אנחנו", "הוא", "היא", "הם", "הן", "רוצה", "צריך", "צריכה", "עזרה", "איפה", "מתי", "למה", "איך", "כמה",
    "מה", "מי", "שלום", "תודה", "בבקשה", "סליחה", "בוקר", "ערב", "צהריים", "לילה", "טוב", "אור", "שירותים", "מים", "אוכל",
    "לחם", "לשתות", "לאכול", "לישון", "עייף", "חולה", "שמח", "עצוב", "קר", "חם", "כאן", "שם", "נכון", "לא", "כן", "אולי",
    "תביא", "תן", "תני", "לי", "לך", "לנו", "עם", "בלי", "על", "תחת", "בתוך", "הבית", "בית", "חדר", "רופא", "תרופה", "כאב",
    "כואב", "מרגיש", "בסדר", "מעולה", "גרוע", "קצת", "הרבה", "עוד", "מספיק", "כבר"
];

// Default AAC Phrases
const defaultPhrases = [
    { text: "שלום", label: "שלום", category: "social", icon: "fa-person-wave-command" },
    { text: "תודה רבה", label: "תודה רבה", category: "social", icon: "fa-heart" },
    { text: "בבקשה", label: "בבקשה", category: "social", icon: "fa-circle-right" },
    { text: "מה שלומך?", label: "מה שלומך?", category: "social", icon: "fa-circle-question" },
    { text: "בוקר טוב", label: "בוקר טוב", category: "social", icon: "fa-sun" },
    { text: "אני צריך עזרה", label: "עזרה", category: "needs", icon: "fa-handshake-angle" },
    { text: "אני רעב", label: "אני רעב", category: "needs", icon: "fa-utensils" },
    { text: "אני צמא", label: "אני צמא", category: "needs", icon: "fa-glass-water" },
    { text: "אני צריך ללכת לשירותים", label: "שירותים", category: "needs", icon: "fa-restroom" },
    { text: "אני עייף ורוצה לישון", label: "עייף / לישון", category: "needs", icon: "fa-bed" },
    { text: "כן", label: "כן", category: "general", icon: "fa-circle-check" },
    { text: "לא", label: "לא", category: "general", icon: "fa-circle-xmark" },
    { text: "מה אמרת?", label: "סליחה?", category: "general", icon: "fa-rotate-left" },
    { text: "אני מרגיש טוב", label: "שמח", category: "feelings", icon: "fa-face-smile" },
    { text: "משהו כואב לי", label: "כואב לי", category: "feelings", icon: "fa-face-sad-tear" },
    { text: "אני מרגיש לא טוב", label: "חולה", category: "feelings", icon: "fa-face-thermometer" }
];

// Document DOM Elements
const docElements = {
    speechText: document.getElementById('speech-text'),
    speakBtn: document.getElementById('speak-btn'),
    stopBtn: document.getElementById('stop-btn'),
    clearBtn: document.getElementById('clear-btn'),
    voiceSelect: document.getElementById('voice-select'),
    rateInput: document.getElementById('speech-rate'),
    rateVal: document.getElementById('rate-val'),
    pitchInput: document.getElementById('speech-pitch'),
    pitchVal: document.getElementById('pitch-val'),
    volumeInput: document.getElementById('speech-volume'),
    volumeVal: document.getElementById('volume-val'),
    charCounter: document.getElementById('char-counter'),
    instantSpeakCheck: document.getElementById('instant-speak-check'),
    visualizer: document.getElementById('visualizer'),
    themeToggle: document.getElementById('theme-toggle'),
    quickGrid: document.getElementById('quick-grid-container'),
    categoryTabs: document.getElementById('category-tabs-container'),
    historyContainer: document.getElementById('history-container'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    addPhraseToggle: document.getElementById('add-phrase-toggle'),
    customPhraseModal: document.getElementById('custom-phrase-modal'),
    customPhraseForm: document.getElementById('custom-phrase-form'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    customText: document.getElementById('custom-text'),
    customLabel: document.getElementById('custom-label'),
    customCategory: document.getElementById('custom-category'),

    voiceSourceRadios: document.getElementsByName('voice-source'),
    genderRadios: document.getElementsByName('preferred-gender'),
    systemVoiceSettings: document.getElementById('system-voice-settings'),
    helpToggleBtn: document.getElementById('help-toggle-btn'),
    helpContent: document.getElementById('help-content'),
    noHebrewWarning: document.getElementById('no-hebrew-warning'),

    // Typo elements
    suggestionBox: document.getElementById('suggestion-box'),
    suggestionChip: document.getElementById('suggestion-chip'),
    dismissSuggestion: document.getElementById('dismiss-suggestion')
};

// Initialize Application
function initialize() {
    // Theme setup
    document.body.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    // Sliders setup
    docElements.rateInput.value = state.rate;
    docElements.rateVal.textContent = state.rate.toFixed(1) + 'x';
    docElements.pitchInput.value = state.pitch;
    docElements.pitchVal.textContent = state.pitch.toFixed(1);
    docElements.volumeInput.value = state.volume;
    docElements.volumeVal.textContent = Math.round(state.volume * 100) + '%';

    // Checkbox setup
    docElements.instantSpeakCheck.checked = state.instantSpeak;

    // Set voice source initial state
    setRadioCheckedValue('voice-source', state.voiceSource);
    updateVoiceSourceUI();

    // Set preferred gender initial state
    setRadioCheckedValue('preferred-gender', state.preferredGender);

    // Load voices
    loadVoices();
    if (state.synth) {
        state.synth.onvoiceschanged = () => {
            loadVoices();
        };
    }

    // Render AAC board
    renderQuickBoard();

    // Render History
    renderHistory();

    // Build the Typo Corrector Dictionary
    rebuildVocabList();

    // Attach Event Listeners
    attachEventListeners();

    // Check query params if any
    const urlParams = new URLSearchParams(window.location.search);
    const textQuery = urlParams.get('text');
    if (textQuery) {
        docElements.speechText.value = textQuery;
        updateCharCounter();
    }
}

// ----------------------
// Gender Guessing Helper
// ----------------------
function guessVoiceGender(name) {
    const lower = name.toLowerCase();

    // Hebrew specific female voices
    if (lower.includes('carmel') || lower.includes('hila') || lower.includes('carmit') || lower.includes('he-il-female') || lower.includes('yara') || lower.includes('google עברית')) {
        return 'female';
    }
    // Hebrew specific male voices
    if (lower.includes('asaf') || lower.includes('assaf') || lower.includes('avri') || lower.includes('he-il-male') || lower.includes('david')) {
        return 'male';
    }

    // English/General female indicators
    if (lower.includes('zira') || lower.includes('hazel') || lower.includes('susan') || lower.includes('female') || lower.includes('harriet') || lower.includes('heather') || lower.includes('helena') || lower.includes('elsa') || lower.includes('laura')) {
        return 'female';
    }
    // English/General male indicators
    if (lower.includes('david') || lower.includes('george') || lower.includes('male') || lower.includes('ravi') || lower.includes('mark') || lower.includes('richard')) {
        return 'male';
    }

    return 'unknown';
}

// ----------------------
// Typo Corrector Engine
// ----------------------

// Re-compile dictionary from constants, history and phrases
function rebuildVocabList() {
    const vocab = new Set(commonHebrewWords);

    // Add words from default phrases
    defaultPhrases.forEach(p => {
        extractWordsToVocab(p.text).forEach(w => vocab.add(w));
    });

    // Add words from custom phrases
    state.customPhrases.forEach(p => {
        extractWordsToVocab(p.text).forEach(w => vocab.add(w));
    });

    // Add words from spoken history
    state.history.forEach(h => {
        extractWordsToVocab(h.text).forEach(w => vocab.add(w));
    });

    state.vocabList = Array.from(vocab);
}

function extractWordsToVocab(str) {
    if (!str) return [];
    // Remove clean punctuation and segment
    return str
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“]/g, "")
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length > 1); // Avoid single-letter prefixes
}

// Compute standard Levenshtein distance between two strings
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Run asynchronous checks for typos
let typoCheckTimeout = null;
function checkTypos() {
    clearTimeout(typoCheckTimeout);

    typoCheckTimeout = setTimeout(() => {
        const text = docElements.speechText.value;
        if (!text) {
            hideTipBox();
            return;
        }

        // Strip trailing whitespaces for word segmentation
        const words = extractWordsToVocab(text);
        if (words.length === 0) {
            hideTipBox();
            return;
        }

        // Target the last completed word
        const lastWord = words[words.length - 1];

        // Skip if word is already verified correct, short or specifically ignored
        if (state.vocabList.includes(lastWord) || lastWord.length <= 2 || state.ignoredTypos.has(lastWord)) {
            hideTipBox();
            return;
        }

        // Search closest matches
        let matchCandidate = null;
        let minimumDistance = Infinity;

        for (const correctWord of state.vocabList) {
            // Filter words with excessive size difference
            if (Math.abs(correctWord.length - lastWord.length) > 1) continue;

            const distance = levenshteinDistance(lastWord, correctWord);

            // Allow distance of 1 for 3-character words, up to 2 for larger words
            const maxDistanceAllowed = lastWord.length <= 3 ? 1 : 2;

            if (distance <= maxDistanceAllowed && distance < minimumDistance) {
                minimumDistance = distance;
                matchCandidate = correctWord;
            }
        }

        if (matchCandidate && matchCandidate !== lastWord) {
            showTipBox(lastWord, matchCandidate);
        } else {
            hideTipBox();
        }
    }, 450);
}

function showTipBox(typoWord, alternativeWord) {
    state.lastCorrectedTypo = typoWord;
    docElements.suggestionChip.textContent = alternativeWord;
    docElements.suggestionBox.style.display = 'flex';
}

function hideTipBox() {
    docElements.suggestionBox.style.display = 'none';
}

// Replace the typo word in the textarea
function replaceTypoWord() {
    const text = docElements.speechText.value;
    const correction = docElements.suggestionChip.textContent;
    const typo = state.lastCorrectedTypo;

    if (!text || !correction || !typo) return;

    // Split retaining Whitespaces
    const segments = text.split(/(\s+)/);

    // Look backwards to correct the last instance of that typo
    for (let i = segments.length - 1; i >= 0; i--) {
        if (segments[i].trim() === typo) {
            segments[i] = correction;
            break;
        }
    }

    docElements.speechText.value = segments.join('');
    updateCharCounter();
    hideTipBox();
    docElements.speechText.focus();
}

function ignoreCurrentTypoSetting() {
    const typo = state.lastCorrectedTypo;
    if (typo) {
        state.ignoredTypos.add(typo);
    }
    hideTipBox();
}

// ----------------------
// Voice Synthesis Engine
// ----------------------

// Load Voices from Browser Synthesis Context
function loadVoices() {
    if (!state.synth) {
        docElements.voiceSelect.innerHTML = '<option value="" disabled>תמיכה בדיבור אינה זמינה בדפדפן זה.</option>';
        return;
    }

    // Retrieve system voices
    const allVoices = state.synth.getVoices();
    state.voices = allVoices;

    if (state.voices.length === 0) {
        // Fallback for browsers waiting asynchronously
        return;
    }

    // Toggle warning if no Hebrew local voice is found
    const hasHebrewLocalVoice = state.voices.some(v => v.lang.startsWith('he'));
    if (docElements.noHebrewWarning) {
        if (!hasHebrewLocalVoice && state.voiceSource === 'system') {
            docElements.noHebrewWarning.style.display = 'flex';
        } else {
            docElements.noHebrewWarning.style.display = 'none';
        }
    }

    // Filter voices based on preferred gender (only if not 'all')
    let voicesToDisplay = [...state.voices];
    if (state.preferredGender !== 'all') {
        voicesToDisplay = state.voices.filter(voice => {
            const gender = guessVoiceGender(voice.name);
            return gender === state.preferredGender || gender === 'unknown'; // Keep unknown as fallback
        });

        // If all got filtered out, revert to all voices
        if (voicesToDisplay.length === 0) {
            voicesToDisplay = [...state.voices];
        }
    }

    // Sort logic: Prioritize Hebrew voices, then English, then others
    const sortedVoices = voicesToDisplay.sort((a, b) => {
        const aHe = a.lang.startsWith('he');
        const bHe = b.lang.startsWith('he');
        if (aHe && !bHe) return -1;
        if (!aHe && bHe) return 1;

        const aEn = a.lang.startsWith('en');
        const bEn = b.lang.startsWith('en');
        if (aEn && !bEn) return -1;
        if (!aEn && bEn) return 1;

        return a.name.localeCompare(b.name);
    });

    // Build Selector Options
    docElements.voiceSelect.innerHTML = '';

    let selectedVoiceExists = false;
    sortedVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;

        const gender = guessVoiceGender(voice.name);
        let genderLabel = '';
        if (gender === 'female') {
            genderLabel = ' [נקבה 👩]';
        } else if (gender === 'male') {
            genderLabel = ' [זכר 👨]';
        }

        let label = voice.name;
        if (voice.lang.startsWith('he')) {
            label = `עברית 🇮🇱${genderLabel} - ${voice.name}`;
        } else if (voice.lang.startsWith('en')) {
            label = `אנגלית 🇺🇸${genderLabel} - ${voice.name}`;
        } else {
            label = `${voice.lang}${genderLabel} - ${voice.name}`;
        }

        if (voice.localService) {
            label += ' (קול מקומי)';
        }

        option.textContent = label;

        if (voice.name === state.selectedVoiceName) {
            option.selected = true;
            selectedVoiceExists = true;
        }

        docElements.voiceSelect.appendChild(option);
    });

    // Auto-select first voice if none is configured
    if (!selectedVoiceExists && sortedVoices.length > 0) {
        const hebrewVoice = sortedVoices.find(v => v.lang.startsWith('he'));
        const defaultChoice = hebrewVoice || sortedVoices[0];
        docElements.voiceSelect.value = defaultChoice.name;
        state.selectedVoiceName = defaultChoice.name;
        localStorage.setItem('selectedVoiceName', state.selectedVoiceName);
    }
}

// Speak Target Text
function speak(text) {
    if (!text || text.trim() === '') return;

    // Use Cloud TTS if selected
    if (state.voiceSource === 'cloud') {
        speakCloud(text);
        return;
    }

    if (!state.synth) return;

    // If currently speaking, stop first
    if (state.synth.speaking) {
        state.synth.cancel();
    }

    // Stop active cloud audio if any
    if (state.activeAudio) {
        state.activeAudio.pause();
        state.activeAudio = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Attach configured properties
    const selectedVoiceObj = state.voices.find(v => v.name === state.selectedVoiceName);
    if (selectedVoiceObj) {
        utterance.voice = selectedVoiceObj;
    }

    // Explicitly set language to prevent fallback gibberish
    utterance.lang = selectedVoiceObj?.lang || 'he-IL';

    utterance.rate = state.rate;
    utterance.pitch = state.pitch;
    utterance.volume = state.volume;

    // Visualizer styling and button active toggles
    utterance.onstart = () => {
        state.activeUtterance = utterance;
        docElements.visualizer.classList.add('playing');
        docElements.stopBtn.removeAttribute('disabled');
        // Icon animation pulse
        const icon = document.querySelector('.logo-icon i');
        if (icon) icon.className = "fa-solid fa-waveform-lines fa-bounce";
    };

    utterance.onend = () => {
        cleanupSpeakingState();
        // Add to history
        addHistoryItem(text);
    };

    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance error:', event);
        cleanupSpeakingState();
    };

    // Trigger Browser Speech Synthesis
    state.synth.speak(utterance);
}

// Speak using Google TTS Cloud Fallback
function speakCloud(text) {
    if (state.synth && state.synth.speaking) {
        state.synth.cancel();
    }

    if (state.activeAudio) {
        state.activeAudio.pause();
    }

    // Google Translate TTS URL (Female Hebrew Voice)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=he&client=tw-ob&q=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    state.activeAudio = audio;

    audio.volume = state.volume;

    audio.addEventListener('play', () => {
        docElements.visualizer.classList.add('playing');
        docElements.stopBtn.removeAttribute('disabled');
        // Icon animation pulse
        const icon = document.querySelector('.logo-icon i');
        if (icon) icon.className = "fa-solid fa-waveform-lines fa-bounce";
    });

    audio.addEventListener('ended', () => {
        cleanupSpeakingState();
        addHistoryItem(text);
    });

    audio.addEventListener('error', (e) => {
        console.error("Cloud TTS error:", e);
        cleanupSpeakingState();
        triggerCloudFallback(text);
    });

    audio.play().catch(err => {
        console.warn("Could not play cloud audio. Browser might require user gesture or request was rejected (CORS/limit).", err);
        cleanupSpeakingState();
        triggerCloudFallback(text);
    });
}

// Fallback helper if Google Cloud TTS is blocked/failed
function triggerCloudFallback(text) {
    alert("שים לב: שירות קול הענן של גוגל אינו זמין כעת (ייתכן עקב חסימת CORS או עומס). האפליקציה תחזור זמנית להקראה באמצעות קולות המחשב המקומיים.");
    state.voiceSource = 'system';
    setRadioCheckedValue('voice-source', 'system');
    updateVoiceSourceUI();
    speak(text);
}

// Reset UI states after speaking finishes
function cleanupSpeakingState() {
    docElements.visualizer.classList.remove('playing');
    docElements.stopBtn.setAttribute('disabled', 'true');
    state.activeUtterance = null;
    state.activeAudio = null;
    const icon = document.querySelector('.logo-icon i');
    if (icon) icon.className = "fa-solid fa-waveform-lines pulse-icon";
}

// Stop currently speaking audio
function stopSpeaking() {
    if (state.synth && state.synth.speaking) {
        state.synth.cancel();
    }
    if (state.activeAudio) {
        state.activeAudio.pause();
        state.activeAudio = null;
    }
    cleanupSpeakingState();
}

// Helper to toggles system voice configuration display
function updateVoiceSourceUI() {
    const hasHebrewLocalVoice = state.voices.some(v => v.lang.startsWith('he'));
    if (state.voiceSource === 'cloud') {
        docElements.systemVoiceSettings.style.display = 'none';
        if (docElements.noHebrewWarning) docElements.noHebrewWarning.style.display = 'none';
    } else {
        docElements.systemVoiceSettings.style.display = 'block';
        if (docElements.noHebrewWarning) {
            docElements.noHebrewWarning.style.display = (!hasHebrewLocalVoice) ? 'flex' : 'none';
        }
    }
}

// ----------------------
// History Management
// ----------------------

function addHistoryItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Check if duplicate of last spoken to avoid redundant listings
    if (state.history.length > 0 && state.history[0].text === trimmed) {
        // Just update timestamp
        state.history[0].timestamp = new Date().toISOString();
    } else {
        // Add to top
        state.history.unshift({
            text: trimmed,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
    }

    // Limit history length to 15
    if (state.history.length > 15) {
        state.history.pop();
    }

    localStorage.setItem('speechHistory', JSON.stringify(state.history));
    renderHistory();

    // Re-build dictionary to include recent spoken phrases
    rebuildVocabList();
}

function deleteHistoryItem(id, event) {
    if (event) event.stopPropagation();
    state.history = state.history.filter(item => item.id !== id);
    localStorage.setItem('speechHistory', JSON.stringify(state.history));
    renderHistory();
    rebuildVocabList();
}

function clearHistory() {
    state.history = [];
    localStorage.removeItem('speechHistory');
    renderHistory();
    rebuildVocabList();
}

// Render dynamic speech history panel
function renderHistory() {
    if (state.history.length === 0) {
        docElements.historyContainer.innerHTML = '<p class="empty-message">אין ברשומות היסטוריה עדיין.</p>';
        return;
    }

    docElements.historyContainer.innerHTML = '';

    state.history.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';

        // Format relative or compact time
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        itemEl.innerHTML = `
            <div class="history-item-content">
                <span class="history-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</span>
                <div class="history-meta">
                    <span><i class="fa-regular fa-clock"></i> ${timeStr}</span>
                </div>
            </div>
            <div class="history-actions">
                <button class="history-btn save-btn" title="הוסף למקלדת מהירה"><i class="fa-regular fa-star"></i></button>
                <button class="history-btn delete-btn" title="מחק מהיסטוריה"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `;

        // Click to speaking handler
        itemEl.querySelector('.history-item-content').addEventListener('click', () => {
            docElements.speechText.value = item.text;
            updateCharCounter();
            speak(item.text);
        });

        // Click to add to shortcuts / pin
        itemEl.querySelector('.save-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openModalWithDetails(item.text);
        });

        // Delete item listener
        itemEl.querySelector('.delete-btn').addEventListener('click', (e) => {
            deleteHistoryItem(item.id, e);
        });

        docElements.historyContainer.appendChild(itemEl);
    });
}

// ----------------------
// AAC Quick Buttons Grid
// ----------------------

function renderQuickBoard() {
    docElements.quickGrid.innerHTML = '';

    // Combine defaults and customs
    const allPhrases = [...defaultPhrases, ...state.customPhrases];

    // Filter by selected tab category
    const filtered = state.categoryFilter === 'all'
        ? allPhrases
        : allPhrases.filter(p => p.category === state.categoryFilter);

    if (filtered.length === 0) {
        docElements.quickGrid.innerHTML = '<div class="empty-message" style="grid-column: 1 / -1; width:100%;">אין פריטים להצגה בקטגוריה זו.</div>';
        return;
    }

    filtered.forEach(phrase => {
        const isCustom = state.customPhrases.includes(phrase);
        const card = document.createElement('button');
        card.className = `quick-item ${isCustom ? 'custom-item' : ''}`;
        card.setAttribute('data-cat', phrase.category);

        const phraseIconClass = phrase.icon || 'fa-comment';

        card.innerHTML = `
            ${isCustom ? `<button class="delete-quick-btn" title="מחק כפתור"><i class="fa-solid fa-xmark"></i></button>` : ''}
            <div class="item-icon"><i class="fa-solid ${phraseIconClass}"></i></div>
            <span class="item-text">${escapeHtml(phrase.label || phrase.text)}</span>
        `;

        // Click to speak immediate action
        card.addEventListener('click', (e) => {
            // Check if deleted button clicked
            if (e.target.closest('.delete-quick-btn')) return;

            // Set textarea value & speak
            docElements.speechText.value = phrase.text;
            updateCharCounter();
            speak(phrase.text);
        });

        // Custom delete click handler
        if (isCustom) {
            card.querySelector('.delete-quick-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCustomPhrase(phrase);
            });
        }

        docElements.quickGrid.appendChild(card);
    });
}

// Create custom quick button
function saveCustomPhrase(text, label, category) {
    const newPhrase = {
        text: text.trim(),
        label: (label && label.trim()) ? label.trim() : text.trim(),
        category: category,
        icon: getCategoryIcon(category)
    };

    state.customPhrases.push(newPhrase);
    localStorage.setItem('customPhrases', JSON.stringify(state.customPhrases));

    // Focus category to reveal newly added buttons
    state.categoryFilter = category;
    updateActiveCategoryTab();

    renderQuickBoard();

    // Re-build dictionary to include new custom phrase
    rebuildVocabList();
}

function deleteCustomPhrase(phraseObj) {
    if (confirm(`האם ברצונך למחוק את הכפתור "${phraseObj.label || phraseObj.text}"?`)) {
        state.customPhrases = state.customPhrases.filter(p => p !== phraseObj);
        localStorage.setItem('customPhrases', JSON.stringify(state.customPhrases));
        renderQuickBoard();
        rebuildVocabList();
    }
}

// ----------------------
// DOM & Event Listeners
// ----------------------

function attachEventListeners() {
    // Speaking actions
    docElements.speakBtn.addEventListener('click', () => {
        speak(docElements.speechText.value);
    });

    docElements.stopBtn.addEventListener('click', () => {
        stopSpeaking();
    });

    docElements.clearBtn.addEventListener('click', () => {
        docElements.speechText.value = '';
        updateCharCounter();
        stopSpeaking();
        hideTipBox();
        docElements.speechText.focus();
    });

    // Character counting & instant typing read-aloud & typo checks
    docElements.speechText.addEventListener('input', (e) => {
        updateCharCounter();

        // Trigger non-intrusive typo checks
        checkTypos();

        if (state.instantSpeak) {
            handleInstantSpeak(e);
        }
    });

    // Typo suggestion actions
    docElements.suggestionChip.addEventListener('click', () => {
        replaceTypoWord();
    });

    docElements.dismissSuggestion.addEventListener('click', () => {
        ignoreCurrentTypoSetting();
    });

    // Voice source radios (System vs Cloud)
    docElements.voiceSourceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.voiceSource = e.target.value;
            localStorage.setItem('voiceSource', state.voiceSource);
            updateVoiceSourceUI();
        });
    });

    // Gender radios
    docElements.genderRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.preferredGender = e.target.value;
            localStorage.setItem('preferredGender', state.preferredGender);
            loadVoices();
        });
    });

    // Info guide collapsible
    docElements.helpToggleBtn.addEventListener('click', () => {
        const container = document.querySelector('.hebrew-help-container');
        container.classList.toggle('open');
    });

    // Voice selectors
    docElements.voiceSelect.addEventListener('change', () => {
        state.selectedVoiceName = docElements.voiceSelect.value;
        localStorage.setItem('selectedVoiceName', state.selectedVoiceName);
    });

    // Setting sliders
    docElements.rateInput.addEventListener('input', () => {
        const val = parseFloat(docElements.rateInput.value);
        state.rate = val;
        docElements.rateVal.textContent = val.toFixed(1) + 'x';
        localStorage.setItem('speechRate', val);
    });

    docElements.pitchInput.addEventListener('input', () => {
        const val = parseFloat(docElements.pitchInput.value);
        state.pitch = val;
        docElements.pitchVal.textContent = val.toFixed(1);
        localStorage.setItem('speechPitch', val);
    });

    docElements.volumeInput.addEventListener('input', () => {
        const val = parseFloat(docElements.volumeInput.value);
        state.volume = val;
        docElements.volumeVal.textContent = Math.round(val * 100) + '%';
        localStorage.setItem('speechVolume', val);
    });

    // Instant speak check switcher
    docElements.instantSpeakCheck.addEventListener('change', () => {
        const isChecked = docElements.instantSpeakCheck.checked;
        state.instantSpeak = isChecked;
        localStorage.setItem('instantSpeak', isChecked);
    });

    // Theme toggler
    docElements.themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        updateThemeIcon();
    });

    // AAC Category tabs selection
    docElements.categoryTabs.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.tab-btn');
        if (!tabBtn) return;

        // Update active class
        docElements.categoryTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        // Filter elements
        state.categoryFilter = tabBtn.getAttribute('data-category');
        renderQuickBoard();
    });

    // Clear History Button
    docElements.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('האם אתה בטוח שברצונך למחוק את כל היסטוריית הדיבור?')) {
            clearHistory();
        }
    });

    // Custom phrase modal actions
    docElements.addPhraseToggle.addEventListener('click', () => {
        openModal();
    });

    docElements.closeModalBtn.addEventListener('click', () => {
        closeModal();
    });

    // Click outside to close modal
    docElements.customPhraseModal.addEventListener('click', (e) => {
        if (e.target === docElements.customPhraseModal) {
            closeModal();
        }
    });

    docElements.customPhraseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = docElements.customText.value;
        const label = docElements.customLabel.value;
        const category = docElements.customCategory.value;

        saveCustomPhrase(text, label, category);
        closeModal();

        //Reset fields
        docElements.customText.value = '';
        docElements.customLabel.value = '';
    });
}

// Real-time Hebrew/English speech segmentation on spaces
let lastTestedLength = 0;
function handleInstantSpeak(event) {
    const text = docElements.speechText.value;

    // Check if backspace/clear happened
    if (text.length <= lastTestedLength) {
        lastTestedLength = text.length;
        return;
    }

    // Read the last completed word when a space is entered
    if (text.length > 0 && text[text.length - 1] === ' ') {
        const trimmed = text.substring(lastTestedLength, text.length - 1).trim();
        if (trimmed.length > 0) {
            speak(trimmed);
        }
        lastTestedLength = text.length;
    }
}

function updateCharCounter() {
    const count = docElements.speechText.value.length;
    docElements.charCounter.textContent = `${count} תווים`;
}

function updateThemeIcon() {
    const i = docElements.themeToggle.querySelector('i');
    if (state.theme === 'dark') {
        i.className = 'fa-solid fa-sun';
    } else {
        i.className = 'fa-solid fa-moon';
    }
}

function updateActiveCategoryTab() {
    docElements.categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-category') === state.categoryFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Helper to check the correct radio option by name/value
function setRadioCheckedValue(groupName, targetValue) {
    const radios = document.getElementsByName(groupName);
    radios.forEach(radio => {
        if (radio.value === targetValue) {
            radio.checked = true;
        }
    });
}

// Modal Form handling
function openModal() {
    docElements.customPhraseModal.classList.add('open');
    docElements.customText.focus();
}

function openModalWithDetails(prefilledText) {
    docElements.customText.value = prefilledText;
    docElements.customLabel.value = prefilledText.substring(0, 15) + (prefilledText.length > 15 ? '...' : '');
    openModal();
}

function closeModal() {
    docElements.customPhraseModal.classList.remove('open');
}

// Helpers
function getCategoryIcon(cat) {
    switch (cat) {
        case 'needs': return 'fa-handshake-angle';
        case 'feelings': return 'fa-face-smile';
        case 'social': return 'fa-person-wave-command';
        case 'general': return 'fa-circle-check';
        default: return 'fa-comment';
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Kickstart Initialization
document.addEventListener('DOMContentLoaded', initialize);
// Fallback if DOMContentLoaded already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initialize();
}
