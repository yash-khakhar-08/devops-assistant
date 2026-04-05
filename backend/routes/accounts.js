const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all accounts
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, default_region, created_at FROM accounts');
        res.json(rows);
    } catch (error) {
        console.error('Fetch Accounts Error:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// Add account
router.post('/', async (req, res) => {
    try {
        const { name, access_key, secret_key, default_region } = req.body;
        if (!name || !access_key || !secret_key || !default_region) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        await db.query(
            'INSERT INTO accounts (name, access_key, secret_key, default_region) VALUES (?, ?, ?, ?)',
            [name, access_key, secret_key, default_region]
        );
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Add Account Error:', error);
        res.status(500).json({ error: 'Failed to add account' });
    }
});

module.exports = router;
