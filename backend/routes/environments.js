const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const TerraformRunner = require('../services/terraform');
const fs = require('fs/promises');
const path = require('path');

// Get all environments
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.env_id, e.name, e.region, e.status, e.created_at, a.name as account_name 
            FROM environments e 
            LEFT JOIN accounts a ON e.account_id = a.id
        `);
        res.json(rows);
    } catch (error) {
        console.error('Fetch Envs Error:', error);
        res.status(500).json({ error: 'Failed to fetch environments' });
    }
});

// Create/Plan Environment
router.post('/plan', async (req, res) => {
    const { name, tfFiles, accountId, region } = req.body;
    if (!name || !tfFiles || !accountId || !region) return res.status(400).json({ error: 'Missing fields' });

    const envId = `env-${uuidv4().substring(0, 8)}`;

    try {
        await db.query(
            'INSERT INTO environments (env_id, name, account_id, region, status) VALUES (?, ?, ?, ?, ?)',
            [envId, name, accountId, region, 'planning']
        );

        const [accounts] = await db.query('SELECT * FROM accounts WHERE id = ?', [accountId]);
        const account = accounts[0];

        const initResult = await TerraformRunner.setupEnvironment(envId, tfFiles, account);
        if (!initResult.success) {
            await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['init_failed', envId]);
            return res.status(400).json({ error: 'Terraform Init Failed', details: initResult.stderr });
        }

        const planResult = await TerraformRunner.plan(envId, account);
        if (!planResult.success) {
            await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['plan_failed', envId]);
            return res.status(400).json({ error: 'Terraform Plan Failed', details: planResult.stderr });
        }

        await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['planned', envId]);
        await db.query('UPDATE user_messages SET env_id = ? WHERE env_id IS NULL', [envId]);
        await db.query('INSERT INTO user_messages (role, content, plan, env_id) VALUES (?, ?, ?, ?)', ['system', 'Plan generated successfully.', planResult.stdout, envId]);
        res.json({ envId, planDetails: planResult.stdout });
    } catch (error) {
        console.error('Plan Error:', error);
        res.status(500).json({ error: 'Failed to plan environment' });
    }
});

// Replan Environment
router.post('/replan/:envId', async (req, res) => {
    const { envId } = req.params;
    const { tfFiles } = req.body;
    if (!tfFiles) return res.status(400).json({ error: 'Missing fields' });

    try {
        const [envs] = await db.query('SELECT account_id FROM environments WHERE env_id = ?', [envId]);
        if (envs.length === 0) return res.status(404).json({ error: 'Environment not found' });
        
        await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['planning', envId]);

        const [accounts] = await db.query('SELECT * FROM accounts WHERE id = ?', [envs[0].account_id]);
        const account = accounts[0];

        const initResult = await TerraformRunner.setupEnvironment(envId, tfFiles, account);
        if (!initResult.success) {
            await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['init_failed', envId]);
            return res.status(400).json({ error: 'Terraform Init Failed', details: initResult.stderr });
        }

        const planResult = await TerraformRunner.plan(envId, account);
        if (!planResult.success) {
            await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['plan_failed', envId]);
            return res.status(400).json({ error: 'Terraform Plan Failed', details: planResult.stderr });
        }

        await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['planned', envId]);
        await db.query('INSERT INTO user_messages (role, content, plan, env_id) VALUES (?, ?, ?, ?)', ['system', 'Plan replacement generated successfully.', planResult.stdout, envId]);
        res.json({ envId, planDetails: planResult.stdout });
    } catch (error) {
        console.error('Replan Error:', error);
        res.status(500).json({ error: 'Failed to replan environment' });
    }
});

// Apply Environment
router.post('/apply/:envId', async (req, res) => {
    const { envId } = req.params;
    try {
        await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['applying', envId]);
        
        const [envs] = await db.query('SELECT account_id FROM environments WHERE env_id = ?', [envId]);
        const [accounts] = await db.query('SELECT * FROM accounts WHERE id = ?', [envs[0].account_id]);
        
        const applyResult = await TerraformRunner.apply(envId, accounts[0]);
        
        if (!applyResult.success) {
            await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['apply_failed', envId]);
            return res.status(400).json({ error: 'Terraform Apply Failed', details: applyResult.stderr });
        }

        await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['applied', envId]);
        await db.query('INSERT INTO deployments (env_id, logs, status) VALUES (?, ?, ?)', [envId, applyResult.stdout, 'success']);
        await db.query('INSERT INTO user_messages (role, content, logs, env_id) VALUES (?, ?, ?, ?)', ['system', 'Infrastructure applied successfully.', applyResult.stdout, envId]);
        
        res.json({ success: true, logs: applyResult.stdout });
    } catch (error) {
        console.error('Apply Error:', error);
        res.status(500).json({ error: 'Failed to apply environment' });
    }
});

// Destroy Environment
router.post('/destroy/:envId', async (req, res) => {
    const { envId } = req.params;
    try {
        await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['destroying', envId]);
        
        const [envs] = await db.query('SELECT account_id FROM environments WHERE env_id = ?', [envId]);
        const [accounts] = await db.query('SELECT * FROM accounts WHERE id = ?', [envs[0].account_id]);
        
        const destroyResult = await TerraformRunner.destroy(envId, accounts[0]);
        
        if (!destroyResult.success) {
            await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['destroy_failed', envId]);
            return res.status(400).json({ error: 'Terraform Destroy Failed', details: destroyResult.stderr });
        }

        await db.query('UPDATE environments SET status = ? WHERE env_id = ?', ['destroyed', envId]);
        await db.query('INSERT INTO deployments (env_id, logs, status) VALUES (?, ?, ?)', [envId, destroyResult.stdout, 'destroyed']);
        
        res.json({ success: true, logs: destroyResult.stdout });
    } catch (error) {
        console.error('Destroy Error:', error);
        res.status(500).json({ error: 'Failed to destroy environment' });
    }
});

module.exports = router;
