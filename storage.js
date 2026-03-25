// storage.js
class StorageManager {
    static getChats() {
        return JSON.parse(localStorage.getItem('nexus_chats') || '[]');
    }

    static saveChats(chats) {
        localStorage.setItem('nexus_chats', JSON.stringify(chats));
    }

    static getSettings() {
        const defaultSettings = { 
            openRouterKey: window.CONFIG?.OPENROUTER_API_KEY || '',
            hfKey: window.CONFIG?.HF_API_KEY || '',
            textModel: 'openrouter/free',
            imageModel: 'black-forest-labs/FLUX.1-schnell',
            systemPrompt: 'You are Nexus AI, a helpful, intelligent assistant. Use markdown where helpful to format responses clearly.'
        };
        const saved = JSON.parse(localStorage.getItem('nexus_settings') || '{}');
        return { ...defaultSettings, ...saved };
    }

    static saveSettings(settings) {
        localStorage.setItem('nexus_settings', JSON.stringify(settings));
    }
}
