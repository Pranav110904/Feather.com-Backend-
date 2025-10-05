import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_KEY);


if(process.env.RESEND_KEY){
  console.log("provide Resend_API in the .env file")
  
}


const sendEmail = async ({ reciver, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Feather <onboarding@resend.dev>',
      to: reciver,
      subject: subject,
      html: html,
    });

    if(error){
      console.log("Resend API returned an error:", error);
      return { success: false, message: error.message || "Error sending email" };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, message: err.message };
  }
};


export default sendEmail;