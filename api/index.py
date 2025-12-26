from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq
from tavily import TavilyClient
import os

app = Flask(__name__,
            template_folder='../templates',
            static_folder='../static')
CORS(app)

# Initialize clients lazily (only when needed)
def get_groq_client():
    return Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_tavily_client():
    return TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))

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
    groq = get_groq_client()
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
    global agent_config
    tavily = get_tavily_client()

    search_query = f"{company} latest news 2024"
    if agent_config['researcher']['focus']:
        search_query += f" {agent_config['researcher']['focus']}"

    results = tavily.search(search_query, max_results=5)

    news_items = []
    for i, r in enumerate(results['results'][:5], 1):
        news_items.append(f"{i}. {r['title']}\n   {r['content'][:150]}...\n   Source: {r['url']}")

    news_text = "\n\n".join(news_items)

    style_prompt = STYLE_PROMPTS['researcher'].get(agent_config['researcher']['style'], STYLE_PROMPTS['researcher']['bullets'])
    focus_instruction = f"\nFocus on: {agent_config['researcher']['focus']}" if agent_config['researcher']['focus'] else ""

    summary = call_llm(
        system_prompt=f"You are a research analyst. {style_prompt}{focus_instruction}",
        user_input=f"Analyze these news articles about {company}:\n\n{news_text}"
    )

    output = f"Found {len(results['results'])} articles\n\n{summary}\n\n---\nRAW DATA:\n{news_text}"
    return summary, news_text, output

def financial_agent(company):
    """Gets financial data"""
    global agent_config
    tavily = get_tavily_client()

    search_query = f"{company} stock price market cap revenue 2024"
    if agent_config['financial']['focus']:
        search_query += f" {agent_config['financial']['focus']}"

    results = tavily.search(search_query, max_results=3)
    financial_text = "\n\n".join([r['content'] for r in results['results'][:3]])

    style_prompt = STYLE_PROMPTS['financial'].get(agent_config['financial']['style'], STYLE_PROMPTS['financial']['standard'])
    focus_instruction = f"\nAdditionally analyze: {agent_config['financial']['focus']}" if agent_config['financial']['focus'] else ""

    analysis = call_llm(
        system_prompt=f"You are a financial analyst. {style_prompt}{focus_instruction}",
        user_input=f"Analyze financial data for {company} from:\n\n{financial_text}"
    )

    output = f"{analysis}\n\n---\nRAW DATA:\n{financial_text}"
    return analysis, output

def strategic_agent(company, research, financials):
    """Provides strategic insights"""
    global agent_config

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

    return insights

def writer_agent(company, research, financials, insights):
    """Creates final report"""
    global agent_config

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

    return report

@app.route('/')
def index():
    return render_template('index.html', use_vercel_script=True)

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'groq_key_set': bool(os.environ.get('GROQ_API_KEY')),
        'tavily_key_set': bool(os.environ.get('TAVILY_API_KEY'))
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    """Synchronous analysis endpoint for Vercel"""
    global agent_config
    data = request.json
    company = data.get('company', '')
    config = data.get('config', {})

    if not company:
        return jsonify({'error': 'Company name required'}), 400

    if config:
        agent_config = config

    try:
        research_summary, raw_news, researcher_output = researcher_agent(company)
        financial_analysis, financial_output = financial_agent(company)
        strategic_insights = strategic_agent(company, research_summary, financial_analysis)
        final_report = writer_agent(company, research_summary, financial_analysis, strategic_insights)

        return jsonify({
            'status': 'completed',
            'company': company,
            'researcher': {'status': 'completed', 'output': researcher_output},
            'financial': {'status': 'completed', 'output': financial_output},
            'strategic': {'status': 'completed', 'output': strategic_insights},
            'writer': {'status': 'completed', 'output': final_report},
            'summary': final_report,
            'progress': 100
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'company': company
        }), 500

@app.route('/status')
def get_status():
    """Status endpoint"""
    return jsonify({'status': 'idle', 'message': 'Use /analyze endpoint directly'})
