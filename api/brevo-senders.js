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

export default async function handler(req, res) {
  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ error: "BREVO_API_KEY not set" });
  }
  try {
    const sender = await getVerifiedSender();
    if (!sender) return res.status(404).json({ error: "NO_VERIFIED_SENDER" });
    res.json({ sender });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
