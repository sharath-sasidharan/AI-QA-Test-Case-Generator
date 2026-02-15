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
  try {
    const { feature, includeNegative } = req.body;

    if (!feature || !feature.trim()) {
      return res.status(400).json({
        error: "Feature description required.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior QA automation engineer. Always return strictly valid JSON only.",
        },
        {
          role: "user",
          content: `
Generate structured QA test cases for the following feature:

"${feature}"

Return JSON in this EXACT structure:

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

Rules:
- Generate 4–6 realistic test cases.
- ${includeNegative ? "Include negative and edge cases." : ""}
- Generate ONE Playwright test() block for EACH test case.
- The number of Playwright test() blocks MUST match the number of testCases.
- Wrap all tests inside:

test.describe('${feature}', () => { ... });

- Use:

import { test, expect } from '@playwright/test';

- Each test must:
  • Have a descriptive name
  • Follow the steps logically
  • Include at least one expect() assertion
- playwrightScript MUST NOT be empty.
- Return strictly valid JSON only.
`,
        },
      ],
    });

    const rawContent = completion.choices?.[0]?.message?.content;

    console.log("RAW AI RESPONSE:\n", rawContent);

    if (!rawContent) {
      return res.status(500).json({
        error: "Empty AI response",
      });
    }

    let data;

    try {
      data = JSON.parse(rawContent);
    } catch (err) {
      console.error("JSON Parse Failed:");
      console.error(rawContent);
      return res.status(500).json({
        error: "AI returned invalid JSON",
      });
    }

    // 🔥 Safety validation
    if (
      !data.playwrightScript ||
      typeof data.playwrightScript !== "string" ||
      !data.playwrightScript.trim()
    ) {
      console.warn("AI returned empty Playwright script. Generating fallback.");

      const fallbackTests = (data.testCases || []).map(
        (tc) => `
  test('${tc.title}', async ({ page }) => {
    // TODO: Update URL
    await page.goto('https://example.com');

    // Simulated steps
    ${tc.steps.map((s) => `// ${s}`).join("\n    ")}

    // Example assertion
    await expect(page).toHaveURL(/example/);
  });
`
      );

      data.playwrightScript = `
import { test, expect } from '@playwright/test';

test.describe('${feature}', () => {
${fallbackTests.join("\n")}
});
`;
    }

    return res.json(data);
  } catch (error) {
    console.error("FULL SERVER ERROR:");
    console.error(error);
    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
