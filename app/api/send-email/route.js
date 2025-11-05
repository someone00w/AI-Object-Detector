
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { to, subject, text } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const toEmail = to || process.env.ALERT_EMAIL_TO;

    const info = await transporter.sendMail({
      from: process.env.ALERT_EMAIL_FROM,
      to: toEmail,
      subject: subject || "🚨 Person detected by AI system!",
      text: text || "Your AI detection system just detected a person.",
    });

    console.log("📩 Email sent:", info.messageId, "to:", toEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
