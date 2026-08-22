import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your MyTube password reset code",
    text: `Your MyTube password reset code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your MyTube password reset code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });
};