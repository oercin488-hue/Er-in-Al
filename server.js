import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});
app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Mesaj bulunamadı." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "Sunucuda OPENAI_API_KEY ayarlanmamış. Hosting ayarlarından ekleyin." });
    }
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Sen ERÇİN AI adlı Türkçe konuşan yapay zekâ asistanısın."
      },
      ...messages.slice(-20).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content)
      }))
    ]
  })
});

const data = await response.json();

if (!response.ok) {
  return res.status(response.status).json({
    error: data.error?.message || "Groq bağlantı hatası."
  });
}

const answer = data.choices?.[0]?.message?.content || "";
 
    res.json({ answer: answer || "Yanıt üretilemedi. Lütfen tekrar dene." });
  } catch (err) {
    res.status(500).json({ error: "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar dene." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ERÇİN AI hazır: http://localhost:${port}`));
