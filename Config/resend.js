import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log("Provide SMTP credentials in the .env file");
}

// Same structure as before 👇
const sendEmail = async ({ reciver, subject, html }) => {
  try {
    // create transporter (mail sender)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // send the email
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: reciver, // 👈 keeping your same parameter
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", info.messageId);
    return { success: true, data: info };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, message: err.message };
  }
};

export default sendEmail;
