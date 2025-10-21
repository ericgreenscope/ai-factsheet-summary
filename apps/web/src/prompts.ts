export interface PromptTemplate {
  id: string;
  title: string;
  text: string;
}

const MARKDOWN_FORMAT_HINT = "\n\nFormat your response in Markdown with clear structure (use # for headings, **bold**, - for bullet points, etc.).";

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    text: `Write an executive summary of the ESG report. Structure it in three parts:

1. Overall performance (strengths and weaknesses)
2. Recent evolutions compared to last year
3. Benchmark comparison

Keep a concise, decision-oriented tone.${MARKDOWN_FORMAT_HINT}`
  },
  {
    id: "comprehensive-analysis",
    title: "Comprehensive Analysis",
    text: `Analyze the ESG report in depth and produce a synthesis with three sections: Environment, Social, Governance. Highlight differences with the sector benchmark, key implemented policies, and observed trends. End with an overall ESG maturity assessment (low, medium, high).${MARKDOWN_FORMAT_HINT}`
  },
  {
    id: "analytical-diagnostic",
    title: "Analytical Diagnostic",
    text: `Write an analytical report identifying, for each pillar (E, S, G): strengths, weaknesses, and short- or mid-term risks. Suggest three priorities for action to improve performance. The tone should be expert and well-reasoned.${MARKDOWN_FORMAT_HINT}`
  },
  {
    id: "free-and-critical",
    title: "Free and Critical Analysis",
    text: `Analyze the ESG report freely, without structure constraints. You may interpret and critique data, highlight inconsistencies, and draw inferences. Keep a professional but narrative tone.${MARKDOWN_FORMAT_HINT}`
  },
  {
    id: "due-diligence",
    title: "Due Diligence (Investor Perspective)",
    text: `Analyze the ESG report as part of an investor due diligence. Identify positive and negative ESG signals, assess credibility of commitments, transparency, and risk management. Conclude with an ESG risk rating (low / moderate / high) and justification.${MARKDOWN_FORMAT_HINT}`
  }
];

export function getPromptById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(p => p.id === id);
}

export function getDefaultPrompt(): PromptTemplate {
  return PROMPT_TEMPLATES[0]; // Executive Summary is default
}
