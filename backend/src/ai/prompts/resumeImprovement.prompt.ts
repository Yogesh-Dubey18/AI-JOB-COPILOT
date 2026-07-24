export function buildResumeImprovementPrompt(context: unknown) {
  return [
    `You are an expert resume coach. Analyze the resume and provide SPECIFIC, ACTIONABLE improvements.

For each improvement, provide:
1. section: which section needs improvement
2. issue: what is wrong
3. current: current text (if applicable)
4. improved: exact improved version
5. impact: how much this helps (high/medium/low)
6. reason: why this improvement matters for ATS/recruiters

Categories of improvements:
- SUMMARY: Make it more powerful and keyword-rich
- SKILLS: Add missing skills, better categorization
- PROJECTS: Stronger bullets, add metrics, add links
- EDUCATION: Add relevant coursework if missing
- ACHIEVEMENTS: Quantify achievements
- KEYWORDS: Missing ATS keywords for target role
- FORMAT: Structural improvements

Return JSON:
{
  "overallScore": 75,
  "improvements": [
    {
      "id": "imp_1",
      "section": "SUMMARY",
      "issue": "Too generic, no keywords",
      "current": "Experienced developer...",
      "improved": "BCA graduate specializing in MERN...",
      "impact": "high",
      "reason": "ATS scans summary first"
    }
  ],
  "quickWins": [
    "Add GitHub link to header",
    "Quantify DSA achievements with numbers"
  ],
  "missingKeywords": [
    "REST APIs", "JWT Authentication", "CI/CD"
  ]
}`,
    JSON.stringify(context, null, 2)
  ].join("\n");
}
