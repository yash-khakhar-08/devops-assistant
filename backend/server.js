const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI DevOps Copilot Backend running' });
});

// Import routes
const chatRoutes = require('./routes/chat');
const accountRoutes = require('./routes/accounts');
const envRoutes = require('./routes/environments');

app.use('/api/chat', chatRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/environments', envRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});
