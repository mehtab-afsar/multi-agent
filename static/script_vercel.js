// script_vercel.js - Frontend for Vercel (synchronous)

let agentConfig = {
    researcher: { style: 'bullets', focus: '' },
    financial: { style: 'standard', focus: '' },
    strategic: { style: 'balanced', focus: '' },
    writer: { style: 'professional', length: 'medium' }
};

// Load config from localStorage
function loadConfig() {
    const saved = localStorage.getItem('agentConfig');
    if (saved) {
        agentConfig = JSON.parse(saved);
        updateConfigUI();
    }
}

// Save config to localStorage
function saveConfig() {
    localStorage.setItem('agentConfig', JSON.stringify(agentConfig));
}

// Update config UI with current values
function updateConfigUI() {
    document.getElementById('researcher-style').value = agentConfig.researcher.style;
    document.getElementById('researcher-focus').value = agentConfig.researcher.focus;
    document.getElementById('financial-style').value = agentConfig.financial.style;
    document.getElementById('financial-focus').value = agentConfig.financial.focus;
    document.getElementById('strategic-style').value = agentConfig.strategic.style;
    document.getElementById('strategic-focus').value = agentConfig.strategic.focus;
    document.getElementById('writer-style').value = agentConfig.writer.style;
    document.getElementById('writer-length').value = agentConfig.writer.length;
}

// Toggle configuration panel
function toggleConfig() {
    const panel = document.getElementById('configPanel');
    panel.classList.toggle('active');
}

// Apply configuration
function applyConfig() {
    agentConfig.researcher.style = document.getElementById('researcher-style').value;
    agentConfig.researcher.focus = document.getElementById('researcher-focus').value;
    agentConfig.financial.style = document.getElementById('financial-style').value;
    agentConfig.financial.focus = document.getElementById('financial-focus').value;
    agentConfig.strategic.style = document.getElementById('strategic-style').value;
    agentConfig.strategic.focus = document.getElementById('strategic-focus').value;
    agentConfig.writer.style = document.getElementById('writer-style').value;
    agentConfig.writer.length = document.getElementById('writer-length').value;

    saveConfig();
    toggleConfig();
}

// Toggle agent config section
function toggleAgentConfig(agent) {
    const section = document.getElementById(`${agent}-config`);
    const icon = section.previousElementSibling.querySelector('i[data-lucide="chevron-down"]');

    section.classList.toggle('active');

    if (section.classList.contains('active')) {
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
}

// Switch main tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');

    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    lucide.createIcons();
}

// Switch agent tabs
function switchAgentTab(agentName) {
    document.querySelectorAll('.agent-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    document.querySelectorAll('.agent-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${agentName}-panel`).classList.add('active');
}

// Start analysis
async function startAnalysis() {
    const companyInput = document.getElementById('companyInput');
    const company = companyInput.value.trim();

    if (!company) {
        alert('Please enter a company name');
        return;
    }

    // Disable input and icons during analysis
    const iconButtons = document.querySelectorAll('.icon-btn');
    companyInput.disabled = true;
    iconButtons.forEach(btn => btn.disabled = true);

    // Hide the agent flow diagram
    const agentFlow = document.getElementById('agentFlow');
    if (agentFlow) {
        agentFlow.classList.add('hide');
        setTimeout(() => {
            agentFlow.style.display = 'none';
        }, 500);
    }

    // Show analysis content
    document.getElementById('analysisContent').style.display = 'block';
    document.getElementById('companyTitle').textContent = `${company} Analysis`;

    // Reset outputs
    resetOutputs();

    // Show loading state
    showLoadingState();

    try {
        // Make synchronous API call (will wait for complete response)
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                company,
                config: agentConfig
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        // Clear the simulated progress interval
        if (window.progressSimulationInterval) {
            clearInterval(window.progressSimulationInterval);
        }

        // Update UI with complete results
        updateProgress(100);
        updateUI(data);

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to complete analysis. Please try again.');

        // Show error state
        document.getElementById('summaryContent').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ff4444;">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <p>Error: ${error.message}</p>
            </div>
        `;
        lucide.createIcons();
    } finally {
        // Re-enable input
        companyInput.disabled = false;
        iconButtons.forEach(btn => btn.disabled = false);
    }
}

// Show loading state with simulated progress
function showLoadingState() {
    const agents = ['researcher', 'financial', 'strategic', 'writer'];
    let simulatedProgress = 0;
    let lastAgentState = null;
    let progressInitialized = false;

    // Initial state - all pending except first one working
    const initialState = {
        researcher: { status: 'working' },
        financial: { status: 'pending' },
        strategic: { status: 'pending' },
        writer: { status: 'pending' }
    };

    const progressSummary = createProgressSummary(initialState);
    document.getElementById('summaryContent').innerHTML = progressSummary;
    lucide.createIcons();
    progressInitialized = true;
    lastAgentState = JSON.stringify(initialState);

    // Update progress bar
    updateProgress(5);

    // Simulate progress updates (only update UI when agent states change)
    const progressInterval = setInterval(() => {
        simulatedProgress += 1.5;

        // Cap at 95% (save last 5% for actual completion)
        if (simulatedProgress < 95) {
            // Always update progress bar smoothly
            updateProgress(Math.min(simulatedProgress, 95));

            // Determine agent states based on progress
            let agentStates = {
                researcher: { status: 'pending' },
                financial: { status: 'pending' },
                strategic: { status: 'pending' },
                writer: { status: 'pending' }
            };

            if (simulatedProgress > 5) agentStates.researcher = { status: 'working' };
            if (simulatedProgress > 25) {
                agentStates.researcher = { status: 'completed' };
                agentStates.financial = { status: 'working' };
            }
            if (simulatedProgress > 50) {
                agentStates.financial = { status: 'completed' };
                agentStates.strategic = { status: 'working' };
            }
            if (simulatedProgress > 75) {
                agentStates.strategic = { status: 'completed' };
                agentStates.writer = { status: 'working' };
            }

            // Only update UI if agent states actually changed (prevents blinking)
            const currentAgentState = JSON.stringify(agentStates);
            if (currentAgentState !== lastAgentState) {
                // Use updateProgressDisplay instead of recreating everything
                updateProgressDisplay(agentStates);
                lastAgentState = currentAgentState;
            }
        } else {
            clearInterval(progressInterval);
        }
    }, 100); // Check more frequently but only update DOM when state changes

    // Store interval ID so we can clear it when analysis completes
    window.progressSimulationInterval = progressInterval;
}

// Reset outputs
function resetOutputs() {
    const agents = ['researcher', 'financial', 'strategic', 'writer'];
    agents.forEach(agent => {
        const badge = document.getElementById(`badge-${agent}`);
        badge.className = 'badge pending';

        const output = document.getElementById(`${agent}-output`);
        output.innerHTML = '<p class="placeholder">Waiting to start...</p>';
    });

    document.getElementById('summaryContent').innerHTML = '<p class="placeholder">Analysis in progress...</p>';

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    if (progressBar) {
        progressBar.style.setProperty('--progress', '0%');
    }
    if (progressText) {
        progressText.textContent = '0%';
    }
}

// Update UI with results
function updateUI(data) {
    // Update progress
    updateProgress(data.progress || 100);

    // Update agent outputs and badges
    const agents = ['researcher', 'financial', 'strategic', 'writer'];
    agents.forEach(agent => {
        const agentData = data[agent];
        if (agentData) {
            // Update badge
            const badge = document.getElementById(`badge-${agent}`);
            badge.className = `badge ${agentData.status}`;

            // Update output
            const output = document.getElementById(`${agent}-output`);
            if (agentData.output) {
                output.innerHTML = `<div class="agent-result">${formatOutput(agentData.output)}</div>`;
            }
        }
    });

    // Update summary
    if (data.summary) {
        const summaryContent = createElaborateSummary(data);
        document.getElementById('summaryContent').innerHTML = summaryContent;
    }

    // Reinitialize icons
    lucide.createIcons();

    // After 1 second, switch to chat interface
    console.log('Setting timeout to switch to chat interface...');
    setTimeout(() => {
        const companyTitle = document.getElementById('companyTitle');
        if (companyTitle) {
            const company = companyTitle.textContent.replace(' Analysis', '');
            console.log('Timeout executed, switching to chat for:', company);
            switchToChatInterface(company, data);
        } else {
            console.error('Company title element not found');
        }
    }, 1000);
}

// Update progress bar
function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (progressBar) {
        progressBar.style.setProperty('--progress', `${percent}%`);
    }
    if (progressText) {
        progressText.textContent = `${percent}%`;
    }
}

// Create elaborate summary
function createElaborateSummary(data) {
    let html = '';

    if (data.summary) {
        html = `
            <div>
                <h3 style="font-size: 1.2rem; font-weight: 400; margin-bottom: 1rem; color: #fff; text-align: center;">Executive Summary</h3>
                <div style="font-size: 1rem; line-height: 1.8; color: #ccc;">
                    ${formatOutput(data.summary)}
                </div>
            </div>
        `;
    }

    return html;
}

// Update progress display without recreating icons (prevents blinking)
function updateProgressDisplay(data) {
    const agentConfig = {
        researcher: { name: 'Research', icon: 'search', color: '#64c8ff' },
        financial: { name: 'Financial', icon: 'trending-up', color: '#00ff88' },
        strategic: { name: 'Strategic', icon: 'target', color: '#ffd700' },
        writer: { name: 'Report', icon: 'file-text', color: '#ff6b9d' }
    };

    ['researcher', 'financial', 'strategic', 'writer'].forEach((agent, index) => {
        const agentData = data[agent] || { status: 'pending' };
        const config = agentConfig[agent];
        const isCompleted = agentData.status === 'completed';
        const isWorking = agentData.status === 'working';

        // Update the agent card in the progress summary
        const agentCards = document.querySelectorAll('#summaryContent .agent-progress-card');
        if (agentCards[index]) {
            const card = agentCards[index];

            // Update background and border with smooth transition
            card.style.transition = 'all 0.5s ease';
            if (isCompleted) {
                card.style.background = 'rgba(0, 255, 136, 0.05)';
                card.style.borderColor = 'rgba(0, 255, 136, 0.2)';
            } else {
                card.style.background = 'rgba(255, 255, 255, 0.03)';
                card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }

            // Update icon container
            const iconContainer = card.querySelector('.agent-icon-container');
            if (iconContainer) {
                iconContainer.style.transition = 'all 0.5s ease';
                if (isCompleted) {
                    iconContainer.style.background = 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.05) 100%)';
                    iconContainer.style.borderColor = 'rgba(0, 255, 136, 0.3)';
                } else {
                    iconContainer.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)';
                    iconContainer.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }

                // Update icon color
                const agentIcon = iconContainer.querySelector('svg');
                if (agentIcon) {
                    agentIcon.style.transition = 'color 0.5s ease';
                    agentIcon.style.color = isCompleted ? '#00ff88' : config.color;
                }
            }

            // Update status text
            const statusText = card.querySelector('.agent-status-text');
            if (statusText) {
                statusText.textContent = agentData.status.charAt(0).toUpperCase() + agentData.status.slice(1);
            }

            // Update status icon color and animation without recreating
            const statusIconContainer = card.querySelector('.agent-status-icon');
            if (statusIconContainer) {
                const statusColor = {
                    'pending': '#666',
                    'working': config.color,
                    'completed': '#00ff88',
                    'error': '#ff4444'
                };

                const statusSvg = statusIconContainer.querySelector('svg');
                if (statusSvg) {
                    statusSvg.style.transition = 'color 0.5s ease';
                    statusSvg.style.color = statusColor[agentData.status];

                    if (isWorking) {
                        statusSvg.style.animation = 'spin 2s linear infinite';
                    } else {
                        statusSvg.style.animation = '';
                    }
                }
            }
        }
    });
}

// Create progress summary while analysis is running
function createProgressSummary(data) {
    const agentConfig = {
        researcher: { name: 'Research', icon: 'search', color: '#64c8ff' },
        financial: { name: 'Financial', icon: 'trending-up', color: '#00ff88' },
        strategic: { name: 'Strategic', icon: 'target', color: '#ffd700' },
        writer: { name: 'Report', icon: 'file-text', color: '#ff6b9d' }
    };

    let html = '<div style="max-width: 600px; margin: 2rem auto;">';

    // Header
    html += '<div style="text-align: center; margin-bottom: 2rem;">';
    html += '<div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(100, 200, 255, 0.1); border: 1px solid rgba(100, 200, 255, 0.2); border-radius: 24px;">';
    html += '<div class="spinner" style="width: 16px; height: 16px; border: 2px solid rgba(100, 200, 255, 0.3); border-top-color: #64c8ff; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
    html += '<span style="color: #64c8ff; font-size: 0.9rem; font-weight: 400;">Processing Analysis</span>';
    html += '</div></div>';

    // Compact agent list
    html += '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';

    ['researcher', 'financial', 'strategic', 'writer'].forEach(agent => {
        const agentData = data[agent] || { status: 'pending' };
        const config = agentConfig[agent];

        const statusIcon = {
            'pending': 'clock',
            'working': 'loader',
            'completed': 'check-circle',
            'error': 'x-circle'
        };

        const statusColor = {
            'pending': '#666',
            'working': config.color,
            'completed': '#00ff88',
            'error': '#ff4444'
        };

        const isWorking = agentData.status === 'working';
        const isCompleted = agentData.status === 'completed';

        html += `
            <div class="agent-progress-card" style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: ${isCompleted ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.03)'}; border: 1px solid ${isCompleted ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.08)'}; border-radius: 12px; transition: all 0.3s ease;">
                <div class="agent-icon-container" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${isCompleted ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)'} 0%, ${isCompleted ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)'} 100%); border-radius: 10px; border: 1px solid ${isCompleted ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)'};">
                    <i data-lucide="${config.icon}" style="width: 20px; height: 20px; color: ${isCompleted ? '#00ff88' : config.color};"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.95rem; font-weight: 400; color: #fff; margin-bottom: 0.25rem;">${config.name} Agent</div>
                    <div class="agent-status-text" style="font-size: 0.8rem; color: #888; text-transform: capitalize;">${agentData.status}</div>
                </div>
                <div class="agent-status-icon" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${statusIcon[agentData.status]}" style="width: 20px; height: 20px; color: ${statusColor[agentData.status]}; ${isWorking ? 'animation: spin 2s linear infinite;' : ''}"></i>
                </div>
            </div>
        `;
    });

    html += '</div></div>';

    // Add CSS for spinner animation
    html += `<style>
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>`;

    return html;
}

// Format output text with rich markdown formatting (ChatGPT-style)
function formatOutput(text) {
    if (!text) return '';

    // Split into paragraphs first
    let paragraphs = text.split('\n\n');

    let formatted = paragraphs.map(para => {
        // Skip empty paragraphs
        if (!para.trim()) return '';

        // Headers (## for h2, ### for h3)
        if (para.startsWith('### ')) {
            return `<h3 class="output-h3">${para.substring(4)}</h3>`;
        }
        if (para.startsWith('## ')) {
            return `<h2 class="output-h2">${para.substring(3)}</h2>`;
        }
        if (para.startsWith('# ')) {
            return `<h1 class="output-h1">${para.substring(2)}</h1>`;
        }

        // Bullet lists (lines starting with - or *)
        if (para.match(/^[\-\*]\s/m)) {
            let items = para.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    if (line.match(/^[\-\*]\s/)) {
                        return `<li>${formatInline(line.substring(2))}</li>`;
                    }
                    return line;
                })
                .join('');
            return `<ul class="output-list">${items}</ul>`;
        }

        // Numbered lists (lines starting with 1. 2. etc)
        if (para.match(/^\d+\.\s/m)) {
            let items = para.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    if (line.match(/^\d+\.\s/)) {
                        return `<li>${formatInline(line.replace(/^\d+\.\s/, ''))}</li>`;
                    }
                    return line;
                })
                .join('');
            return `<ol class="output-list">${items}</ol>`;
        }

        // Code blocks (```...```)
        if (para.startsWith('```')) {
            let code = para.replace(/```\w*\n?/, '').replace(/```$/, '');
            return `<pre class="output-code"><code>${escapeHtml(code)}</code></pre>`;
        }

        // Regular paragraphs
        return `<p class="output-paragraph">${formatInline(para)}</p>`;
    }).join('');

    return formatted;
}

// Format inline elements (bold, italic, inline code, links)
function formatInline(text) {
    return text
        // Bold (**text**)
        .replace(/\*\*(.+?)\*\*/g, '<strong class="output-bold">$1</strong>')
        // Italic (*text*)
        .replace(/\*(.+?)\*/g, '<em class="output-italic">$1</em>')
        // Inline code (`code`)
        .replace(/`(.+?)`/g, '<code class="output-inline-code">$1</code>')
        // Line breaks
        .replace(/\n/g, '<br>');
}

// Escape HTML for code blocks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global state for chat
let currentCompany = '';
let analysisData = {};
let chatHistory = [];

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    lucide.createIcons();

    const input = document.getElementById('companyInput');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !input.disabled) {
            startAnalysis();
        }
    });

    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });

        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = chatInput.scrollHeight + 'px';
        });
    }
});

// Switch to chat interface after analysis
function switchToChatInterface(company, data) {
    console.log('Switching to chat interface for:', company);
    currentCompany = company;
    analysisData = data;

    // Hide only the header and agent flow diagram
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';

    const agentFlow = document.getElementById('agentFlow');
    if (agentFlow) agentFlow.style.display = 'none';

    const initialInputSection = document.getElementById('initialInputSection');
    if (initialInputSection) initialInputSection.style.display = 'none';

    // Keep analysisContent visible (summary + agents tabs)
    const analysisContent = document.getElementById('analysisContent');
    if (analysisContent) {
        analysisContent.style.display = 'block';
        analysisContent.style.marginBottom = '2rem';
    }

    // Show chat interface below the analysis
    const chatInterface = document.getElementById('chatInterface');
    if (chatInterface) {
        chatInterface.style.display = 'block';
        chatInterface.style.position = 'relative';
        chatInterface.style.height = 'auto';
        chatInterface.style.minHeight = '500px';
        console.log('Chat interface shown');
    } else {
        console.error('Chat interface element not found!');
    }

    // Update company name in chat
    const chatName = document.getElementById('chatCompanyName');
    if (chatName) chatName.textContent = company;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initialize icons
    lucide.createIcons();
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('chatSidebar');
    sidebar.classList.toggle('collapsed');

    const icon = document.querySelector('.sidebar-toggle-btn-new i');
    if (icon) {
        if (sidebar.classList.contains('collapsed')) {
            icon.setAttribute('data-lucide', 'panel-left-open');
        } else {
            icon.setAttribute('data-lucide', 'panel-left-close');
        }
        lucide.createIcons();
    }
}

// Add conversation item to sidebar
function addConversationToSidebar(question, answer) {
    if (!question || !answer) return;

    const historyContainer = document.getElementById('conversationHistory');
    if (!historyContainer) return;

    // Remove placeholder if exists
    const placeholder = historyContainer.querySelector('.placeholder-small');
    if (placeholder) placeholder.remove();

    // Add conversation item
    const answerText = String(answer || '');
    const answerPreview = answerText.substring(0, 50).replace(/<[^>]*>/g, '') + '...';
    const itemHtml = `
        <div class="conversation-item">
            <div class="question">${escapeHtml(question.substring(0, 60))}${question.length > 60 ? '...' : ''}</div>
            <div class="answer-preview">${escapeHtml(answerPreview)}</div>
        </div>
    `;

    historyContainer.insertAdjacentHTML('afterbegin', itemHtml);
}

// Send chat message
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    const messagesContainer = document.getElementById('chatMessages');

    // Remove welcome message if exists
    const welcome = messagesContainer.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    // Add user message
    const userMessageHtml = `
        <div class="chat-message user">
            <div class="message-avatar">
                <i data-lucide="user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(message)}</div>
            </div>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', userMessageHtml);
    lucide.createIcons();

    // Add loading indicator
    const loadingHtml = `
        <div class="chat-message assistant loading-message">
            <div class="message-avatar">
                <i data-lucide="bot"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble loading">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', loadingHtml);
    lucide.createIcons();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        // Send to backend
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                company: currentCompany,
                message: message,
                context: {
                    summary: analysisData.summary || '',
                    researcher: analysisData.researcher?.output || '',
                    financial: analysisData.financial?.output || '',
                    strategic: analysisData.strategic?.output || '',
                    writer: analysisData.writer?.output || ''
                }
            }),
        });

        const data = await response.json();

        // Remove loading indicator
        const loadingMessage = messagesContainer.querySelector('.loading-message');
        if (loadingMessage) loadingMessage.remove();

        // Add assistant response
        const assistantMessageHtml = `
            <div class="chat-message assistant">
                <div class="message-avatar">
                    <i data-lucide="bot"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble">${formatOutput(data.response)}</div>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', assistantMessageHtml);
        lucide.createIcons();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add to conversation history in sidebar
        addConversationToSidebar(message, data.response);

    } catch (error) {
        console.error('Chat error:', error);

        // Remove loading indicator
        const loadingMessage = messagesContainer.querySelector('.loading-message');
        if (loadingMessage) loadingMessage.remove();

        // Try to get error details from response
        let errorMsg = 'Sorry, I encountered an error. Please try again.';
        if (error.message) {
            errorMsg += `<br><br><small style="color: #ff6b6b;">${error.message}</small>`;
        }

        // Show error message
        const errorMessageHtml = `
            <div class="chat-message assistant">
                <div class="message-avatar">
                    <i data-lucide="alert-circle"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        ${errorMsg}
                    </div>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', errorMessageHtml);
        lucide.createIcons();
    }
}

// Start new analysis
function startNewAnalysis() {
    // Hide chat interface and analysis content
    document.getElementById('chatInterface').style.display = 'none';
    const analysisContent = document.getElementById('analysisContent');
    if (analysisContent) analysisContent.style.display = 'none';

    // Show initial elements
    const header = document.querySelector('header');
    if (header) header.style.display = 'block';

    const agentFlow = document.getElementById('agentFlow');
    if (agentFlow) agentFlow.style.display = 'block';

    const initialInputSection = document.getElementById('initialInputSection');
    if (initialInputSection) initialInputSection.style.display = 'block';

    // Clear chat messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }

    // Clear conversation history
    const conversationHistory = document.getElementById('conversationHistory');
    if (conversationHistory) {
        conversationHistory.innerHTML = '<p class="placeholder-small">Ask questions to start a conversation</p>';
    }

    // Clear input
    document.getElementById('companyInput').value = '';

    // Reset state
    currentCompany = '';
    analysisData = {};
    chatHistory = [];

    lucide.createIcons();
}
