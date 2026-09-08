// WhatsApp Cloud API (Meta) — real implementations
// All functions send template messages via https://graph.facebook.com/v21.0/{phoneNumberId}/messages

const META_URL = `https://graph.facebook.com/v21.0/${process.env.META_WA_PHONE_NUMBER_ID}/messages`;

async function sendTemplate(
  toPhone: string,
  templateName: string,
  parameters: { type: "text"; text: string }[]
): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("[whatsapp] META_WA_ACCESS_TOKEN or META_WA_PHONE_NUMBER_ID not set — skipping send");
    return { ok: false, error: "WhatsApp not configured" };
  }

  // Normalise phone: strip non-digits, ensure no leading +
  const phone = toPhone.replace(/\D/g, "");

  try {
    const res = await fetch(META_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [{ type: "body", parameters }],
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[whatsapp] Meta rejected template="${templateName}" to=${phone}:`, data?.error);
      return { ok: false, error: data?.error?.message ?? "Meta API error" };
    }

    const messageId = data?.messages?.[0]?.id;
    console.log(`[whatsapp] sent template="${templateName}" to=+${phone} messageId=${messageId}`);
    return { ok: true, messageId };
  } catch (err: any) {
    console.error(`[whatsapp] network error template="${templateName}" to=${phone}:`, err?.message);
    return { ok: false, error: err?.message ?? "Network error" };
  }
}

// ─── Transactional senders ────────────────────────────────────────────────────

export async function sendInviteWithOtp(args: {
  toPhone: string;
  name: string;
  otp: string;
  url: string;
}) {
  const templateName = process.env.META_WA_TEMPLATE_NAME;
  if (!templateName) return { ok: false as const, error: "META_WA_TEMPLATE_NAME not set" };
  return sendTemplate(args.toPhone, templateName, [
    { type: "text", text: args.name },
    { type: "text", text: args.otp },
    { type: "text", text: args.url },
  ]);
}

export async function sendOnboardingReminder(args: {
  toPhone: string;
  name: string;
  url: string;
}) {
  const templateName = process.env.META_WA_TEMPLATE_CREDENTIALS;
  if (!templateName) return { ok: false as const, error: "META_WA_TEMPLATE_CREDENTIALS not set" };
  return sendTemplate(args.toPhone, templateName, [
    { type: "text", text: args.name },
    { type: "text", text: args.url },
  ]);
}

export async function sendProfileReminder(args: {
  toPhone: string;
  name: string;
  loginUrl: string;
  missing: string[];
}) {
  const templateName = process.env.META_WA_TEMPLATE_PROFILE_REMINDER;
  if (!templateName) return { ok: false as const, error: "META_WA_TEMPLATE_PROFILE_REMINDER not set" };
  return sendTemplate(args.toPhone, templateName, [
    { type: "text", text: args.name },
    { type: "text", text: args.missing.join(", ") },
    { type: "text", text: args.loginUrl },
  ]);
}

export async function sendWelcomeMessage(args: {
  toPhone: string;
  name: string;
  email: string;
  tempPassword: string;
}) {
  const templateName = process.env.META_WA_TEMPLATE_CREDENTIALS;
  if (!templateName) return { ok: false as const, error: "META_WA_TEMPLATE_CREDENTIALS not set" };
  return sendTemplate(args.toPhone, templateName, [
    { type: "text", text: args.name },
    { type: "text", text: args.email },
    { type: "text", text: args.tempPassword },
  ]);
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export async function sendLoanEmiReminder(args: {
  toPhone: string;
  borrowerName: string;
  emiNumber: number;
  emiAmount: string;
  dueDate: string;
  loanType: string;
}) {
  const templateName = process.env.META_WA_BROADCAST_TEMPLATE ?? "investor_broadcast";
  const message = `EMI #${args.emiNumber} of ${args.emiAmount} for your ${args.loanType} is due on ${args.dueDate}. Please ensure timely payment. - Hustlers Ventures`;
  const sanitized = message.replace(/[\n\r\t]/g, " ").replace(/ {4,}/g, "   ").trim();
  return sendTemplate(args.toPhone, templateName, [
    { type: "text", text: args.borrowerName },
    { type: "text", text: sanitized },
  ]);
}

export async function sendBroadcastMessage(args: {
  toPhone: string;
  name: string;
  message: string;
}) {
  const templateName = process.env.META_WA_BROADCAST_TEMPLATE ?? "investor_broadcast";
  // Meta rejects params with newlines, tabs, or 4+ consecutive spaces
  const sanitized = args.message.replace(/[\n\r\t]/g, " ").replace(/ {4,}/g, "   ").trim();
  return sendTemplate(args.toPhone, templateName, [
    { type: "text", text: args.name },
    { type: "text", text: sanitized },
  ]);
}
