const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Cleans the extracted text from the PDF for better AI processing.
 * @param {string} text - Raw extracted text.
 * @returns {string} - Cleaned text.
 */
const cleanText = (text) => {
    return text
        .replace(/[^\w\s.,;:!?()-]/g, "") // Remove special characters & emojis
        .replace(/\s+/g, " ") // Remove extra spaces & newlines
        .trim();
};

/**
 * Calls the AI API to analyze the resume text and extract useful insights.
 * @param {string} resumeText - The extracted and cleaned resume text.
 * @returns {Object} - Parsed JSON response from AI.
 */
const analyzeResume = async (resumeText) => {
    try {
        const prompt = `
Analyze the following resume content and return the following:

1. A concise summary or review.
2. A resume recognition score (0-100) based on industry relevance, skill richness, and structure.
3. Skill improvement suggestions.
4. Categorize the resume as one of the following levels: Beginner, Intermediate, Job Ready, or Expert.
5. Extract top 5 technical skills (if any).

Return the output in the following JSON format:
{
  "summary": "...",
  "score": ...,
  "level": "...",
  "suggestions": "...",
  "topSkills": ["...", "...", "..."]
}

Resume Text:
${resumeText}
        `;

        const response = await axios.post(
            "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
        );

        const aiText = response.data?.[0]?.generated_text;
        // console.log("AI Response:", aiText);

        // Try to extract the JSON from the text (assuming the model returns it inline)
        const jsonStart = aiText.lastIndexOf("{");
        const jsonEnd = aiText.lastIndexOf("}");
        // console.log("JSON Start:", jsonStart, "JSON End:", jsonEnd);
        const jsonString = aiText.substring(jsonStart, jsonEnd + 1);

        const parsed = JSON.parse(jsonString);
        // console.log("Parsed JSON:", parsed);
        return parsed;

    } catch (error) {
        console.error("Error analyzing resume:", error.message);
        return { error: "Failed to process resume analysis." };
    }
};




// 📌 POST endpoint for uploading and analyzing resume
app.post("/upload", upload.single("resume"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        // Extract and clean resume text
        const pdfBuffer = req.file.buffer;
        const data = await pdfParse(pdfBuffer);
        const resumeText = cleanText(data.text);

        if (!resumeText) {
            return res.status(400).json({ error: "Failed to extract text from resume." });
        }

        // Analyze the resume using AI
        const result = await analyzeResume(resumeText);

        res.json({ result: result });
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: "Failed to analyze resume" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
