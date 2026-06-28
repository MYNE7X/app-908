async function brevoRequest(path, method = "GET", body = null) {
  const apiKey = process.env.BREVO_API_KEY;
  const opts = {
    method,
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.brevo.com/v3${path}`, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function getVerifiedSender() {
  const { ok, data } = await brevoRequest("/senders");
  if (ok && Array.isArray(data?.senders) && data.senders.length > 0) {
    const verified = data.senders.find((s) => s.active !== false) || data.senders[0];
    return { name: verified.name || "Expert Solutions", email: verified.email };
  }
  const { ok: ok2, data: data2 } = await brevoRequest("/account");
  if (ok2 && data2?.email) {
    return { name: data2.companyName || data2.firstName || "Expert Solutions", email: data2.email };
  }
  return null;
}

function buildEmailHtml(toName, packageName, activationKey) {
  const firstName = (toName || "Member").split(" ")[0];
  const steps = [
    { emoji: "🔐", text: "Log in to your <strong>Expert Solutions</strong> account" },
    { emoji: "📦", text: "Open the <strong>Packages</strong> page from the menu" },
    { emoji: "🗝️", text: "Find the <em>\"Have an Activation Key?\"</em> section" },
    { emoji: "✅", text: "Paste your key and click <strong>Redeem</strong>" },
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Your Activation Key — Expert Solutions</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;padding:40px 16px 60px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="text-align:center;padding-bottom:22px;">
    <table cellpadding="0" cellspacing="0" style="display:inline-table;">
      <tr>
        <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);width:36px;height:36px;border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;color:#fff;">💼</td>
        <td style="padding-left:10px;vertical-align:middle;">
          <span style="font-size:18px;font-weight:800;color:#1e1b4b;letter-spacing:-0.3px;">Expert Solutions</span>
        </td>
      </tr>
    </table>
    <p style="margin:5px 0 0;color:#6b7280;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Pakistan's Earning Platform</p>
  </td></tr>
  <tr><td style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 48px rgba(79,70,229,0.14),0 2px 8px rgba(0,0,0,0.05);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:linear-gradient(135deg,#1e1b4b 0%,#3730a3 40%,#6d28d9 100%);padding:48px 40px 52px;text-align:center;">
          <div style="font-size:56px;line-height:1;margin-bottom:16px;">🎉</div>
          <h1 style="margin:0;color:#fff;font-size:27px;font-weight:900;letter-spacing:-0.5px;line-height:1.2;">Package Approved!</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.72);font-size:14px;">Your <strong style="color:#c4b5fd;">${packageName || "package"}</strong> is ready to activate</p>
          <div style="display:inline-block;margin-top:18px;background:rgba(52,211,153,0.18);border:1px solid rgba(52,211,153,0.45);border-radius:100px;padding:7px 20px;">
            <span style="color:#6ee7b7;font-size:12px;font-weight:800;letter-spacing:0.5px;">✓ &nbsp;VERIFIED &amp; APPROVED</span>
          </div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#111827;">Hi ${firstName}! 👋</p>
        <p style="margin:0 0 28px;font-size:14px;color:#4b5563;line-height:1.75;">
          Great news — your <strong style="color:#4f46e5;">${packageName || "package"}</strong> purchase has been reviewed and approved by our team.
          Use the key below to instantly activate your account and start earning <strong>PKR daily</strong>.
        </p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px solid #c4b5fd;border-radius:20px;">
          <tr><td style="padding:28px 24px;text-align:center;">
            <p style="margin:0 0 14px;font-size:10px;text-transform:uppercase;letter-spacing:3px;font-weight:800;color:#7c3aed;">🔑 &nbsp;Your Activation Key</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="background:#1e1b4b;border-radius:14px;padding:18px 28px;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:6px;">${activationKey}</span>
              </td></tr>
            </table>
            <p style="margin:14px 0 0;font-size:11px;color:#6d28d9;font-weight:600;">☝️ Copy this exactly — case-sensitive &amp; single-use only</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 40px 8px;">
        <p style="margin:0 0 16px;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:#9ca3af;">How to redeem in 4 easy steps</p>
        ${steps.map((s) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
          <tr>
            <td width="42" valign="middle">
              <div style="width:36px;height:36px;background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:10px;text-align:center;line-height:36px;font-size:18px;">${s.emoji}</div>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.55;">${s.text}</p>
            </td>
          </tr>
        </table>`).join("")}
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0;font-size:12px;color:#92400e;line-height:1.7;">
              ⚠️ <strong>Important:</strong> This key activates <strong>one account only</strong> and becomes invalid after use.
              Do not share it with anyone. Contact our support team if you face any issues redeeming it.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px 40px 36px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:13px;padding:15px 38px;">
            <span style="color:#fff;font-size:15px;font-weight:700;letter-spacing:0.3px;text-decoration:none;">Open Expert Solutions →</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid #f3f4f6;padding:20px 40px 28px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Expert Solutions · Pakistan's Trusted Earning Platform</p>
        <p style="margin:0;font-size:11px;color:#d1d5db;">You received this because your package purchase was approved by an admin.</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="text-align:center;padding-top:22px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Made with 💜 in Pakistan</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toEmail, toName, activationKey, packageName } = req.body;
  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ error: "Email service not configured" });
  }
  if (!toEmail || !activationKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const sender = await getVerifiedSender();
    if (!sender) {
      return res.status(422).json({
        error: "NO_VERIFIED_SENDER",
        fixUrl: "https://app.brevo.com/senders",
      });
    }

    console.log(`[email] ${sender.email} → ${toEmail} | key: ${activationKey}`);

    const { ok, status, data } = await brevoRequest("/smtp/email", "POST", {
      sender,
      to: [{ email: toEmail, name: toName || toEmail }],
      subject: `🎉 Your Activation Key — ${packageName || "Expert Solutions"}`,
      htmlContent: buildEmailHtml(toName, packageName, activationKey),
    });

    console.log(`[email] Brevo ${status}:`, JSON.stringify(data));

    if (!ok) {
      const msg = data?.message || "";
      const isIpBlock =
        msg.toLowerCase().includes("unrecogni") ||
        msg.toLowerCase().includes("ip address") ||
        status === 401;
      if (isIpBlock) {
        return res.status(403).json({
          error: "IP_NOT_AUTHORIZED",
          authorizeUrl: "https://app.brevo.com/security/authorised_ips",
        });
      }
      return res.status(500).json({ error: msg || "Brevo rejected the request" });
    }

    res.json({ success: true, messageId: data.messageId, sentFrom: sender.email });
  } catch (err) {
    console.error("[email] Error:", err);
    res.status(500).json({ error: String(err) });
  }
}
