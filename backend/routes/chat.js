const express = require('express');
const router = express.Router();
const { generateTerraformWithHistory } = require('../services/llm');
const db = require('../db');
const fs = require('fs/promises');
const path = require('path');

const handleGet = async (req, res) => {
    try {
        const envId = req.params.envId || null;
        const query = envId 
            ? 'SELECT * FROM user_messages WHERE env_id = ? ORDER BY created_at ASC' 
            : 'SELECT * FROM user_messages WHERE env_id IS NULL ORDER BY created_at ASC';
        const params = envId ? [envId] : [];
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

router.get('/', handleGet);
router.get('/:envId', handleGet);

router.post('/generate', async (req, res) => {
    try {
        const { prompt, envId } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        let existingFilesContext = '';
        if (envId) {
            const envPath = path.join(__dirname, '../../envs', envId);
            try {
                const files = await fs.readdir(envPath);
                for (const file of files) {
                    if (file.endsWith('.tf')) {
                        const content = await fs.readFile(path.join(envPath, file), 'utf8');
                        existingFilesContext += `\n--- ${file} ---\n${content}\n`;
                    }
                }
            } catch(e) { } // Ignore if dir doesn't exist
        }
        
        let finalPrompt = prompt;
        if (existingFilesContext) {
            finalPrompt = `Current Terraform Files for Environment ${envId}:\n${existingFilesContext}\n\nUser Request: ${prompt}\n\nPlease output the completely updated JSON replacing the old files and adding anything new requested without omitting existing valid resources.`;
        }
        
        await db.query(
            'INSERT INTO user_messages (role, content, env_id) VALUES (?, ?, ?)',
            ['user', finalPrompt, envId || null]
        );

        const historyCondition = envId ? 'env_id = ?' : 'env_id IS NULL';
        const historyParams = envId ? [envId] : [];
        const [history] = await db.query(`SELECT role, content FROM user_messages WHERE ${historyCondition} ORDER BY created_at ASC`, historyParams);
        
        const tfFiles = await generateTerraformWithHistory(history);
        
        await db.query(
            'INSERT INTO user_messages (role, content, files, env_id) VALUES (?, ?, ?, ?)',
            ['system', 'Generated Terraform files successfully.', JSON.stringify(tfFiles), envId || null]
        );

        res.json({ files: tfFiles });
    } catch (error) {
        console.error('Generate Error:', error);
        res.status(500).json({ error: 'Failed to generate Terraform' });
    }
});

module.exports = router;
