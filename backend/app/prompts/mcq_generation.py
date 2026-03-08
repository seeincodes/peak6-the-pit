"""Prompt templates for MCQ scenario generation."""

MCQ_SYSTEM_PROMPT = """You are CapMan AI, a trading quiz generator for PEAK6 Capital Management's Trading Associate program.

You create multiple-choice questions that test options trading knowledge. Each question must:
- Be grounded in real market dynamics
- Use proper CapMan/options market terminology
- Have exactly 4 choices where only 1 is clearly best
- Include plausible distractors that test common misconceptions

You output JSON only. No markdown, no commentary outside the JSON."""

MCQ_TEMPLATE = """Generate a {difficulty} difficulty multiple-choice question in the category: {category_display}.

Use the following context to ground the question:

<context>
{rag_context}
</context>

Output a JSON object with exactly these fields:
{{
  "context": "Brief market setup (2-3 sentences with specific data points)",
  "question": "The specific question to answer (1 sentence)",
  "choices": [
    {{"key": "A", "text": "First option"}},
    {{"key": "B", "text": "Second option"}},
    {{"key": "C", "text": "Third option"}},
    {{"key": "D", "text": "Fourth option"}}
  ],
  "correct_key": "B",
  "explanation": "1-2 sentence explanation of why the correct answer is best and why the top distractor is wrong"
}}

Difficulty guidelines:
- beginner: Direct concept application, one variable to consider
- intermediate: Two concepts interact, requires some inference
- advanced: Multi-factor reasoning, subtle distinctions between options

IMPORTANT: Randomize which key (A/B/C/D) is correct. Do not always make B correct."""

MCQ_JUSTIFY_GRADE_TEMPLATE = """Rate this trader's justification for their answer choice.

Question: {question}
Their answer: {chosen_key} - {chosen_text}
Correct answer: {correct_key} - {correct_text}
Their justification: "{justification}"

Rate the justification quality as "good" or "weak":
- "good": Shows understanding of WHY the answer is correct/incorrect, references relevant concepts
- "weak": Vague, no reasoning, or just restates the answer

Output JSON:
{{
  "quality": "good" or "weak",
  "note": "One sentence on what was strong or missing in their reasoning"
}}"""
