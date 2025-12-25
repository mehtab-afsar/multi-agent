# multi_agent.py

import os
from groq import Groq
from tavily import TavilyClient
from dotenv import load_dotenv
import time

load_dotenv()

groq = Groq(api_key=os.getenv("GROQ_API_KEY"))
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# Colors for terminal output
class Color:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_agent(name, action):
    """Pretty print agent actions"""
    print(f"\n{Color.BLUE}{Color.BOLD}🤖 {name}{Color.END} → {action}")

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

# ================================
# AGENT 1: RESEARCHER
# ================================
def researcher_agent(company):
    """Searches web for latest news"""
    print_agent("RESEARCHER", f"Searching news about {company}...")

    # Search the web
    results = tavily.search(f"{company} latest news 2024", max_results=5)

    # Format results
    news_items = []
    for i, r in enumerate(results['results'][:5], 1):
        news_items.append(f"{i}. {r['title']}\n   {r['content'][:150]}...\n   Source: {r['url']}")

    news_text = "\n\n".join(news_items)

    # LLM summarizes
    summary = call_llm(
        system_prompt="You are a research analyst. Summarize the key news points in 3-4 bullet points.",
        user_input=f"Summarize these news articles about {company}:\n\n{news_text}"
    )

    print(f"{Color.GREEN}✓ Found {len(results['results'])} articles{Color.END}")
    return summary, news_text

# ================================
# AGENT 2: FINANCIAL ANALYST
# ================================
def financial_agent(company):
    """Gets financial data"""
    print_agent("FINANCIAL ANALYST", f"Analyzing {company} financials...")

    # Search for financial info
    results = tavily.search(f"{company} stock price market cap revenue 2024", max_results=3)

    financial_text = "\n\n".join([r['content'] for r in results['results'][:3]])

    # LLM extracts key metrics
    analysis = call_llm(
        system_prompt="You are a financial analyst. Extract and present key financial metrics in bullet points (stock price, market cap, revenue, etc.)",
        user_input=f"Extract financial metrics for {company} from:\n\n{financial_text}"
    )

    print(f"{Color.GREEN}✓ Financial data collected{Color.END}")
    return analysis

# ================================
# AGENT 3: STRATEGIC ANALYST
# ================================
def analyst_agent(company, research, financials):
    """Provides strategic insights"""
    print_agent("STRATEGIC ANALYST", "Generating insights...")

    insights = call_llm(
        system_prompt="""You are a strategic business analyst. Provide 3 key insights:
        1. Market Position
        2. Key Opportunities
        3. Potential Risks
        Be specific and actionable.""",
        user_input=f"""Analyze {company}:

        RECENT NEWS:
        {research}

        FINANCIAL STATUS:
        {financials}

        Provide strategic insights."""
    )

    print(f"{Color.GREEN}✓ Analysis complete{Color.END}")
    return insights

# ================================
# AGENT 4: REPORT WRITER
# ================================
def writer_agent(company, research, financials, insights):
    """Creates final report"""
    print_agent("REPORT WRITER", "Compiling final report...")

    report = call_llm(
        system_prompt="""You are an executive report writer. Create a clear, professional
        company analysis report with these sections:
        1. Executive Summary (2-3 sentences)
        2. Recent Developments
        3. Financial Overview
        4. Strategic Assessment
        5. Conclusion

        Be concise but informative.""",
        user_input=f"""Create executive report for {company}:

        RESEARCH:
        {research}

        FINANCIALS:
        {financials}

        INSIGHTS:
        {insights}
        """
    )

    print(f"{Color.GREEN}✓ Report generated{Color.END}")
    return report

# ================================
# ORCHESTRATOR
# ================================
def multi_agent_analysis(company):
    """Runs all agents in sequence"""

    print(f"\n{Color.BOLD}{'='*70}{Color.END}")
    print(f"{Color.BOLD}{Color.YELLOW}🎯 MULTI-AGENT COMPANY ANALYSIS: {company.upper()}{Color.END}")
    print(f"{Color.BOLD}{'='*70}{Color.END}")

    start_time = time.time()

    # Phase 1: Research
    print(f"\n{Color.YELLOW}━━━ PHASE 1: RESEARCH ━━━{Color.END}")
    research_summary, raw_news = researcher_agent(company)
    print(f"\n{Color.BLUE}Summary:{Color.END}")
    print(research_summary)

    # Phase 2: Financial Analysis
    print(f"\n{Color.YELLOW}━━━ PHASE 2: FINANCIAL ANALYSIS ━━━{Color.END}")
    financial_analysis = financial_agent(company)
    print(f"\n{Color.BLUE}Analysis:{Color.END}")
    print(financial_analysis)

    # Phase 3: Strategic Insights
    print(f"\n{Color.YELLOW}━━━ PHASE 3: STRATEGIC INSIGHTS ━━━{Color.END}")
    strategic_insights = analyst_agent(company, research_summary, financial_analysis)
    print(f"\n{Color.BLUE}Insights:{Color.END}")
    print(strategic_insights)

    # Phase 4: Final Report
    print(f"\n{Color.YELLOW}━━━ PHASE 4: REPORT GENERATION ━━━{Color.END}")
    final_report = writer_agent(company, research_summary, financial_analysis, strategic_insights)

    elapsed = time.time() - start_time

    # Display Final Report
    print(f"\n{Color.BOLD}{'='*70}{Color.END}")
    print(f"{Color.BOLD}{Color.GREEN}📄 FINAL EXECUTIVE REPORT{Color.END}")
    print(f"{Color.BOLD}{'='*70}{Color.END}\n")
    print(final_report)
    print(f"\n{Color.BOLD}{'='*70}{Color.END}")
    print(f"{Color.YELLOW}⏱️  Completed in {elapsed:.1f} seconds{Color.END}")
    print(f"{Color.BOLD}{'='*70}{Color.END}\n")

    # Save to file
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
        f.write(final_report + "\n\n")
        f.write("="*70 + "\n")
        f.write(f"Generated in {elapsed:.1f} seconds\n")

    print(f"💾 Full report saved to: {Color.GREEN}{filename}{Color.END}\n")

    return final_report

# ================================
# MAIN
# ================================
if __name__ == "__main__":
    print(f"\n{Color.BOLD}{Color.BLUE}🚀 MULTI-AGENT ANALYSIS SYSTEM{Color.END}")
    print(f"{Color.BOLD}{'='*70}{Color.END}\n")

    # Examples you can try
    examples = [
        "NVIDIA",
        "Tesla",
        "Microsoft",
        "Apple",
        "OpenAI"
    ]

    print("Example companies:")
    for i, ex in enumerate(examples, 1):
        print(f"  {i}. {ex}")

    company = input(f"\n{Color.BOLD}Enter company name to analyze: {Color.END}").strip()

    if not company:
        company = "NVIDIA"
        print(f"Using default: {company}")

    # Run the multi-agent workflow
    multi_agent_analysis(company)

    # Option to analyze another
    while True:
        again = input(f"\n{Color.BOLD}Analyze another company? (y/n): {Color.END}").lower()
        if again == 'y':
            company = input(f"{Color.BOLD}Enter company name: {Color.END}").strip()
            if company:
                multi_agent_analysis(company)
        else:
            print(f"\n{Color.GREEN}✨ Thanks for using Multi-Agent Analysis!{Color.END}\n")
            break
