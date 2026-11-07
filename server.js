import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Mesaj bulunamadı." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "Sunucuda OPENAI_API_KEY ayarlanmamış. Hosting ayarlarından ekleyin." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6",
        instructions: "Sen ERÇİN AI adlı Türkçe konuşan, yardımcı ve güvenli bir yapay zekâ asistanısın. Kısa ve anlaşılır cevap ver.",
        input: messages.slice(-20).map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: [{ type: "input_text", text: String(m.content).slice(0, 8000) }]
        }))
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Yapay zekâ servisi hata verdi." });
    }
    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text)
      .join("\n");
    res.json({ answer: answer || "Yanıt üretilemedi. Lütfen tekrar dene." });
  } catch (err) {
    res.status(500).json({ error: "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar dene." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ERÇİN AI hazır: http://localhost:${port}`));
