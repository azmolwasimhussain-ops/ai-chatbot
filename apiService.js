// api.js
class API {
    static async fetchChatResponse(messages, streamCallback) {
        const settings = StorageManager.getSettings();
        if(!settings.openRouterKey) throw new Error("OpenRouter API key is missing. Add it in Settings.");

        // Safely insert system prompt to avoid 400 errors from LLMs that reject 'system' roles
        const finalMessages = messages.map(m => ({ role: m.role, content: m.content }));
        if (settings.systemPrompt) {
            if (finalMessages.length > 0 && finalMessages[0].role === 'user') {
                finalMessages[0].content = settings.systemPrompt + "\n\n" + finalMessages[0].content;
            } else {
                finalMessages.unshift({ role: 'user', content: settings.systemPrompt });
            }
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.openRouterKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Nexus AI Chat',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: settings.textModel,
                messages: finalMessages,
                stream: true // Enable Server-Sent Events (SSE) streaming effect
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${err}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";

        while(true) {
            const {done, value} = await reader.read();
            if(done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for(let line of lines) {
                if(line.startsWith("data: ") && !line.includes("[DONE]")) {
                    try {
                        const dataObj = JSON.parse(line.substring(6));
                        const delta = dataObj.choices[0]?.delta?.content || "";
                        fullText += delta;
                        streamCallback(fullText);
                    } catch(e) {
                         // gracefully skip incomplete chunks 
                    }
                }
            }
        }
        return fullText;
    }

    static async fetchImageGeneration(prompt) {
        const settings = StorageManager.getSettings();
        if(!settings.hfKey) throw new Error("Hugging Face API key is missing. Add it in Settings.");
        
        let cleanedPrompt = prompt.replace(/^generate an image of |^generate image |^create an image of |^draw /i, "");
        const url = `https://router.huggingface.co/hf-inference/models/${settings.imageModel}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.hfKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: cleanedPrompt })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Image API error: ${response.status} - ${err}`);
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }
}
