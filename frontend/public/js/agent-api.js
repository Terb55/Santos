/**
 * agent-api.js
 *
 * Lightweight client for SAM agents via JSON-RPC.
 */

const AgentAPI = {
    sessionId: null,
    baseUrl: '',

    init() {
        if (this.sessionId) return;
        const existing = localStorage.getItem('buildrAI-session-id');
        this.sessionId = existing || `web-session-${Date.now()}`;
        if (!existing) {
            localStorage.setItem('buildrAI-session-id', this.sessionId);
        }
    },

    async sendMessage(agentName, text) {
        this.init();
        const payload = {
            jsonrpc: "2.0",
            id: Date.now(),
            method: "message/send",
            params: {
                message: {
                    messageId: crypto?.randomUUID?.() || `msg-${Date.now()}`,
                    role: "user",
                    parts: [{ kind: "text", text }],
                    metadata: { agent_name: agentName }
                },
                configuration: {
                    blocking: true
                }
            }
        };

        const response = await fetch(`${this.baseUrl}/api/v1/message:send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'solace-session-id': this.sessionId
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Agent error ${response.status}`);
        }

        const data = await response.json();
        return this.extractText(data);
    },

    extractText(response) {
        const result = response?.result || response;
        const message = result?.message || result?.status?.message || result?.status?.result?.message;
        if (message?.parts && Array.isArray(message.parts)) {
            return message.parts.map(part => part.text || '').join('');
        }
        if (result?.parts && Array.isArray(result.parts)) {
            return result.parts.map(part => part.text || '').join('');
        }
        if (result?.text) return result.text;
        return '';
    },

    safeParseJson(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return null;
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            return null;
        }
    }
};

window.AgentAPI = AgentAPI;
