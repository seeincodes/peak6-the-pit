"""Prompt templates for grading and Socratic probing."""

GRADING_SYSTEM_PROMPT = """You are CapMan AI's grading agent for PEAK6 Capital Management. You evaluate trading associate responses to scenario-based questions.

You grade on reasoning quality, not just correctness. A wrong conclusion with excellent reasoning scores higher than a right answer with no explanation.

You are Socratic — you probe to understand the trader's thinking before grading."""

PROBE_TEMPLATE = """A trading associate has responded to this scenario:

<scenario>
Title: {title}
Setup: {setup}
Question: {question}
</scenario>

Their response:
<response>
{user_response}
</response>

Generate ONE targeted follow-up question that:
1. Probes the weakest part of their reasoning
2. Uses the Socratic method (don't reveal the answer, make them think)
3. References specific concepts from their response or the scenario

Examples of good probes:
- "Why that strike over the 25-delta put? What does the skew tell you about demand at that level?"
- "You mentioned gamma — how does your theta profile change if the underlying moves 2%?"
- "What happens to your P&L if realized vol comes in significantly below implied?"

Output JSON:
{{
  "probe_question": "Your follow-up question",
  "probe_rationale": "Why you're asking this (not shown to the user)"
}}"""

GRADE_TEMPLATE = """Grade this trading associate's full response to a scenario.

<scenario>
Title: {title}
Setup: {setup}
Question: {question}
</scenario>

Conversation:
{conversation_text}

Grade each dimension 1-5:

**Reasoning Quality** (weight: 35%)
5: Multi-layered analysis, considers second-order effects, acknowledges uncertainty
4: Sound logical chain, covers main factors
3: Basic reasoning present but incomplete
2: Superficial or partially flawed logic
1: No coherent reasoning

**Terminology Accuracy** (weight: 20%)
5: Precise use of options/vol terminology, CapMan-level vocabulary
4: Mostly correct terminology with minor imprecision
3: Basic terms used correctly, some gaps
2: Frequent misuse of terms
1: Fundamental terminology errors

**Trade Logic** (weight: 30%)
5: Specific actionable trade with clear rationale, considers entry/exit
4: Reasonable trade idea with supporting logic
3: Generic trade idea, lacks specificity
2: Trade doesn't align with analysis
1: No trade logic or contradictory

**Risk Awareness** (weight: 15%)
5: Identifies key risks, discusses hedging, considers tail scenarios
4: Mentions main risks and basic mitigation
3: Acknowledges risk exists but lacks specifics
2: Minimal risk consideration
1: Ignores risk entirely

Output JSON:
{{
  "dimension_scores": {{
    "reasoning": <1-5>,
    "terminology": <1-5>,
    "trade_logic": <1-5>,
    "risk_awareness": <1-5>
  }},
  "overall_score": <weighted average, 1 decimal>,
  "feedback": "2-3 sentences of actionable feedback. Be specific — reference what they said. Suggest one concrete improvement.",
  "confidence": <0.0-1.0, how confident you are in this grade>
}}"""
