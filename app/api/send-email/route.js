import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { to, subject, text } = await req.json();

    // Validate environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    console.log('📧 Attempting to send email to:', to);
    console.log('📧 Using SMTP user:', process.env.SMTP_USER);
    console.log('📧 Password length:', process.env.SMTP_PASS?.length);
    console.log('📧 Password (first 4 chars):', process.env.SMTP_PASS?.substring(0, 4) + '...');

    // Use port 587 with explicit settings
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service directly
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.trim(), // Trim whitespace
      },
      logger: true, // Enable logging
      debug: true, // Enable debug output
    });

    console.log('🔌 Verifying SMTP connection...');
    
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      throw verifyError;
    }

    const toEmail = to || process.env.ALERT_EMAIL_FROM;

    console.log('📤 Sending email...');
    
    const info = await transporter.sendMail({
      from: `"AI Object Detector" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: subject || "🚨 Person detected by AI system!",
      text: text || "Your AI detection system just detected a person.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">🚨 Person Detected!</h2>
          <p>${text || "Your AI detection system just detected a person."}</p>
          <p style="color: #6b7280; font-size: 12px;">Sent by AI Object Detector</p>
        </div>
      `
    });

    console.log("📩 Email sent successfully:", info.messageId, "to:", toEmail);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("❌ Email Error:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error response:", error.response);
    console.error("❌ Full error:", error);
    
    // Provide more specific error messages
    let userMessage = error.message;
    if (error.code === 'ECONNRESET') {
      userMessage = 'Connection reset. Your App Password may be incorrect.';
    } else if (error.code === 'EAUTH' || error.responseCode === 535) {
      userMessage = 'Authentication failed. Generate a NEW Gmail App Password.';
    } else if (error.code === 'ETIMEDOUT') {
      userMessage = 'Connection timed out after ports verified OK. Try regenerating your App Password.';
    } else if (error.code === 'ECONNREFUSED') {
      userMessage = 'Connection refused. SMTP ports are blocked by your network/firewall.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: userMessage, 
        code: error.code,
        responseCode: error.responseCode,
        details: error.response
      },
      { status: 500 }
    );
  }
}