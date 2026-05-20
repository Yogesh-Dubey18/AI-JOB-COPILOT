import { env } from "../config/env.js";

export async function callJsonModel(prompt: string, fallback: any) {
  if (env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Return only strict JSON. No markdown." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      return content ? JSON.parse(content) : fallback;
    } catch {
      return fallback;
    }
  }

  if (env.GEMINI_API_KEY) {
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + env.GEMINI_API_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt + "\nReturn only JSON." }] }] })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/^```json|^```|```$/g, "").trim();
      return text ? JSON.parse(text) : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}
