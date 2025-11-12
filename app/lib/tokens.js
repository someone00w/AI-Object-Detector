import crypto from 'crypto'

// Generate a random verification token
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Generate token expiry time (24 hours from now)
export function generateTokenExpiry() {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  return expiry
}

// Send verification email
export async function sendVerificationEmail(email, verificationLink) {
  try {
    // Use full URL for server-side fetch
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '✉️ Verify Your Email Address',
        text: `Welcome to DiddyWatch! Please verify your email by clicking this link: ${verificationLink}\n\nThis link expires in 24 hours.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981; margin-bottom: 20px;">Welcome to DiddyWatch!</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">
              Thank you for registering. Please verify your email address to activate your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #666; font-size: 13px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${verificationLink}
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              This verification link expires in 24 hours.<br/>
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        `
      })
    })
    return response.ok
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}