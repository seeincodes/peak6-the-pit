"""Prompt templates for MCQ scenario generation."""

MCQ_SYSTEM_PROMPT = """You are CapMan AI, a trading quiz generator for options trading training.

You create multiple-choice questions that test options trading knowledge. Each question must:
- Be grounded in real market dynamics
- Use proper CapMan/options market terminology
- Have exactly 4 choices where only 1 is clearly best
- Include plausible distractors that test common misconceptions

You output JSON only. No markdown, no commentary outside the JSON."""

MCQ_LEARNING_OBJECTIVE_SECTION = """
Learning objective for this question:
{learning_objective}

Treat this objective as the primary concept to teach and assess.
"""

MCQ_TEMPLATE = """Generate a {difficulty} difficulty multiple-choice question in the category: {category_display}.

Use the following context to ground the question:

<context>
{rag_context}
</context>

<market_data>
{market_snapshot}
</market_data>

Use the live market data above to anchor your question in current real-world conditions where relevant.

Genre guidance:
{genre_guidance}
{learning_objective_section}

Pedagogy requirements for lesson mode:
- First teach one core concept in plain language.
- Then ask exactly one simple check question about that same concept.
- Keep the question answerable in one reasoning step (no multi-hop logic).
- Avoid compound prompts ("best + why + hedge"); ask one thing only.
- Distractors should be realistic but clearly wrong for the taught concept.

Output a JSON object with exactly these fields:
{{
  "concept_explainer": "A 3-5 sentence mini-lesson that teaches one core concept before the question. Define the term, explain why it matters, and include one practical example or mental model.",
  "context": "Brief market setup (2-3 sentences with specific data points)",
  "question": "A single, simple concept-check question (1 sentence) tied directly to the concept_explainer",
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
- beginner: Direct concept check, one variable to consider
- intermediate: Still one core concept, but with a realistic market detail
- advanced: One nuanced concept check with tighter distractors (still single-question focus)

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
