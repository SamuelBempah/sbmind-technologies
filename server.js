// server.js - PRODUCTION READY FOR FLY.IO
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

// LOAD .env FIRST
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CREATE EXPRESS APP
const app = express();
const PORT = process.env.PORT || 8080;  // ✅ Fly.io default port

// PRODUCTION CORS - Supports local dev + production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allowed origins for development and production
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'https://ghana-tax-support.fly.dev',  // Update with your actual app name
      'https://*.fly.dev'  // All Fly.io apps (safe for development)
    ];
    
    // Check if origin matches any allowed pattern
    if (allowedOrigins.some(allowed => 
      origin === allowed || 
      origin.endsWith(allowed.replace(/https?:\/\//, ''))
    )) {
      return callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      return callback(new Error(`CORS: Origin "${origin}" not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

// Production logging
console.log('🔍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔍 VITE_RESEND_API_KEY:', RESEND_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('🔍 PORT:', PORT);

if (!RESEND_API_KEY) {
  console.error('❌ VITE_RESEND_API_KEY is required!');
  process.exit(1);
}

console.log('✅ RESEND_API_KEY loaded successfully!');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    resendConfigured: !!RESEND_API_KEY,
    port: PORT,
    nodeVersion: process.version,
    uptime: process.uptime()
  });
});

// API Route: /api/send-support
app.post('/api/send-support', async (req, res) => {
  try {
    console.log('📨 Received support request:', req.body);
    
    const { 
      name, 
      email, 
      message, 
      userAgent, 
      platform, 
      language, 
      timestamp, 
      appVersion, 
      screenResolution 
    } = req.body;

    // Input validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, email, or message' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address format' 
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message too long (max 5000 characters)' 
      });
    }

    // Generate unique ticket ID
    const idempotencyKey = crypto.randomUUID();
    const ticketId = idempotencyKey.slice(0, 8).toUpperCase();

    // Support team email template
    const supportEmailTemplate = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; border-radius: 12px 12px 0 0; color: white;">
          <h1 style="margin: 0 0 0.5rem 0; font-size: 2.5rem; font-weight: 700;">📋 New Support Request</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">Tax Laws Ghana App</p>
        </div>
        
        <div style="background: white; padding: 2.5rem; border-radius: 0 0 12px 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <h2 style="color: #111827; margin-top: 0; font-size: 1.75rem; border-bottom: 3px solid #e5e7eb; padding-bottom: 1rem;">
            Ticket #${ticketId}
          </h2>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin: 2rem 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 1rem 0; color: #374151; font-size: 1.25rem;">👤 Customer Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 1rem;">
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280; width: 120px;">Name:</td><td style="padding: 0.75rem 0; color: #111827; font-weight: 500;">${name}</td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">Email:</td><td style="padding: 0.75rem 0; color: #111827;"><a href="mailto:${email}" style="color: #3b82f6;">${email}</a></td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">Submitted:</td><td style="padding: 0.75rem 0; color: #111827;">${new Date().toLocaleString('GMT', { timeZone: 'Africa/Accra', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">Device:</td><td style="padding: 0.75rem 0; color: #111827;">${platform || 'Web'}</td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">App:</td><td style="padding: 0.75rem 0; color: #111827;">v${appVersion || '1.0.0'}</td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">Resolution:</td><td style="padding: 0.75rem 0; color: #111827;">${screenResolution || 'N/A'}</td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">User Agent:</td><td style="padding: 0.75rem 0; color: #6b7280; font-size: 0.875rem;">${(userAgent || '').substring(0, 100)}...</td></tr>
            </table>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
            <h3 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1.25rem;">💬 Customer Message</h3>
            <div style="background: white; padding: 1.25rem; border-radius: 8px; border-left: 4px solid #f59e0b; font-family: 'Courier New', monospace; font-size: 0.95rem; color: #78350f; white-space: pre-wrap; line-height: 1.5; max-height: 300px; overflow-y: auto;">
              ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 12px; padding: 1.5rem; margin: 2rem 0; text-align: center;">
            <p style="color: #065f46; margin: 0; font-size: 1rem; font-weight: 500;">
              <strong>Status:</strong> <span style="color: #059669;">🟢 New</span> • 
              <strong>Priority:</strong> <span style="color: #d97706;">⚪ Standard</span>
            </p>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 2rem 0;">
            <a href="mailto:${email}?subject=Re:%20Ticket%20#${ticketId}&body=Hi%20${encodeURIComponent(name.split(' ')[0])},%0A%0AThank%20you%20for%20contacting%20us..." 
               style="background: #3b82f6; color: white; padding: 0.875rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
              📧 Reply to Customer
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
          <p style="color: #9ca3af; font-size: 0.875rem; text-align: center; margin: 0;">
            Automatically generated by <strong>Tax Laws Ghana</strong> support system<br>
            © 2025 SBMind Technologies Ltd.
          </p>
        </div>
      </div>
    `;

    console.log('📤 Sending support email to team...');

    // Send support team email
    const supportResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: process.env.NODE_ENV === 'production' 
          ? 'Tax Laws Ghana <info@sbmindtechnologies.com>'
          : 'Tax Laws Ghana <onboarding@resend.dev>',  // Test domain for dev
        to: ['info@sbmindtechnologies.com'],
        subject: `🆘 New Support Request: ${name} - #${ticketId}`,
        html: supportEmailTemplate,
        reply_to: `${name} <${email}>`
      }),
    });

    const supportResult = await supportResponse.json();
    
    if (!supportResponse.ok) {
      console.error('❌ Support email failed:', supportResult);
    } else {
      console.log('✅ Support email sent:', supportResult.id);
    }

    // Customer confirmation template
    const confirmationTemplate = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2rem; text-align: center; border-radius: 12px 12px 0 0; color: white;">
          <h1 style="margin: 0 0 0.5rem 0; font-size: 2.5rem; font-weight: 700;">✅ Request Received</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">Tax Laws Ghana Support</p>
        </div>
        
        <div style="background: white; padding: 2.5rem; border-radius: 0 0 12px 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <h2 style="color: #111827; margin-top: 0; font-size: 1.75rem;">Thank You ${name.split(' ')[0]}!</h2>
          
          <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 12px; padding: 1.5rem; margin: 2rem 0; text-align: center;">
            <p style="color: #065f46; margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 600;">
              📋 <strong>Your Ticket ID:</strong> <span style="font-family: monospace; background: #d1fae5; padding: 0.25rem 0.5rem; border-radius: 6px;">#${ticketId}</span>
            </p>
            <p style="color: #065f46; margin: 0; font-size: 1rem;">
              Save this ID for any follow-up questions
            </p>
          </div>

          <p style="color: #374151; font-size: 1.125rem; margin-bottom: 2rem;">
            We've received your support request and our team will review it shortly. 
            You'll hear back from us <strong>within 24 hours</strong>.
          </p>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
            <h3 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1.25rem;">📋 Your Request Summary</h3>
            <div style="background: white; padding: 1.25rem; border-radius: 8px; border-left: 4px solid #f59e0b; font-family: 'Courier New', monospace; font-size: 0.95rem; color: #78350f; white-space: pre-wrap; line-height: 1.5;">
              ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
          </div>

          <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
            <h3 style="margin: 0 0 1rem 0; color: #1e40af; font-size: 1.125rem;">⏰ Expected Response Times</h3>
            <ul style="margin: 0; padding-left: 1.5rem; color: #1e40af; font-size: 1rem;">
              <li>📧 <strong>Standard requests:</strong> Within 24 hours</li>
              <li>🚨 <strong>URGENT issues:</strong> Within 4 hours (include "URGENT" in message)</li>
              <li>💳 <strong>Payment problems:</strong> Immediate attention</li>
            </ul>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />
          <p style="color: #9ca3af; font-size: 0.875rem; text-align: center; margin: 0;">
            This is an <strong>automated confirmation</strong>. Reply to our response email for follow-ups.<br>
            © 2025 SBMind Technologies • Tax Laws Ghana
          </p>
        </div>
      </div>
    `;

    console.log('📤 Sending confirmation email to customer...');

    // Send confirmation email to customer
    const confirmationResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${idempotencyKey}-confirmation`,
      },
      body: JSON.stringify({
        from: process.env.NODE_ENV === 'production' 
          ? 'Tax Laws Ghana <info@sbmindtechnologies.com>'
          : 'Tax Laws Ghana <onboarding@resend.dev>',
        to: [email],
        subject: `✅ Support Request Received - #${ticketId}`,
        html: confirmationTemplate,
      }),
    });

    const confirmationResult = await confirmationResponse.json();

    // Log results
    console.log('📊 Email Results:');
    console.log(`   Support team: ${supportResponse.ok ? '✅ Sent' : '❌ Failed'} (${supportResponse.status})`);
    console.log(`   Customer: ${confirmationResponse.ok ? '✅ Sent' : '❌ Failed'} (${confirmationResponse.status})`);

    // Always return success to frontend (customer experience first)
    res.json({
      success: true,
      message: 'Support request processed successfully',
      ticketId: ticketId,
      emails: {
        supportSent: supportResponse.ok,
        confirmationSent: confirmationResponse.ok,
        supportEmailId: supportResponse.ok ? supportResult.id : null,
        confirmationEmailId: confirmationResponse.ok ? confirmationResult.id : null
      }
    });

  } catch (error) {
    console.error('❌ Server Error:', error);
    
    // Smart error categorization
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.message.includes('400') || error.message.includes('422')) {
      statusCode = 400;
      errorMessage = 'Invalid request data';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      statusCode = 503;
      errorMessage = 'Email service temporarily unavailable';
    } else if (error.message.includes('429')) {
      statusCode = 429;
      errorMessage = 'Too many requests - please try again later';
    }

    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// PRODUCTION SERVER START
const server = app.listen(PORT, '0.0.0.0', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const appName = process.env.FLY_APP_NAME || 'your-app-name';
  const baseUrl = isProduction
    ? `https://${appName}.fly.dev`
    : `http://localhost:${PORT}`;
    
  console.log('='.repeat(60));
  console.log(`🚀 Tax Laws Ghana Support API`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Node.js: ${process.version}`);
  console.log(`📡 Listening on: ${baseUrl}`);
  console.log(`📧 Support API: ${baseUrl}/api/send-support`);
  console.log(`✅ Health Check: ${baseUrl}/api/health`);
  console.log(`🔑 Resend Email: ✅ Configured`);
  console.log(`💻 PID: ${process.pid}`);
  console.log('='.repeat(60));
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;  // For testing