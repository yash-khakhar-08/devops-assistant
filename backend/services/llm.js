const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
// Ensure it picks up .env even if run from parent
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are an expert AWS DevOps and Terraform Engineer. 
Your task is to convert natural language requests into pure, valid Terraform HCL code.
You MUST reply with a STRICT JSON object where the keys are the filenames and the values are the Terraform file contents.

For example:
{
  "provider.tf": "provider \\"aws\\" {\\n  region = var.region\\n}",
  "main.tf": "...",
  "variables.tf": "...",
  "outputs.tf": "..."
}

CRITICAL RULES:
1. ONLY return valid JSON. Do not include markdown blocks like """json. The response should be parseable by JSON.parse() directly.
2. Include at minimum: provider.tf, main.tf, variables.tf. If asked, include terraform.tfvars or outputs.tf.
3. Use best practices for AWS resources.
4. If missing details, use reasonable default assumptions (like instance type t3.micro) but ensure valid code.
5. If the user provides instructions that modify previous code (e.g., adding resources to an existing VPC), output the FULL updated files, combining the old and new resources perfectly.`;

async function generateTerraformWithHistory(historyItems) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured in backend.');
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Map db messages to Gemini chat history format
    // role must be 'user' or 'model'
    const formattedHistory = [];
    for (const msg of historyItems) {
        // Only valid messages up to this point
        if (msg.role === 'user' || msg.role === 'system') {
            formattedHistory.push({
                role: msg.role === 'system' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
    }

    // We pass SYSTEM_PROMPT as the first user message if history is empty, 
    // or we can just prepend it
    if (formattedHistory.length === 0 || formattedHistory[0].parts[0].text !== SYSTEM_PROMPT) {
        // Gemini expects alternating user/model if we want to be safe, but adjacent users are sometimes okay
        formattedHistory.unshift({
            role: 'model',
            parts: [{ text: "Understood. I will strictly follow the JSON output format and standard practices." }]
        });
        formattedHistory.unshift({
            role: 'user',
            parts: [{ text: `SYSTEM DIRECTIVE (Apply to all subsequent requests): \n${SYSTEM_PROMPT}` }]
        });
    }

    // Initialize chat session
    const chat = model.startChat({
        history: formattedHistory.slice(0, -1), // Everything except the very last prompt
    });

    const lastPrompt = historyItems[historyItems.length - 1].content;

    try {
        const result = await chat.sendMessage(lastPrompt);
        let text = result.response.text();
        
        text = text.replace(/^\s*```json/i, '').replace(/```\s*$/i, '');
        const tfData = JSON.parse(text);
        return tfData;
    } catch (error) {
        console.error('Error in LLM Context:', error);
        throw error;
    }
}

module.exports = { generateTerraformWithHistory };
