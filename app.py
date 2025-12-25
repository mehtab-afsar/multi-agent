# app.py - Flask Backend with WebSocket-like updates

import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq
from tavily import TavilyClient
from dotenv import load_dotenv
import time
from threading import Thread
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

groq = Groq(api_key=os.getenv("GROQ_API_KEY"))
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# Global storage for agent outputs
analysis_results = {
    'status': 'idle',
    'company': '',
    'researcher': {'status': 'pending', 'output': ''},
    'financial': {'status': 'pending', 'output': ''},
    'strategic': {'status': 'pending', 'output': ''},
    'writer': {'status': 'pending', 'output': ''},
    'summary': '',
    'progress': 0
}

# Agent configuration
agent_config = {
    'researcher': {'style': 'bullets', 'focus': ''},
    'financial': {'style': 'standard', 'focus': ''},
    'strategic': {'style': 'balanced', 'focus': ''},
    'writer': {'style': 'professional', 'length': 'medium'}
}

# Style mappings for prompts
STYLE_PROMPTS = {
    'researcher': {
        'bullets': 'Summarize the key news points in 3-4 bullet points.',
        'detailed': 'Provide a detailed paragraph analysis of the news, connecting themes and implications.',
        'concise': 'Summarize in 2-3 extremely concise sentences, focusing only on the most critical information.',
        'technical': 'Provide a technical deep-dive analysis, including technical specifications, innovations, and industry implications.'
    },
    'financial': {
        'standard': 'Extract and present key financial metrics in bullet points (stock price, market cap, revenue, etc.)',
        'detailed': 'Provide detailed financial analysis including trend analysis, year-over-year comparisons, and financial health indicators.',
        'ratios': 'Focus on financial ratios, valuation metrics (P/E, P/S, P/B), and comparative analysis.',
        'growth': 'Emphasize growth metrics, revenue trends, market expansion, and future growth potential.'
    },
    'strategic': {
        'balanced': 'Provide 3 key insights: 1. Market Position 2. Key Opportunities 3. Potential Risks. Be specific and actionable.',
        'swot': 'Provide a comprehensive SWOT analysis (Strengths, Weaknesses, Opportunities, Threats).',
        'competitive': 'Focus on competitive positioning, market share, competitive advantages, and comparison with key competitors.',
        'future': 'Focus on future outlook, emerging trends, strategic positioning for future growth, and long-term potential.'
    },
    'writer': {
        'professional': 'Create a clear, professional company analysis report.',
        'executive': 'Create a concise executive summary style report focusing on key decisions and strategic implications.',
        'detailed': 'Create a comprehensive, detailed report with in-depth analysis and supporting evidence.',
        'investor': 'Create an investor-focused report emphasizing financial performance, growth potential, and investment thesis.'
    },
    'length': {
        'short': 'Keep the report concise and to the point, under 300 words.',
        'medium': 'Create a balanced report of moderate length (300-500 words).',
        'long': 'Create a comprehensive, detailed report (500-800 words) with thorough analysis.'
    }
}

def call_llm(system_prompt, user_input):
    """Call Groq LLM"""
    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ],
        max_tokens=1000,
        temperature=0.7
    )
    return response.choices[0].message.content

def researcher_agent(company):
    """Searches web for latest news"""
    global analysis_results, agent_config
    analysis_results['researcher']['status'] = 'working'

    try:
        # Build search query with focus if provided
        search_query = f"{company} latest news 2024"
        if agent_config['researcher']['focus']:
            search_query += f" {agent_config['researcher']['focus']}"

        results = tavily.search(search_query, max_results=5)

        news_items = []
        for i, r in enumerate(results['results'][:5], 1):
            news_items.append(f"{i}. {r['title']}\n   {r['content'][:150]}...\n   Source: {r['url']}")

        news_text = "\n\n".join(news_items)

        # Get style-specific prompt
        style_prompt = STYLE_PROMPTS['researcher'].get(agent_config['researcher']['style'], STYLE_PROMPTS['researcher']['bullets'])
        focus_instruction = f"\nFocus on: {agent_config['researcher']['focus']}" if agent_config['researcher']['focus'] else ""

        summary = call_llm(
            system_prompt=f"You are a research analyst. {style_prompt}{focus_instruction}",
            user_input=f"Analyze these news articles about {company}:\n\n{news_text}"
        )

        analysis_results['researcher']['output'] = f"Found {len(results['results'])} articles\n\n{summary}\n\n---\nRAW DATA:\n{news_text}"
        analysis_results['researcher']['status'] = 'completed'
        analysis_results['progress'] = 25

        return summary, news_text
    except Exception as e:
        analysis_results['researcher']['output'] = f"Error: {str(e)}"
        analysis_results['researcher']['status'] = 'error'
        raise

def financial_agent(company):
    """Gets financial data"""
    global analysis_results, agent_config
    analysis_results['financial']['status'] = 'working'

    try:
        # Build search query with focus if provided
        search_query = f"{company} stock price market cap revenue 2024"
        if agent_config['financial']['focus']:
            search_query += f" {agent_config['financial']['focus']}"

        results = tavily.search(search_query, max_results=3)

        financial_text = "\n\n".join([r['content'] for r in results['results'][:3]])

        # Get style-specific prompt
        style_prompt = STYLE_PROMPTS['financial'].get(agent_config['financial']['style'], STYLE_PROMPTS['financial']['standard'])
        focus_instruction = f"\nAdditionally analyze: {agent_config['financial']['focus']}" if agent_config['financial']['focus'] else ""

        analysis = call_llm(
            system_prompt=f"You are a financial analyst. {style_prompt}{focus_instruction}",
            user_input=f"Analyze financial data for {company} from:\n\n{financial_text}"
        )

        analysis_results['financial']['output'] = f"{analysis}\n\n---\nRAW DATA:\n{financial_text}"
        analysis_results['financial']['status'] = 'completed'
        analysis_results['progress'] = 50

        return analysis
    except Exception as e:
        analysis_results['financial']['output'] = f"Error: {str(e)}"
        analysis_results['financial']['status'] = 'error'
        raise

def strategic_agent(company, research, financials):
    """Provides strategic insights"""
    global analysis_results, agent_config
    analysis_results['strategic']['status'] = 'working'

    try:
        # Get style-specific prompt
        style_prompt = STYLE_PROMPTS['strategic'].get(agent_config['strategic']['style'], STYLE_PROMPTS['strategic']['balanced'])
        focus_instruction = f"\nContext to consider: {agent_config['strategic']['focus']}" if agent_config['strategic']['focus'] else ""

        insights = call_llm(
            system_prompt=f"You are a strategic business analyst. {style_prompt}{focus_instruction}",
            user_input=f"""Analyze {company}:

            RECENT NEWS:
            {research}

            FINANCIAL STATUS:
            {financials}

            Provide strategic insights."""
        )

        analysis_results['strategic']['output'] = insights
        analysis_results['strategic']['status'] = 'completed'
        analysis_results['progress'] = 75

        return insights
    except Exception as e:
        analysis_results['strategic']['output'] = f"Error: {str(e)}"
        analysis_results['strategic']['status'] = 'error'
        raise

def writer_agent(company, research, financials, insights):
    """Creates final report"""
    global analysis_results, agent_config
    analysis_results['writer']['status'] = 'working'

    try:
        # Get style-specific prompts
        style_prompt = STYLE_PROMPTS['writer'].get(agent_config['writer']['style'], STYLE_PROMPTS['writer']['professional'])
        length_prompt = STYLE_PROMPTS['length'].get(agent_config['writer']['length'], STYLE_PROMPTS['length']['medium'])

        report = call_llm(
            system_prompt=f"""You are an executive report writer. {style_prompt}
            Include these sections:
            1. Executive Summary (2-3 sentences)
            2. Recent Developments
            3. Financial Overview
            4. Strategic Assessment
            5. Conclusion

            {length_prompt}""",
            user_input=f"""Create executive report for {company}:

            RESEARCH:
            {research}

            FINANCIALS:
            {financials}

            INSIGHTS:
            {insights}
            """
        )

        analysis_results['writer']['output'] = report
        analysis_results['writer']['status'] = 'completed'
        analysis_results['summary'] = report
        analysis_results['progress'] = 100

        return report
    except Exception as e:
        analysis_results['writer']['output'] = f"Error: {str(e)}"
        analysis_results['writer']['status'] = 'error'
        raise

def run_analysis(company):
    """Background thread to run all agents"""
    global analysis_results

    try:
        analysis_results['status'] = 'running'
        analysis_results['company'] = company
        analysis_results['summary'] = ''
        analysis_results['progress'] = 0

        # Reset all agents
        for agent in ['researcher', 'financial', 'strategic', 'writer']:
            analysis_results[agent] = {'status': 'pending', 'output': ''}

        # Run agents sequentially
        research_summary, raw_news = researcher_agent(company)
        financial_analysis = financial_agent(company)
        strategic_insights = strategic_agent(company, research_summary, financial_analysis)
        final_report = writer_agent(company, research_summary, financial_analysis, strategic_insights)

        analysis_results['status'] = 'completed'

        # Save report
        filename = f"{company.lower().replace(' ', '_')}_report.txt"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"MULTI-AGENT ANALYSIS: {company.upper()}\n")
            f.write("="*70 + "\n\n")
            f.write("RESEARCH FINDINGS:\n")
            f.write(research_summary + "\n\n")
            f.write("="*70 + "\n\n")
            f.write("FINANCIAL ANALYSIS:\n")
            f.write(financial_analysis + "\n\n")
            f.write("="*70 + "\n\n")
            f.write("STRATEGIC INSIGHTS:\n")
            f.write(strategic_insights + "\n\n")
            f.write("="*70 + "\n\n")
            f.write("EXECUTIVE REPORT:\n")
            f.write(final_report + "\n")

    except Exception as e:
        analysis_results['status'] = 'error'
        analysis_results['summary'] = f"Error during analysis: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    global agent_config
    data = request.json
    company = data.get('company', '')
    config = data.get('config', {})

    if not company:
        return jsonify({'error': 'Company name required'}), 400

    # Update agent configuration if provided
    if config:
        agent_config = config

    # Start analysis in background thread
    thread = Thread(target=run_analysis, args=(company,))
    thread.daemon = True
    thread.start()

    return jsonify({'status': 'started', 'company': company})

@app.route('/status')
def get_status():
    return jsonify(analysis_results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
