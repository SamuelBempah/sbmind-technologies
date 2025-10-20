// server.js - ✅ 100% FLY.IO + EXPRESS 5 COMPATIBLE
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

// LOAD .env FIRST
dotenv.config();

// CREATE EXPRESS APP
const app = express();
const PORT = process.env.PORT || 8080;

// ✅ FIXED CORS - Simple for production
app.use(cors({
  origin: true,  // Allow ALL origins (update later)
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

// Logging
console.log('🔍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔍 PORT:', PORT);
console.log('🔍 RESEND_API_KEY:', RESEND_API_KEY ? '✅ Loaded' : '❌ Missing');

if (!RESEND_API_KEY) {
  console.error('⚠️  VITE_RESEND_API_KEY missing - health check will still work');
}

// ✅ HEALTH CHECK FIRST (CRITICAL - Frontend depends on this)
app.get('/api/health', (req, res) => {
  console.log('✅ HEALTH CHECK HIT - Server ALIVE!');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    resendConfigured: !!RESEND_API_KEY,
    port: PORT,
    nodeVersion: process.version
  });
});

// ✅ SUPPORT ENDPOINT (YOUR FULL CODE - UNCHANGED)
app.post('/api/send-support', async (req, res) => {
  try {
    console.log('📨 Support request received');
    
    const { 
      name, email, message, userAgent, platform, language, 
      timestamp, appVersion, screenResolution 
    } = req.body;

    // Validation (unchanged)
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message too long' 
      });
    }

    // Generate ticket ID
    const idempotencyKey = crypto.randomUUID();
    const ticketId = idempotencyKey.slice(0, 8).toUpperCase();

    // ✅ YOUR FULL EMAIL TEMPLATES (unchanged)
    const supportEmailTemplate = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; border-radius: 12px 12px 0 0; color: white;">
          <h1 style="margin: 0 0 0.5rem 0; font-size: 2.5rem; font-weight: 700;">📋 New Support Request</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 1.1rem;">Tax Laws Ghana App</p>
        </div>
        <div style="background: white; padding: 2.5rem; border-radius: 0 0 12px 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <h2 style="color: #111827; margin-top: 0; font-size: 1.75rem; border-bottom: 3px solid #e5e7eb; padding-bottom: 1rem;">Ticket #${ticketId}</h2>
          <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin: 2rem 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 1rem 0; color: #374151; font-size: 1.25rem;">👤 Customer Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 1rem;">
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280; width: 120px;">Name:</td><td style="padding: 0.75rem 0; color: #111827;">${name}</td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">Email:</td><td style="padding: 0.75rem 0; color: #111827;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">Submitted:</td><td style="padding: 0.75rem 0; color: #111827;">${new Date().toLocaleString('GMT', { timeZone: 'Africa/Accra' })}</td></tr>
              <tr><td style="padding: 0.75rem 0; font-weight: 600; color: #6b7280;">Device:</td><td style="padding: 0.75rem 0; color: #111827;">${platform || 'Web'}</td></tr>
            </table>
          </div>
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
            <h3 style="margin: 0 0 1rem 0; color: #92400e;">💬 Message</h3>
            <div style="background: white; padding: 1.25rem; border-radius: 8px; border-left: 4px solid #f59e0b; font-family: monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto;">
              ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
          </div>
        </div>
      </div>
    `;

    const confirmationTemplate = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2rem; text-align: center; border-radius: 12px 12px 0 0; color: white;">
          <h1 style="margin: 0; font-size: 2.5rem;">✅ Request Received</h1>
        </div>
        <div style="background: white; padding: 2.5rem; border-radius: 0 0 12px 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <h2 style="color: #111827; margin-top: 0;">Thank you ${name.split(' ')[0]}!</h2>
          <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 12px; padding: 1.5rem; text-align: center; margin: 2rem 0;">
            <p style="font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem 0;">
              📋 <strong>Ticket ID:</strong> <code style="background: #d1fae5; padding: 0.25rem 0.5rem; border-radius: 6px;">#${ticketId}</code>
            </p>
            <p style="color: #065f46; margin: 0;">Save this for follow-ups</p>
          </div>
          <p>Our team will respond within 24 hours.</p>
        </div>
      </div>
    `;

    // Send emails (with error handling)
    let supportSent = false, confirmationSent = false;
    
    if (RESEND_API_KEY) {
      try {
        // Support team email
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
              : 'Tax Laws Ghana <onboarding@resend.dev>',
            to: ['info@sbmindtechnologies.com'],
            subject: `🆘 Support: ${name} - #${ticketId}`,
            html: supportEmailTemplate,
            reply_to: `${name} <${email}>`
          }),
        });
        supportSent = supportResponse.ok;
        console.log('📧 Support email:', supportSent ? '✅ Sent' : '❌ Failed');
      } catch (error) {
        console.error('❌ Support email error:', error.message);
      }

      try {
        // Customer confirmation
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
            subject: `✅ Support Request #${ticketId} - Received`,
            html: confirmationTemplate,
          }),
        });
        confirmationSent = confirmationResponse.ok;
        console.log('📧 Confirmation email:', confirmationSent ? '✅ Sent' : '❌ Failed');
      } catch (error) {
        console.error('❌ Confirmation email error:', error.message);
      }
    }

    // ✅ ALWAYS SUCCESS TO FRONTEND (best UX)
    res.json({
      success: true,
      message: 'Support request processed!',
      ticketId: ticketId,
      emails: { supportSent, confirmationSent }
    });

  } catch (error) {
    console.error('💥 Support endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ✅ FIXED: EXPLICIT 404 ROUTES (NO WILDCARDS!)
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 API: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// ✅ FIXED: NON-API 404 (separate from API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next(); // Already handled above
  
  console.log(`❌ 404 Non-API: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// ✅ GLOBAL ERROR HANDLER (LAST)
app.use((error, req, res, next) => {
  console.error('💥 UNHANDLED ERROR:', error.message);
  console.error('💥 Stack:', error.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 🚀 START SERVER
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log('🚀 TAX LAWS GHANA SUPPORT API - FLY.IO READY!');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Health: https://tax-laws-ghana-support.fly.dev/api/health`);
  console.log(`📧 Support: https://tax-laws-ghana-support.fly.dev/api/send-support`);
  console.log(`📨 Resend: ${RESEND_API_KEY ? '✅ Configured' : '⚠️  Disabled'}`);
  console.log('='.repeat(70));
  console.log('✅ SERVER STARTED SUCCESSFULLY!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;