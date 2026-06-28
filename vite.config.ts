import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import type { IncomingMessage, ServerResponse } from "node:http";

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

function jsonResponse(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function brevoRequest(path: string, method = "GET", body: unknown = null) {
  const apiKey = process.env.BREVO_API_KEY;
  const opts: RequestInit = {
    method,
    headers: { "api-key": apiKey!, "Content-Type": "application/json", Accept: "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.brevo.com/v3${path}`, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function getVerifiedSender() {
  const { ok, data } = await brevoRequest("/senders");
  if (ok && Array.isArray(data?.senders) && data.senders.length > 0) {
    const verified = data.senders.find((s: { active?: boolean }) => s.active !== false) || data.senders[0];
    return { name: verified.name || "Expert Solutions", email: verified.email };
  }
  const { ok: ok2, data: data2 } = await brevoRequest("/account");
  if (ok2 && data2?.email) {
    return { name: data2.companyName || data2.firstName || "Expert Solutions", email: data2.email };
  }
  return null;
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    {
      name: "api-dev-middleware",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ?? "";

          if (url === "/api/config" && req.method === "GET") {
            const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            const supabaseAnonKey =
              process.env.SUPABASE_ANON_KEY ||
              process.env.SUPABASE_PUBLISHABLE_KEY ||
              process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
            if (!supabaseUrl || !supabaseAnonKey) {
              return jsonResponse(res, 500, { error: "Supabase credentials not configured" });
            }
            return jsonResponse(res, 200, { supabaseUrl, supabaseAnonKey });
          }

          if (url === "/api/brevo-senders" && req.method === "GET") {
            if (!process.env.BREVO_API_KEY)
              return jsonResponse(res, 500, { error: "BREVO_API_KEY not set" });
            try {
              const sender = await getVerifiedSender();
              if (!sender) return jsonResponse(res, 404, { error: "NO_VERIFIED_SENDER" });
              return jsonResponse(res, 200, { sender });
            } catch (err) {
              return jsonResponse(res, 500, { error: String(err) });
            }
          }

          if (url === "/api/send-activation-email" && req.method === "POST") {
            if (!process.env.BREVO_API_KEY)
              return jsonResponse(res, 500, { error: "Email service not configured" });
            const body = await parseBody(req);
            const { toEmail, toName, activationKey, packageName } = body as Record<string, string>;
            if (!toEmail || !activationKey)
              return jsonResponse(res, 400, { error: "Missing required fields" });
            try {
              const sender = await getVerifiedSender();
              if (!sender)
                return jsonResponse(res, 422, {
                  error: "NO_VERIFIED_SENDER",
                  fixUrl: "https://app.brevo.com/senders",
                });
              const { ok, status, data } = await brevoRequest("/smtp/email", "POST", {
                sender,
                to: [{ email: toEmail, name: toName || toEmail }],
                subject: `🎉 Your Activation Key — ${packageName || "Expert Solutions"}`,
              });
              if (!ok) {
                const msg = data?.message || "";
                const isIpBlock =
                  msg.toLowerCase().includes("unrecogni") ||
                  msg.toLowerCase().includes("ip address") ||
                  status === 401;
                if (isIpBlock)
                  return jsonResponse(res, 403, {
                    error: "IP_NOT_AUTHORIZED",
                    authorizeUrl: "https://app.brevo.com/security/authorised_ips",
                  });
                return jsonResponse(res, 500, { error: msg || "Brevo rejected the request" });
              }
              return jsonResponse(res, 200, {
                success: true,
                messageId: data.messageId,
                sentFrom: sender.email,
              });
            } catch (err) {
              return jsonResponse(res, 500, { error: String(err) });
            }
          }

          next();
        });
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
