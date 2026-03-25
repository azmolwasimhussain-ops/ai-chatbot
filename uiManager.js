// ui.js
class UI {
    static getAvatar(role) {
        if(role === 'bot') {
            return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c-.11.66-.25 1.32-.41 1.97A3 3 0 0 1 12 11c-1.33 0-2.48-.86-2.86-2.03A12.3 12.3 0 0 1 10 4a2 2 0 0 1 2-2Z"/><path d="M21 21A2 2 0 0 1 19 23H5a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8Z"/></svg>`;
        }
        return "";
    }

    static createMessageElement(messageObj) {
        const { role, content, isImage, isError, timestamp } = messageObj;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        
        let innerContent = "";
        
        if (isImage) {
            innerContent = `<img src="${content}" class="message-image" alt="Generated Image" onclick="openFullscreen('${content}')"/>`;
            innerContent += `<div class="message-tools"><button class="tool-btn" onclick="downloadImage('${content}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="mike-icon" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download</button></div>`;
        } else if (isError) {
            innerContent = `<p style="color:#ef4444;">${content}</p>`;
        } else if (content === '...' || content === 'Thinking...') {
            innerContent = `<p><span class="typing-indicator"><span></span><span></span><span></span></span></p>`;
        } else {
            // Render text with Markdown support
            innerContent = DOMPurify.sanitize(marked.parse(content));
            if (role === 'bot') {
                const encContent = encodeURIComponent(content);
                innerContent += `
                <div class="message-tools" style="${content.length > 0 ? 'opacity: 1;' : ''}">
                    <button class="tool-btn copy-btn" onclick="copyText(this)" data-text="${encContent}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy
                    </button>
                    <button class="tool-btn tts-btn" onclick="speakText(this)" data-text="${encContent}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Speak
                    </button>
                </div>`;
            }
        }

        msgDiv.innerHTML = `
            <div class="avatar">${UI.getAvatar(role)}</div>
            <div class="message-content">
                <div class="msg-text">${innerContent}</div>
                ${timestamp ? `<span class="timestamp">${timestamp}</span>` : ''}
            </div>
        `;
        return msgDiv;
    }

    static updateBotMessage(msgDiv, fullText, isStreaming = false) {
        const textContainer = msgDiv.querySelector('.msg-text');
        textContainer.innerHTML = DOMPurify.sanitize(marked.parse(fullText)) + (isStreaming ? '<span class="streaming-cursor"></span>' : '');
        
        if (isStreaming) return;

        // Re-inject tools
        const encContent = encodeURIComponent(fullText);
        const tools = `
        <div class="message-tools" style="opacity: 1; transition: opacity 0.3s;">
            <button class="tool-btn copy-btn" onclick="copyText(this)" data-text="${encContent}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy
            </button>
            <button class="tool-btn tts-btn" onclick="speakText(this)" data-text="${encContent}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Speak
            </button>
        </div>`;
        textContainer.innerHTML += tools;
    }
}

// Global functions for inline HTML events
window.openFullscreen = function(url) {
    document.getElementById('fullscreenImage').src = url;
    document.getElementById('imageModal').classList.remove('hidden');
}

window.downloadImage = function(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_image_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

window.copyText = function(btn) {
    const text = decodeURIComponent(btn.getAttribute('data-text'));
    navigator.clipboard.writeText(text);
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
    setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
}

window.speakText = function(btn) {
    const text = decodeURIComponent(btn.getAttribute('data-text'));
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}
