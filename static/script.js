// Global state
let pollingInterval = null;
let currentTab = 'summary';
let currentAgentTab = 'researcher';
let agentConfig = {
    researcher: {
        style: 'bullets',
        focus: ''
    },
    financial: {
        style: 'standard',
        focus: ''
    },
    strategic: {
        style: 'balanced',
        focus: ''
    },
    writer: {
        style: 'professional',
        length: 'medium'
    }
};

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function switchAgentTab(agentName) {
    currentAgentTab = agentName;

    // Update agent tab buttons
    document.querySelectorAll('.agent-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update agent panels
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
    const companyInput = document.getElementById('companyInput');
    const iconButtons = document.querySelectorAll('.icon-btn');
    companyInput.disabled = true;
    iconButtons.forEach(btn => btn.disabled = true);

    // Show progress and tabs
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('tabsContainer').style.display = 'flex';
    document.getElementById('tabContent').style.display = 'block';

    // Update company title
    document.getElementById('companyTitle').textContent = `${company} Analysis`;

    // Reset all outputs
    resetOutputs();

    try {
        // Start analysis
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
            throw new Error('Failed to start analysis');
        }

        // Start polling for updates
        startPolling();

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to start analysis. Please try again.');
        companyInput.disabled = false;
        iconButtons.forEach(btn => btn.disabled = false);
    }
}

// Reset all outputs
function resetOutputs() {
    // Reset badges
    const agents = ['researcher', 'financial', 'strategic', 'writer'];
    agents.forEach(agent => {
        const badge = document.getElementById(`badge-${agent}`);
        badge.className = 'badge pending';

        const output = document.getElementById(`${agent}-output`);
        output.innerHTML = '<p class="placeholder">Waiting to start...</p>';
    });

    // Reset summary
    document.getElementById('summaryContent').innerHTML = '<p class="placeholder">Analysis in progress...</p>';

    // Reset progress
    updateProgress(0);
}

// Poll for status updates
function startPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch('/status');
            const data = await response.json();

            updateUI(data);

            // Stop polling if completed or error
            if (data.status === 'completed' || data.status === 'error') {
                clearInterval(pollingInterval);
                pollingInterval = null;

                const companyInput = document.getElementById('companyInput');
                const iconButtons = document.querySelectorAll('.icon-btn');
                companyInput.disabled = false;
                iconButtons.forEach(btn => btn.disabled = false);
            }

        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 1000); // Poll every second
}

// Update UI with status data
function updateUI(data) {
    // Update progress
    updateProgress(data.progress || 0);

    // Update each agent
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
                output.innerHTML = formatOutput(agentData.output);
            } else {
                const statusText = {
                    'pending': 'Waiting to start...',
                    'working': 'Working on analysis...',
                    'completed': 'Completed!',
                    'error': 'Error occurred'
                };
                output.innerHTML = `<p class="placeholder">${statusText[agentData.status] || 'Processing...'}</p>`;
            }
        }
    });

    // Update summary with elaborate display
    if (data.summary) {
        const summaryContent = createElaborateSummary(data);
        document.getElementById('summaryContent').innerHTML = summaryContent;
    } else if (data.status === 'running') {
        // Show progress summary while running
        const progressSummary = createProgressSummary(data);
        document.getElementById('summaryContent').innerHTML = progressSummary;
    }
}

// Create elaborate summary display
function createElaborateSummary(data) {
    const agentStatuses = {
        researcher: data.researcher?.status || 'pending',
        financial: data.financial?.status || 'pending',
        strategic: data.strategic?.status || 'pending',
        writer: data.writer?.status || 'pending'
    };

    const completedCount = Object.values(agentStatuses).filter(s => s === 'completed').length;
    const totalAgents = 4;

    let html = `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; min-width: 120px;">
                    <div style="font-size: 2rem; font-weight: 300; color: #00ff88;">${completedCount}/${totalAgents}</div>
                    <div style="font-size: 0.85rem; color: #888; margin-top: 0.25rem;">Agents Complete</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; min-width: 120px;">
                    <div style="font-size: 2rem; font-weight: 300; color: #ffd700;">${data.progress || 0}%</div>
                    <div style="font-size: 0.85rem; color: #888; margin-top: 0.25rem;">Progress</div>
                </div>
            </div>
        </div>
    `;

    if (data.summary) {
        html += `
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem;">
                <h3 style="font-size: 1.2rem; font-weight: 400; margin-bottom: 1rem; color: #fff;">Executive Summary</h3>
                <div style="font-size: 1rem; line-height: 1.8; color: #ccc;">
                    ${formatOutput(data.summary)}
                </div>
            </div>
        `;
    }

    return html;
}

// Create progress summary while analysis is running
function createProgressSummary(data) {
    const agentNames = {
        researcher: 'Research Agent',
        financial: 'Financial Agent',
        strategic: 'Strategic Agent',
        writer: 'Report Writer'
    };

    let html = '<div style="text-align: center; margin: 2rem 0;"><p style="color: #888; font-size: 1rem; margin-bottom: 2rem;">Analysis in progress...</p>';

    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem;">';

    ['researcher', 'financial', 'strategic', 'writer'].forEach(agent => {
        const agentData = data[agent] || { status: 'pending' };
        const statusEmoji = {
            'pending': '⏳',
            'working': '🔄',
            'completed': '✅',
            'error': '❌'
        };
        const statusColor = {
            'pending': '#666',
            'working': '#ffd700',
            'completed': '#00ff88',
            'error': '#ff4444'
        };

        html += `
            <div style="padding: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${statusEmoji[agentData.status]}</div>
                <div style="font-size: 0.9rem; color: ${statusColor[agentData.status]}; font-weight: 400; margin-bottom: 0.25rem;">${agentData.status.toUpperCase()}</div>
                <div style="font-size: 0.85rem; color: #888;">${agentNames[agent]}</div>
            </div>
        `;
    });

    html += '</div></div>';

    return html;
}

// Format output text
function formatOutput(text) {
    // Convert markdown-style formatting to HTML
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\n/g, '<br>') // Line breaks
        .replace(/^• /gm, '&bull; ') // Bullet points
        .replace(/^(\d+\.)/gm, '<strong>$1</strong>'); // Numbered lists

    return formatted;
}

// Update progress bar
function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    progressBar.style.setProperty('--progress', `${percent}%`);
    progressText.textContent = `${percent}%`;
}

// Configuration functions
function toggleConfig() {
    const panel = document.getElementById('configPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        loadConfig();
    } else {
        panel.style.display = 'none';
    }
}

function loadConfig() {
    // Load from localStorage if available
    const saved = localStorage.getItem('agentConfig');
    if (saved) {
        agentConfig = JSON.parse(saved);
    }

    // Populate form fields
    document.getElementById('researcher-style').value = agentConfig.researcher.style;
    document.getElementById('researcher-focus').value = agentConfig.researcher.focus;
    document.getElementById('financial-style').value = agentConfig.financial.style;
    document.getElementById('financial-focus').value = agentConfig.financial.focus;
    document.getElementById('strategic-style').value = agentConfig.strategic.style;
    document.getElementById('strategic-focus').value = agentConfig.strategic.focus;
    document.getElementById('writer-style').value = agentConfig.writer.style;
    document.getElementById('writer-length').value = agentConfig.writer.length;
}

function saveConfig() {
    // Get values from form
    agentConfig.researcher.style = document.getElementById('researcher-style').value;
    agentConfig.researcher.focus = document.getElementById('researcher-focus').value;
    agentConfig.financial.style = document.getElementById('financial-style').value;
    agentConfig.financial.focus = document.getElementById('financial-focus').value;
    agentConfig.strategic.style = document.getElementById('strategic-style').value;
    agentConfig.strategic.focus = document.getElementById('strategic-focus').value;
    agentConfig.writer.style = document.getElementById('writer-style').value;
    agentConfig.writer.length = document.getElementById('writer-length').value;

    // Save to localStorage
    localStorage.setItem('agentConfig', JSON.stringify(agentConfig));

    // Show confirmation
    alert('Configuration saved! Your preferences will be used in the next analysis.');
    toggleConfig();
}

function resetConfig() {
    // Reset to defaults
    agentConfig = {
        researcher: { style: 'bullets', focus: '' },
        financial: { style: 'standard', focus: '' },
        strategic: { style: 'balanced', focus: '' },
        writer: { style: 'professional', length: 'medium' }
    };

    // Clear localStorage
    localStorage.removeItem('agentConfig');

    // Reload form
    loadConfig();

    alert('Configuration reset to defaults!');
}

// Handle Enter key in input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('companyInput');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startAnalysis();
        }
    });

    // Load saved config on page load
    const saved = localStorage.getItem('agentConfig');
    if (saved) {
        agentConfig = JSON.parse(saved);
    }
});
