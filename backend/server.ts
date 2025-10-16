import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
// Enable CORS for all routes to allow frontend requests
app.use(cors());
// Enable parsing of JSON request bodies
app.use(express.json());

// --- API Key and Model Initialization ---
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable not set.");
  process.exit(1); 
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

// --- API Routes ---

/**
 * @route POST /api/generate
 * @desc Receives code and a language, sends it to the Gemini API for documentation,
 * and returns the documented code.
 * @access Public
 */
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    // --- Input Validation ---
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required.' });
    }

    // --- Prompt Engineering: The "Secret Sauce" of a Wrapper App ---
    // This detailed prompt guides the AI to produce the exact output we want.
    const prompt = `
      You are an expert software developer specializing in writing clean, concise, and professional documentation.
      Your task is to take a code snippet in ${language} and add a high-quality documentation block or docstring.

      Follow these rules precisely:
      1.  Analyze the provided code to understand its purpose, parameters, and return value.
      2.  Generate documentation that is idiomatic for the ${language} language (e.g., JSDoc for JavaScript/TypeScript, PEP 257 for Python, XML docs for C#).
      3.  The documentation should explain what the function/class does, describe each parameter, and specify what is returned.
      4.  **Crucially, you must only return the complete, original code with the new documentation added.** Do not add any extra explanations, introductory text, or markdown formatting around the code block.

      Here is the code snippet:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    // --- API Call with Exponential Backoff (Simplified) ---
    // In a true production app, you would implement a more robust retry mechanism.
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const documentedCode = response.text();

    // Send the generated code back to the frontend
    res.json({ documentedCode });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: 'An unexpected error occurred while generating documentation.' });
  }
});

// --- Server Startup ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
