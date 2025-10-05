const verifyEmailTemplate = ({ name, url }) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Helvetica', 'Arial', sans-serif;
        background-color: #0d0d0d;
        color: #ffffff;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        background: #1c1c1c;
        border-radius: 12px;
        text-align: center;
      }
      h1 {
        color: #1DA1F2;
      }
      p {
        font-size: 16px;
        line-height: 1.6;
      }
      .button {
        display: inline-block;
        margin-top: 20px;
        padding: 12px 25px;
        font-size: 16px;
        color: #ffffff !important;
        background-color: #1DA1F2;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: background 0.3s ease;
      }
      .button:hover {
        background-color: #0d8ddb;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #aaaaaa;
      }
      @media screen and (max-width: 480px) {
        .container {
          padding: 20px;
        }
        .button {
          width: 100%;
          padding: 14px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to Feather!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for registering with Feather. Please verify your email to continue setting up your account.</p>
      <a href="${url}" class="button">Verify Email</a>
      <p class="footer">If you did not sign up for a Feather account, please ignore this email.</p>
    </div>
  </body>
  </html>
  `;
};

export default verifyEmailTemplate;
