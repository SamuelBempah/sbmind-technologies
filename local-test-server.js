import dotenv from 'dotenv';
dotenv.config();

console.log('--- ENV DEBUG ---');
console.log('API KEY FOUND?', !!process.env.GEMINI_API_KEY);
console.log('KEY STARTS WITH:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'N/A');

import express from 'express';
import handler from './api/verify-manual.js';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.all('/api/verify-manual', (req, res) => handler(req, res));

app.listen(3000, '0.0.0.0', () => console.log('Local test server running on 0.0.0.0:3000 (accessible from phone)'));
