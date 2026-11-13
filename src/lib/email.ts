// Transactional email transport. No provider is configured yet — like the
// "manual" payment placeholder in checkout, this logs to the console until
// RESEND_API_KEY is set, at which point it sends for real via Resend's HTTP API.
type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Reptiles Concept <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${html}`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] failed to send to ${to} (${res.status}): ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] failed to send to ${to}:`, err);
    return false;
  }
}

// Resend's batch endpoint takes up to 100 emails per call — used for list
// sends (newsletter) so we don't fire hundreds of single requests.
export async function sendEmailBatch(
  emails: SendEmailInput[],
): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Reptiles Concept <onboarding@resend.dev>";

  if (!apiKey) {
    for (const e of emails) console.log(`[email:dev] to=${e.to} subject="${e.subject}"`);
    return { sent: emails.length, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map((e) => ({ from, to: e.to, subject: e.subject, html: e.html }))),
      });
      if (res.ok) {
        sent += chunk.length;
      } else {
        failed += chunk.length;
        console.error(`[email] batch failed (${res.status}): ${await res.text().catch(() => "")}`);
      }
    } catch (err) {
      failed += chunk.length;
      console.error("[email] batch failed:", err);
    }
  }
  return { sent, failed };
}
