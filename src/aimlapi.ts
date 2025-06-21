import { fetch } from 'undici';

// Helper untuk request ke AIMLAPI
const AIML_API_KEY = process.env.AIML_API_KEY; // Wajib diatur di .env
const AIML_API_URL = "https://api.aimlapi.com/v1/chat/completions";

export async function askAIMLAPI(prompt: string): Promise<string> {
  if (!AIML_API_KEY) throw new Error("AIML_API_KEY belum diatur di environment!");
  const res = await fetch(AIML_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AIML_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemma-3n-e4b-it",
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });
  if (!res.ok) throw new Error("AIMLAPI error");
  const data: any = await res.json();
  // Ambil jawaban dari response
  return (
    data.choices?.[0]?.message?.content?.trim() ||
    data.choices?.[0]?.text?.trim() ||
    "[AIMLAPI tidak merespon]"
  );
}
