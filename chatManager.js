// Main System Logic bridging Storage, API, & UI

let allChats = StorageManager.getChats();
let currentChatId = null;
let currentMessages = [];

// DOM Initializations
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const historyList = document.getElementById('historyList');

// Auto resize multiline text area
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    sendBtn.disabled = this.value.trim() === '';
});

userInput.addEventListener('keydown', (e) => {
    // Send on Enter, newline on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(false);
    }
});

sendBtn.addEventListener('click', () => handleSend(false));
const generateImageBtn = document.getElementById('generateImageBtn');
if (generateImageBtn) generateImageBtn.addEventListener('click', () => handleSend(true));

function getTimestamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createNewChat() {
    currentChatId = Date.now().toString();
    currentMessages = [];
    chatBox.innerHTML = '';
    renderHistory();
    userInput.focus();
}

function loadChat(id) {
    currentChatId = id;
    const chat = allChats.find(c => c.id === id);
    if(chat) {
        currentMessages = chat.messages || [];
        chatBox.innerHTML = '';
        currentMessages.forEach(msg => {
            chatBox.appendChild(UI.createMessageElement(msg));
        });
        scrollToBottom();
        renderHistory();
        
        // Hide sidebar on mobile load
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    }
}

function saveCurrentChat() {
    if(currentMessages.length === 0) return;
    const existingIndex = allChats.findIndex(c => c.id === currentChatId);
    
    // Auto title generation based on first user prompt
    const titleObj = currentMessages.find(m => m.role === 'user');
    const title = titleObj ? titleObj.content.substring(0, 30) + (titleObj.content.length > 30 ? '...' : '') : 'New Chat';
    
    const chatObj = { id: currentChatId, title, messages: currentMessages, timestamp: Date.now() };
    
    if(existingIndex >= 0) {
        allChats[existingIndex] = chatObj;
    } else {
        allChats.unshift(chatObj);
    }
    StorageManager.saveChats(allChats);
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    allChats.forEach(chat => {
        const btn = document.createElement('button');
        btn.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        btn.innerHTML = `<span style="flex:1; overflow:hidden; text-overflow:ellipsis;" title="${chat.title}">${chat.title}</span> <span onclick="deleteChat(event, '${chat.id}')" style="margin-left:8px; opacity:0.6; font-size:1.2em;">&times;</span>`;
        btn.onclick = () => loadChat(chat.id);
        historyList.appendChild(btn);
    });
}

window.deleteChat = function(e, id) {
    e.stopPropagation();
    allChats = allChats.filter(c => c.id !== id);
    StorageManager.saveChats(allChats);
    if(currentChatId === id) createNewChat();
    else renderHistory();
}

function scrollToBottom() {
    setTimeout(() => {
        chatBox.parentElement.scrollTo({
            top: chatBox.parentElement.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
}

// Controller entry point for Smart Chat processing
async function handleSend(forceImage = false) {
    const text = userInput.value.trim();
    if (!text) return;
    if (!currentChatId) createNewChat();

    // Reset Input Box
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Smart Routing Image logic Check (Extremely robust detection for things like "generate a image of")
    const isImageReq = forceImage || /^(generate|create|make)\s+(an?|the)?\s*(image|picture|photo|drawing|portrait|illustration|art)/i.test(text) || text.toLowerCase().startsWith('draw ');

    // 1. Log User Interaction
    const userMsg = { role: 'user', content: text, timestamp: getTimestamp() };
    currentMessages.push(userMsg);
    chatBox.appendChild(UI.createMessageElement(userMsg));
    scrollToBottom();

    // 2. Prepare visual Loading Element
    const loadingMsgObj = { role: 'bot', content: '...', timestamp: getTimestamp() };
    const loadingNode = UI.createMessageElement(loadingMsgObj);
    chatBox.appendChild(loadingNode);
    scrollToBottom();

    // 3. Fire request to external wrapper
    try {
        if (isImageReq) {
            const url = await API.fetchImageGeneration(text);
            const finalImageMsg = { role: 'bot', content: url, isImage: true, timestamp: getTimestamp() };
            currentMessages.push(finalImageMsg);
            chatBox.replaceChild(UI.createMessageElement(finalImageMsg), loadingNode);
        } else {
            // Live Stream rendering implementation
            const finalBotMsg = { role: 'bot', content: '', timestamp: getTimestamp() };
            let liveText = "";
            await API.fetchChatResponse(currentMessages.slice(0, -1).concat([userMsg]), (chunk) => {
                liveText = chunk;
                UI.updateBotMessage(loadingNode, liveText, true);
                scrollToBottom();
            });
            finalBotMsg.content = liveText;
            currentMessages.push(finalBotMsg);
            UI.updateBotMessage(loadingNode, liveText, false); // Clear cursor and reveal tools
        }
        saveCurrentChat();
    } catch (err) {
        console.error(err);
        const errorMsg = { role: 'bot', content: err.message, isError: true, timestamp: getTimestamp() };
        chatBox.replaceChild(UI.createMessageElement(errorMsg), loadingNode);
    }
    
    // Unlock UI
    sendBtn.disabled = false;
    userInput.focus();
}

// Global Document Initializations
document.getElementById('newChatBtn').addEventListener('click', createNewChat);

if(allChats.length > 0) {
    loadChat(allChats[0].id);
} else {
    createNewChat();
}

// Light / Dark Theme Toggles
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

// Setting Panel Access
const settingsModal = document.getElementById('settingsModal');
document.getElementById('settingsBtn').addEventListener('click', () => {
    const s = StorageManager.getSettings();
    document.getElementById('settingOpenRouterKey').value = s.openRouterKey;
    document.getElementById('settingHFKey').value = s.hfKey;
    document.getElementById('settingTextModel').value = s.textModel;
    document.getElementById('settingImageModel').value = s.imageModel;
    document.getElementById('settingSystemPrompt').value = s.systemPrompt;
    settingsModal.classList.remove('hidden');
});
document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsModal.classList.add('hidden'));
document.getElementById('cancelSettingsBtn').addEventListener('click', () => settingsModal.classList.add('hidden'));
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    StorageManager.saveSettings({
        openRouterKey: document.getElementById('settingOpenRouterKey').value,
        hfKey: document.getElementById('settingHFKey').value,
        textModel: document.getElementById('settingTextModel').value,
        imageModel: document.getElementById('settingImageModel').value,
        systemPrompt: document.getElementById('settingSystemPrompt').value
    });
    settingsModal.classList.add('hidden');
});

// Global Image Popup Modal Close
document.getElementById('closeImageBtn').addEventListener('click', () => {
    document.getElementById('imageModal').classList.add('hidden');
});

// Mobile Overlay Side Navigation
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Voice dictate bonus hook
const voiceBtn = document.getElementById('voiceBtn');
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        voiceBtn.classList.add('mic-active');
    };
    recognition.onresult = (e) => {
        userInput.value += e.results[0][0].transcript;
        sendBtn.disabled = userInput.value.trim() === '';
    };
    recognition.onend = () => {
        voiceBtn.classList.remove('mic-active');
    };
    voiceBtn.addEventListener('click', () => {
        recognition.start();
    });
} else {
    voiceBtn.style.display = 'none';
}
