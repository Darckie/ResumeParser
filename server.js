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
        Provide a concise review to suggest skill enhancements or additions for better impact.
        Resume Text:
        ${resumeText} \n
        and keep this response short.
        `;


        const response = await axios.post(
            "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
        );

        if (!response.data || response.data.length === 0) {
            throw new Error("AI response is empty.");
        }

        const aiGeneratedText = response.data[0].generated_text;
        const ind = aiGeneratedText.indexOf("response short.");

        const rsp = aiGeneratedText
        .substring(ind + 16)
        .replace(/[\n\t]/g, " ")   // Remove newlines and tabs
        .replace(/\s+/g, " ")      // Replace multiple spaces with a single space
        .replace(/ - /g, "###")     // Replace ' - ' with a newline
        .trim();

        // console.log("AI Raw Response:", rsp);


        return rsp;
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
       
        const ind = result.indexOf("###");
        const resultx=result.slice(0,ind);
        const suggestionsX = result.slice(ind);
 
        res.json({ result: resultx ,  suggestions: suggestionsX });
    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: "Failed to analyze resume" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
