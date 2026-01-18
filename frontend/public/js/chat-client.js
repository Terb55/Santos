class SAMChatClient {
    constructor() {
        this.baseUrl = ''; // Proxy origin (127.0.0.1:8080)
        this.directBackendUrl = 'http://localhost:8000'; // Direct backend connection for streaming
        this.agentId = 'OrchestratorAgent';
        this.isConnected = false;

        // UI Elements
        this.chatWidget = document.getElementById('chat-widget');
        this.toggleButton = document.getElementById('chat-toggle-btn');
        this.closeButton = document.getElementById('chat-close-btn');
        this.messagesContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('chat-input-field');
        this.sendButton = document.getElementById('chat-send-btn');
        this.statusIndicator = document.getElementById('chat-status');

        this.init();
    }

    init() {
        if (!this.chatWidget) return;

        this.toggleButton.addEventListener('click', () => this.toggleChat());
        this.closeButton.addEventListener('click', () => this.closeChat());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.homeMode = this.isHomePage();
        if (this.homeMode) {
            this.openChat();
        }

        this.connect();
    }

    isHomePage() {
        const path = window.location.pathname.toLowerCase();
        return path.endsWith('/') || path.endsWith('/index.html') || path === '';
    }

    openChat() {
        this.chatWidget.style.display = 'flex';
        if (this.toggleButton) {
            this.toggleButton.style.display = 'none';
        }
        this.inputField.focus();
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    toggleChat() {
        const isHidden = this.chatWidget.style.display === 'none';
        if (isHidden) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }

    closeChat() {
        this.chatWidget.style.display = 'none';
        if (this.toggleButton) {
            this.toggleButton.style.display = 'flex';
        }
    }

    async connect() {
        this.addMessage('system', 'Connecting to Orchestrator...');

        try {
            this.sessionId = 'web-session-' + Date.now();

            // Don't check status - it doesn't exist and just causes errors
            console.log('Created session:', this.sessionId);

            this.isConnected = true;
            this.updateStatus(true);
            this.addMessage('system', 'Connected! Ask me anything about PC parts.');
            this.inputField.disabled = false;
            this.sendButton.disabled = false;
        } catch (err) {
            this.updateStatus(false);
            this.addMessage('system', 'Failed to connect to backend.');
        }
    }

    async sendMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;

        this.addMessage('user', text);
        this.inputField.value = '';
        this.inputField.disabled = true;
        this.sendButton.disabled = true;

        const thinkingMessage = this.addMessage('system', 'Waiting for agent response...');

        try {
            const payload = {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "message/send",
                params: {
                    message: {
                        messageId: crypto?.randomUUID?.() || `msg-${Date.now()}`,
                        role: "user",
                        parts: [{ kind: "text", text }],
                        metadata: { agent_name: this.agentId }
                    },
                    configuration: {
                        blocking: false  // Don't block - listen for streaming updates
                    }
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            // Send message via proxy
            const response = await fetch(`${this.baseUrl}/api/v1/message:send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'solace-session-id': this.sessionId
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Agent error ${response.status}`);
            }

            const data = await response.json();
            console.log('Message submitted:', data);
            
            // Get task ID from response
            const taskData = data.result || data;
            const taskId = taskData?.id;
            
            if (taskId) {
                console.log('Task submitted, listening for updates on task:', taskId);
                // Listen for streaming updates directly from backend
                this.listenForTaskUpdates(taskId, thinkingMessage);
            } else {
                thinkingMessage.remove();
                this.addMessage('system', 'Message submitted but no task ID returned.');
            }

        } catch (err) {
            thinkingMessage.remove();
            const msg = err.name === 'AbortError'
                ? 'Request timed out.'
                : `Failed to send message: ${err.message}`;
            this.addMessage('system', msg);
        } finally {
            this.inputField.disabled = false;
            this.sendButton.disabled = false;
            this.inputField.focus();
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    listenForTaskUpdates(taskId, thinkingMessage) {
        // Try different SSE endpoint paths
        const endpointPaths = [
            `/subscribe/${taskId}`,  // Direct backend path
            `/api/v1/subscribe/${taskId}`,  // Via proxy
            `/api/v1/sse/subscribe/${taskId}`,  // Alternative SSE path
        ];

        let currentAttempt = 0;
        
        const tryNextEndpoint = () => {
            if (currentAttempt >= endpointPaths.length) {
                thinkingMessage.remove();
                this.addMessage('system', 'Unable to connect to task stream. Tried all endpoints.');
                return;
            }

            const path = endpointPaths[currentAttempt];
            const sseUrl = currentAttempt === 0 
                ? `${this.directBackendUrl}${path}`  // Try direct backend first
                : `${this.baseUrl}${path}`;  // Then try through proxy
            
            console.log(`Attempt ${currentAttempt + 1}: Connecting to SSE endpoint: ${sseUrl}`);
            currentAttempt++;

            try {
                let responseText = '';
                const timeout = setTimeout(() => {
                    eventSource.close();
                    thinkingMessage.remove();
                    this.addMessage('system', 'Task stream timeout.');
                }, 120000);

                const eventSource = new EventSource(sseUrl);

                eventSource.addEventListener('open', () => {
                    console.log('SSE connection opened for task:', taskId);
                });

                eventSource.addEventListener('status_update', (event) => {
                    try {
                        const update = JSON.parse(event.data);
                        console.log('Received status_update:', update);
                        
                        if (update.result && update.result.message) {
                            const message = update.result.message;
                            if (message.parts && Array.isArray(message.parts)) {
                                for (const part of message.parts) {
                                    if (part.text) {
                                        responseText += part.text;
                                        if (thinkingMessage.parentNode) {
                                            thinkingMessage.textContent = responseText;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error parsing status_update:', err);
                    }
                });

                eventSource.addEventListener('final_response', (event) => {
                    try {
                        const response = JSON.parse(event.data);
                        console.log('Received final_response - FULL RESPONSE:', response);
                        
                        clearTimeout(timeout);
                        eventSource.close();
                        
                        // Try multiple ways to extract text from the response
                        let extractedText = '';
                        
                        // Method 1: response.result.status.message.parts[].text (CORRECT PATH)
                        if (response.result && response.result.status && response.result.status.message) {
                            const message = response.result.status.message;
                            if (message.parts && Array.isArray(message.parts)) {
                                for (const part of message.parts) {
                                    if (part.text) {
                                        extractedText += part.text;
                                    } else if (part.file && part.file.bytes) {
                                        // Handle file artifacts (base64 encoded)
                                        try {
                                            const decodedBytes = atob(part.file.bytes);
                                            extractedText += decodedBytes;
                                        } catch (decodeErr) {
                                            console.error('Error decoding base64 bytes:', decodeErr);
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Method 2: response.result.message.parts[].text
                        if (!extractedText && response.result && response.result.message) {
                            const message = response.result.message;
                            if (message.parts && Array.isArray(message.parts)) {
                                for (const part of message.parts) {
                                    if (part.text) {
                                        extractedText += part.text;
                                    }
                                }
                            }
                        }
                        
                        // Method 3: response.result.parts directly
                        if (!extractedText && response.result && response.result.parts) {
                            for (const part of response.result.parts) {
                                if (part.text) {
                                    extractedText += part.text;
                                }
                            }
                        }
                        
                        // Method 4: response.result.text field directly
                        if (!extractedText && response.result && response.result.text) {
                            extractedText = response.result.text;
                        }
                        
                        // Method 5: Check history array
                        if (!extractedText && response.result && response.result.history && Array.isArray(response.result.history)) {
                            for (const historyItem of response.result.history) {
                                if (historyItem.parts && Array.isArray(historyItem.parts)) {
                                    for (const part of historyItem.parts) {
                                        if (part.text) {
                                            extractedText += part.text;
                                        }
                                    }
                                }
                            }
                        }
                        
                        console.log('Extracted text:', extractedText);
                        
                        thinkingMessage.remove();
                        if (extractedText) {
                            this.addMessage('agent', extractedText);
                        } else {
                            console.warn('Could not extract text from response. Full response structure:', JSON.stringify(response, null, 2));
                            this.addMessage('system', 'Task completed but response format not recognized. Check console.');
                        }
                    } catch (err) {
                        console.error('Error parsing final_response:', err);
                        thinkingMessage.remove();
                        this.addMessage('system', 'Error parsing response.');
                    }
                });

                eventSource.addEventListener('artifact_update', (event) => {
                    try {
                        const update = JSON.parse(event.data);
                        console.log('Received artifact_update:', update);
                    } catch (err) {
                        console.error('Error parsing artifact_update:', err);
                    }
                });

                eventSource.addEventListener('error', (err) => {
                    console.error('SSE connection error on endpoint:', sseUrl, err);
                    clearTimeout(timeout);
                    eventSource.close();
                    // Try next endpoint
                    tryNextEndpoint();
                });

            } catch (err) {
                console.error('Failed to create EventSource:', err);
                // Try next endpoint
                tryNextEndpoint();
            }
        };

        tryNextEndpoint();
    }

    addMessage(type, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message message-${type}`;

        if (type === 'agent') {
            msgDiv.innerHTML = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        } else {
            msgDiv.textContent = text;
        }

        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return msgDiv;
    }

    updateStatus(connected) {
        this.statusIndicator.textContent = connected ? 'Online' : 'Offline';
        this.statusIndicator.style.color =
            connected ? 'var(--success-500)' : 'var(--error-500)';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatClient = new SAMChatClient();
});
