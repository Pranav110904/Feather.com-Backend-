const otpTemplate = ({ name, otp }) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Identity</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .email-wrapper {
        max-width: 600px;
        width: 100%;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid #e5e5e5;
      }
      
      .header {
        background: #000000;
        padding: 40px 30px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
        animation: pulse 3s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      
      .lock-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        backdrop-filter: blur(10px);
        position: relative;
        z-index: 1;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }
      
      .lock-icon svg {
        width: 30px;
        height: 30px;
        fill: #ffffff;
      }
      
      .header h1 {
        color: #ffffff;
        font-size: 28px;
        font-weight: 700;
        position: relative;
        z-index: 1;
        margin: 0;
      }
      
      .content {
        padding: 50px 40px;
        background: #ffffff;
      }
      
      .greeting {
        font-size: 20px;
        color: #000000;
        font-weight: 600;
        margin-bottom: 20px;
      }
      
      .message {
        font-size: 16px;
        color: #4a4a4a;
        line-height: 1.6;
        margin-bottom: 30px;
      }
      
      .otp-container {
        background: #f5f5f5;
        border-radius: 16px;
        padding: 30px;
        margin: 30px 0;
        text-align: center;
        border: 2px dashed #d4d4d4;
      }
      
      .otp-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #737373;
        font-weight: 600;
        margin-bottom: 15px;
      }
      
      .otp-code {
        font-size: 42px;
        font-weight: 800;
        color: #000000;
        letter-spacing: 8px;
        font-family: 'Courier New', monospace;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .otp-validity {
        margin-top: 15px;
        font-size: 13px;
        color: #737373;
      }
      
      .otp-validity strong {
        color: #000000;
        font-weight: 600;
      }
      
      .warning-box {
        background: #f5f5f5;
        border-left: 4px solid #000000;
        padding: 15px 20px;
        border-radius: 8px;
        margin: 25px 0;
      }
      
      .warning-box p {
        color: #1a1a1a;
        font-size: 14px;
        margin: 0;
      }
      
      .info-text {
        font-size: 14px;
        color: #737373;
        margin-top: 25px;
        line-height: 1.6;
      }
      
      .footer {
        background: #fafafa;
        padding: 30px 40px;
        text-align: center;
        border-top: 1px solid #e5e5e5;
      }
      
      .footer-text {
        font-size: 13px;
        color: #a3a3a3;
        line-height: 1.6;
      }
      
      .footer-links {
        margin-top: 15px;
      }
      
      .footer-links a {
        color: #000000;
        text-decoration: none;
        font-size: 13px;
        margin: 0 10px;
        font-weight: 500;
      }
      
      .footer-links a:hover {
        text-decoration: underline;
      }
      
      @media screen and (max-width: 640px) {
        .email-wrapper {
          border-radius: 16px;
        }
        
        .header {
          padding: 30px 20px;
        }
        
        .header h1 {
          font-size: 24px;
        }
        
        .content {
          padding: 35px 25px;
        }
        
        .greeting {
          font-size: 18px;
        }
        
        .otp-code {
          font-size: 32px;
          letter-spacing: 6px;
        }
        
        .footer {
          padding: 25px 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="header">
        <div class="lock-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V19h-2v-1.277c-.595-.347-1-.985-1-1.723 0-1.103.897-2 2-2s2 .897 2 2c0 .738-.405 1.376-1 1.723z"/>
          </svg>
        </div>
        <h1>Verification Code</h1>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${name}! 👋</div>
        
        <p class="message">
          We received a request to verify your identity. To complete your authentication, please use the one-time password (OTP) below:
        </p>
        
        <div class="otp-container">
          <div class="otp-label">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-validity">Valid for <strong>5 min</strong></div>
        </div>
        
        <div class="warning-box">
          <p>⚠️ Never share this code with anyone. Our team will never ask for your OTP.</p>
        </div>
        
        <p class="info-text">
          If you didn't request this verification code, please ignore this email and consider changing your password for security purposes. If you have any concerns, don't hesitate to contact our support team.
        </p>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          This is an automated message sent from a monitored mailbox.<br>
          Please do not reply to this email.
        </p>
        <div class="footer-links">
          <a href="#">Help Center</a>
          <a href="#">Contact Support</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export default otpTemplate;
