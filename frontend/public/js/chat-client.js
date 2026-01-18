class SAMChatClient {
    constructor() {
        this.baseUrl = ''; // Relative path - uses the same origin (Proxy at 127.0.0.1:8080)
        this.agentId = 'OrchestratorAgent'; // Must match the name in orchestrator.yaml
        this.history = [];
        this.isConnected = false;

        // UI Elements
        this.chatWidget = document.getElementById('chat-widget');
        this.toggleButton = document.getElementById('chat-toggle-btn');
        this.messagesContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('chat-input-field');
        this.sendButton = document.getElementById('chat-send-btn');
        this.statusIndicator = document.getElementById('chat-status');

        this.init();
    }

    init() {
        if (!this.chatWidget) return;

        // Event Listeners
        this.toggleButton.addEventListener('click', () => this.toggleChat());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Initialize connection
        this.connect();
    }

    toggleChat() {
        this.chatWidget.style.display = this.chatWidget.style.display === 'none' ? 'flex' : 'none';
        if (this.chatWidget.style.display === 'flex') {
            this.inputField.focus();
            // Scroll to bottom
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    async connect(retryCount = 0) {
        this.addMessage('system', retryCount === 0 ? 'Connecting to Orchestrator...' : `Retrying connection (${retryCount}/3)...`);

        try {
            // Generate a client-side session ID
            this.sessionId = 'web-session-' + Date.now();

            // Validate minimal health check or just assume success if we can set session
            // For robust check, we could ping /api/health if available, but for now we assume local proxy is up.

            this.isConnected = true;
            this.updateStatus(true);
            this.addMessage('system', 'Connected! Ask me anything about PC parts.');
            this.inputField.disabled = false;
            this.sendButton.disabled = false;

            console.log('Session initialized:', this.sessionId);

        } catch (err) {
            console.error('Connection failed:', err);
            this.updateStatus(false);

            if (retryCount < 3) {
                setTimeout(() => this.connect(retryCount + 1), 2000); // Retry after 2s
            } else {
                this.addMessage('system', 'Connection failed. Please check if the backend is running.');
            }
        }
    }

    async sendMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        this.inputField.value = '';
        this.inputField.disabled = true;
        this.sendButton.disabled = true;

        // Show thinking state
        const thinkingMessage = this.addMessage('system', 'Thinking...');

        try {
            // Use standard /api/v1/message:send JSON-RPC endpoint
            // Payload must match SendMessageRequest model
            const payload = {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "message/send",
                params: {
                    message: {
                        messageId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'msg-' + Date.now(),
                        role: "user",
                        parts: [{ text: text, kind: "text" }],
                        metadata: {
                            agent_name: this.agentId
                        }
                    },
                    configuration: {
                        blocking: true
                    }
                }
            };

            console.log('Sending payload:', payload);

            const response = await fetch(`${this.baseUrl}/api/v1/message:send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'solace-session-id': this.sessionId
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error('Endpoint not found (404)');
                if (response.status === 405) throw new Error('Method not allowed (405)');
                if (response.status === 422) throw new Error('Validation Error (422)');
                throw new Error(`Agent Error: ${response.status}`);
            }

            const data = await response.json();

            // Remove thinking message
            thinkingMessage.remove();

            // Handle response format
            let reply = "No response from agent.";

            // JSON-RPC Success
            if (data.result && data.jsonrpc) {
                if (data.result.history && Array.isArray(data.result.history)) {
                    // Find last message from agent
                    const agentMsgs = data.result.history.filter(m => m.role === 'agent' || m.role === 'assistant' || m.role === 'model');
                    if (agentMsgs.length > 0) {
                        const lastMsg = agentMsgs[agentMsgs.length - 1];
                        if (lastMsg.parts && lastMsg.parts.length > 0) {
                            const textPart = lastMsg.parts.find(p => p.kind === 'text' || p.text);
                            if (textPart) {
                                reply = textPart.text;
                            }
                        }
                    } else {
                        reply = "Agent processed the task but returned no history.";
                    }
                } else if (data.result.status && data.result.status.state === 'submitted') {
                    reply = "Task submitted (Processing asynchronously).";
                }
            } else if (data.response) {
                reply = data.response;
            } else if (data.message) {
                reply = data.message;
            } else {
                reply = JSON.stringify(data);
            }

            this.addMessage('agent', reply);

        } catch (err) {
            console.error('Chat error:', err);
            thinkingMessage.remove();
            this.addMessage('system', `Error: ${err.message}`);
        } finally {
            this.inputField.disabled = false;
            this.sendButton.disabled = false;
            this.inputField.focus();
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    addMessage(type, text, isThinking = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message message-${type}`;

        if (type === 'agent' || type === 'bot') {
            // Basic Markdown parsing for links and bold
            let htmlText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
            msgDiv.innerHTML = htmlText;
        } else {
            msgDiv.textContent = text;
        }

        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        return msgDiv;
    }

    updateStatus(connected, text) {
        if (connected) {
            this.statusIndicator.textContent = text || 'Online';
            this.statusIndicator.style.color = 'var(--success-500)';
        } else {
            this.statusIndicator.textContent = 'Offline';
            this.statusIndicator.style.color = 'var(--error-500)';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chatClient = new SAMChatClient();
});
