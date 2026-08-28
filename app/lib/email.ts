import nodemailer from "nodemailer"

const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587")

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp-relay.gmail.com",
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465 (implicit TLS), false for 587/25 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
}

interface ISendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: ISendEmailParams) {
  const transporter = nodemailer.createTransport(SMTP_CONFIG)
  return await transporter.sendMail({
    from: `"TGA Electroplaters" <${SMTP_CONFIG.auth.user}>`,
    to,
    subject,
    html,
  })
}
