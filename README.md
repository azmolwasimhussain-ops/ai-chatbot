# Nexus AI Chatbot

A premium, ChatGPT-style local web application powered by **Vanilla HTML, CSS, and JavaScript**. It connects securely to **OpenRouter** (for state-of-the-art text LLMs) and **Hugging Face** (for lightning-fast image generation) through a modular script architecture.

## 🚀 Features

- **ChatGPT UI Replica:** Centered reading layout, soft dark/light typography, rounded floating input fields.
- **Server-Sent Events (SSE) Streaming:** Instant text generation via streaming chunks with live blinking cursor.
- **Auto Image Detection:** Seamlessly generate visuals simply by saying phrases like *"draw a cat"* or clicking the built-in image button.
- **Persistent LocalStorage:** Automatically saves chats across sessions. You can swap between previous chats, delete history, and rename conversations.
- **Multi-API Modularity:** Support to hot-swap LLM nodes within the built-in Frontend Settings Panel.
- **Advanced Tooling:** 
  - 🎤 Voice Dictation (Web Speech API)
  - 🔊 Text-To-Speech (AI Read-Aloud)
  - 📋 One-click message copying
  - 🖼️ Image popups and direct PNG downloads.
- **Markdown Support:** Full live Markdown rendering managed by `marked.js` and sanitized using `DOMPurify`.

## 🛠️ Architecture

- `apiService.js` — Handles standard SSE fetch calls and Hugging Face connections.
- `chatManager.js` — Central state container linking inputs, outputs, and smart routing logic.
- `uiManager.js` — Compiles and renders DOM elements (Markdown sanitization, bubbles, tool injections).
- `storage.js` — Wraps `localStorage` read/writes for settings and conversation trees.

## ⚙️ Installation

1. Clone the repository.
2. Ensure you have an active **OpenRouter API Key** and a **Hugging Face API inference Key**.
3. Create a `config.js` file in the root directory (ignored by `.gitignore` by default):

```javascript
window.CONFIG = {
    OPENROUTER_API_KEY: "sk-or-v1-...",
    HF_API_KEY: "hf_..."
};
```

4. **Run Locally:** Open `index.html` either by direct double click or using an extension like VS Code Live Server (`http://127.0.0.1:5500`).

## ⚙️ Modifying Settings

Aside from `config.js`, you can modify model selection directly in the browser via the **Settings (⚙️) Panel** on the bottom-left sidebar. These settings will override `.js` defaults and lock into `localStorage`. 

- **Recommended Text Models**: `openrouter/free`, `google/gemini-2.5-flash-free`, `meta-llama/llama-3.2-3b-instruct:free`
- **Recommended Image Models**: `black-forest-labs/FLUX.1-schnell`

Enjoy building with Nexus AI!
