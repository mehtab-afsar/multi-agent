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

        // Update UI with complete results
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

// Show loading state
function showLoadingState() {
    const agents = ['researcher', 'financial', 'strategic', 'writer'];

    // Show progress in summary
    const progressSummary = createProgressSummary({
        researcher: { status: 'working' },
        financial: { status: 'pending' },
        strategic: { status: 'pending' },
        writer: { status: 'pending' }
    });
    document.getElementById('summaryContent').innerHTML = progressSummary;
    lucide.createIcons();

    // Update progress bar
    updateProgress(10);
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
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: ${isCompleted ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.03)'}; border: 1px solid ${isCompleted ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.08)'}; border-radius: 12px; transition: all 0.3s ease;">
                <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${isCompleted ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.05)'} 0%, ${isCompleted ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)'} 100%); border-radius: 10px; border: 1px solid ${isCompleted ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)'};">
                    <i data-lucide="${config.icon}" style="width: 20px; height: 20px; color: ${isCompleted ? '#00ff88' : config.color};"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.95rem; font-weight: 400; color: #fff; margin-bottom: 0.25rem;">${config.name} Agent</div>
                    <div style="font-size: 0.8rem; color: #888; text-transform: capitalize;">${agentData.status}</div>
                </div>
                <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
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

// Format output text
function formatOutput(text) {
    // Convert markdown-style formatting to HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

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
});
