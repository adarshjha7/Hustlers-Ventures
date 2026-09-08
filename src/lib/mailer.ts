import nodemailer from "nodemailer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function pixel(type: string, email: string, refId?: string): string {
  const uid = Buffer.from(email).toString("base64url");
  const ref = refId ?? uid;
  return `<img src="${SITE_URL}/api/track/open?type=${type}&ref=${ref}&uid=${uid}" width="1" height="1" style="display:none" alt="" />`;
}

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail({
  toEmail,
  toName,
  otpCode,
}: {
  toEmail: string;
  toName: string;
  otpCode: string;
}) {
  await transporter.sendMail({
    from: `"Hustlers Ventures" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your Hustlers Ventures verification code",
    text: `Hi ${toName},\n\nYour one-time verification code is: ${otpCode}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n- Hustlers Ventures Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:24px">Hustlers Ventures</p>
        <h1 style="font-size:22px;font-weight:800;color:#0b1120;margin-bottom:8px">Verification Code</h1>
        <p style="font-size:14px;color:#6b7280;margin-bottom:28px">Hi ${toName}, use the code below to verify your email.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="font-size:40px;font-weight:800;letter-spacing:0.15em;color:#0b1120;margin:0;font-family:monospace">${otpCode}</p>
          <p style="font-size:12px;color:#9ca3af;margin-top:12px">Expires in 10 minutes</p>
        </div>
        <p style="font-size:12px;color:#9ca3af">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendAdminEmail({
  fromName,
  fromEmail,
  phone,
  subject,
  message,
}: {
  fromName: string;
  fromEmail: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const to = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? process.env.GMAIL_USER!;
  await transporter.sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    replyTo: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text: `From: ${fromName} <${fromEmail}>${phone ? `\nPhone: ${phone}` : ""}\n\n${message}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:24px">Hustlers Ventures · Internal</p>
        <h1 style="font-size:20px;font-weight:800;color:#0b1120;margin-bottom:20px">${subject}</h1>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr style="border-bottom:1px solid #e5e7eb">
              <td style="padding:8px 0;color:#6b7280;font-weight:600;width:80px">Name</td>
              <td style="padding:8px 0;color:#0b1120">${fromName}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb">
              <td style="padding:8px 0;color:#6b7280;font-weight:600">Email</td>
              <td style="padding:8px 0;color:#0b1120"><a href="mailto:${fromEmail}" style="color:#05ce78">${fromEmail}</a></td>
            </tr>
            ${phone ? `<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px 0;color:#6b7280;font-weight:600">Phone</td><td style="padding:8px 0;color:#0b1120">${phone}</td></tr>` : ""}
          </table>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px">
          <p style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;margin:0">${message}</p>
        </div>
      </div>
    `,
  });
}

export async function sendInvestorWelcomeEmail({
  toName,
  toEmail,
  tempPassword,
  loginUrl,
}: {
  toName: string;
  toEmail: string;
  tempPassword: string;
  loginUrl: string;
}) {
  await transporter.sendMail({
    from: `"Hustlers Ventures" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to Hustlers Ventures - Your Login Credentials",
    text: `Hi ${toName},\n\nYour investor account has been created on the Hustlers Ventures portal.\n\nLogin URL: ${loginUrl}\nEmail: ${toEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password on first sign-in.\n\n- Hustlers Ventures Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:24px">Hustlers Ventures</p>
        <h1 style="font-size:22px;font-weight:800;color:#0b1120;margin-bottom:8px">Welcome, ${toName}!</h1>
        <p style="font-size:14px;color:#6b7280;margin-bottom:28px">Your investor account is ready. Use the credentials below to sign in.</p>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr style="border-bottom:1px solid #e5e7eb">
              <td style="padding:10px 0;color:#6b7280;font-weight:600">Login URL</td>
              <td style="padding:10px 0;color:#0b1120"><a href="${loginUrl}" style="color:#05ce78">${loginUrl}</a></td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb">
              <td style="padding:10px 0;color:#6b7280;font-weight:600">Email</td>
              <td style="padding:10px 0;color:#0b1120">${toEmail}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-weight:600">Temp Password</td>
              <td style="padding:10px 0;color:#0b1120;font-family:monospace;font-size:16px;font-weight:700">${tempPassword}</td>
            </tr>
          </table>
        </div>

        <a href="${loginUrl}" style="display:inline-block;background:#05ce78;color:#ffffff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">Sign In Now</a>
        <p style="font-size:12px;color:#9ca3af;margin-top:28px">You will be prompted to change your password after first login.</p>
        ${pixel("welcome", toEmail)}
      </div>
    `,
  });
}

// Fixed operational inboxes notified whenever an investor raises a new support ticket.
export const SUPPORT_NOTIFY_EMAILS = ["anilmukkoti@gmail.com","bspn96@gmail.com"];

export async function sendSupportTicketRaisedEmail({
  investorName,
  ticketRef,
  subject,
  message,
  threadId,
}: {
  investorName: string;
  ticketRef: string;
  subject: string;
  message: string;
  threadId: string;
}) {
  const chatUrl = `${SITE_URL}/admin/support?thread=${threadId}`;
  await transporter.sendMail({
    from: `"Hustlers Ventures" <${process.env.GMAIL_USER}>`,
    to: SUPPORT_NOTIFY_EMAILS,
    subject: `Support Ticket: ${investorName} - ${subject} (${ticketRef})`,
    text: `${investorName} raised a support ticket.\n\nTicket: ${ticketRef}\nSubject: ${subject}\n\nMessage:\n${message}\n\nReply here: ${chatUrl}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:24px">Hustlers Ventures · Support</p>
        <h1 style="font-size:20px;font-weight:800;color:#0b1120;margin-bottom:14px">${subject}</h1>
        <div style="margin-bottom:18px">
          <span style="display:inline-block;background:#05ce78;color:#ffffff;font-weight:700;font-size:13px;padding:5px 12px;border-radius:999px">${investorName}</span>
          <span style="font-size:12px;color:#9ca3af;margin-left:8px">Ticket ${ticketRef}</span>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;border-top-left-radius:4px;padding:16px 18px;margin-bottom:28px;max-width:440px">
          <p style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;margin:0">${message}</p>
        </div>
        <a href="${chatUrl}" style="display:inline-block;background:#05ce78;color:#ffffff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">Open Chat</a>
      </div>
    `,
  });
}

export async function sendSupportReplyReceivedEmail({
  toEmail,
  toName,
  ticketRef,
  subject,
  threadId,
}: {
  toEmail: string;
  toName: string;
  ticketRef: string;
  subject: string;
  threadId: string;
}) {
  const chatUrl = `${SITE_URL}/dashboard/support?thread=${threadId}`;
  await transporter.sendMail({
    from: `"Hustlers Ventures" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `New reply on your support request: ${subject}`,
    text: `Hi ${toName},\n\nYou have a new message on your support request "${subject}" (${ticketRef}).\n\nView and reply: ${chatUrl}\n\n- Hustlers Ventures Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:24px">Hustlers Ventures</p>
        <h1 style="font-size:22px;font-weight:800;color:#0b1120;margin-bottom:8px">You have a new message</h1>
        <p style="font-size:14px;color:#6b7280;margin-bottom:28px">Hi ${toName}, our support team replied on your request "${subject}" (${ticketRef}).</p>
        <a href="${chatUrl}" style="display:inline-block;background:#05ce78;color:#ffffff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none">View Reply</a>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  toEmail,
  resetUrl,
}: {
  toEmail: string;
  resetUrl: string;
}) {
  await transporter.sendMail({
    from: `"Hustlers Ventures" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your Hustlers Ventures password",
    text: `You requested a password reset.\n\nClick the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email - your current password is unchanged.\n\n- Hustlers Ventures Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#ffffff">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:24px">Hustlers Ventures</p>
        <h1 style="font-size:22px;font-weight:800;color:#0b1120;margin-bottom:8px">Reset your password</h1>
        <p style="font-size:14px;color:#6b7280;margin-bottom:28px">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>

        <a href="${resetUrl}" style="display:inline-block;background:#05ce78;color:#ffffff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-bottom:28px">Set New Password</a>

        <p style="font-size:13px;color:#6b7280;margin-bottom:8px">Or copy this link into your browser:</p>
        <p style="font-size:12px;color:#0b1120;word-break:break-all;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">${resetUrl}</p>

        <p style="font-size:12px;color:#9ca3af;margin-top:28px">If you didn't request this, your current password is unchanged - no action needed.</p>
      </div>
    `,
  });
}
