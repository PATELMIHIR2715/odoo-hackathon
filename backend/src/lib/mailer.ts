import dns from "node:dns";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

dns.setDefaultResultOrder("ipv4first");

const smtpConfig =
  env.SMTP_HOST &&
  env.SMTP_PORT &&
  env.SMTP_USER &&
  env.SMTP_PASS &&
  env.MAIL_FROM
    ? {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.MAIL_FROM,
      }
    : null;

const transporter = smtpConfig
  ? nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
      pass: smtpConfig.pass,
      },
    })
  : null;

export default transporter;

export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
  if (!transporter || !smtpConfig) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "SMTP configuration is required to send password reset emails",
      );
    }

    return;
  }

  const resetLink = new URL(env.PASSWORD_RESET_PATH, env.FRONTEND_URL);
  resetLink.searchParams.set("token", resetToken);

  try {
    await transporter.sendMail({
      from: smtpConfig.from,
      to,
      subject: "Reset your password",
      text: [
        "We received a request to reset your password.",
        "",
        `Reset your password here: ${resetLink.toString()}`,
        "",
        "This link expires in 15 minutes.",
        "If you did not request this, you can safely ignore this email.",
      ].join("\n"),
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink.toString()}">Reset your password</a></p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });
  } catch (error) {
    if (env.NODE_ENV !== "production") {
      console.error("Password reset email failed:", error);
    }
    throw new Error(
      `Failed to send password reset email: ${(error as Error).message}`,
    );
  }
};
