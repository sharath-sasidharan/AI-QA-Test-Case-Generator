import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  const { feature, includeNegative } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a QA automation generator. Always return valid JSON.",
        },
        {
          role: "user",
          content: `
Generate QA test cases for:

"${feature}"

Return JSON with:
{
  "testCases": [
    {
      "title": "",
      "priority": "High | Medium | Low",
      "preconditions": "",
      "steps": [],
      "expected": ""
    }
  ],
  "playwrightScript": ""
}

Include real executable Playwright test code.
${includeNegative ? "Include negative and edge cases." : ""}
`,
        },
      ],
      temperature: 0.3,
    });

    const data = JSON.parse(completion.choices[0].message.content);

    res.json(data);
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "AI generation failed." });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
