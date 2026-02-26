import nodemailer from "nodemailer";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map();

function cleanupRateLimit(now) {
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length > 0) {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const now = Date.now();
    cleanupRateLimit(now);

    const ip = getClientIp(req);
    const rateData = rateLimitStore.get(ip) || { count: 0, windowStart: now };
    if (now - rateData.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateData.count = 0;
      rateData.windowStart = now;
    }
    rateData.count += 1;
    rateLimitStore.set(ip, rateData);

    if (rateData.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ ok: false, error: "Too many requests. Try again later." });
    }

    const body = parseBody(req);
    if (body === null) {
      return res.status(400).json({ ok: false, error: "Invalid JSON body." });
    }
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();
    const company = String(body?.company || "").trim();

    if (company) {
      return res.status(200).json({ ok: true });
    }

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ ok: false, error: "Name must be between 2 and 80 characters." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Please provide a valid email address." });
    }
    if (message.length < 10 || message.length > 5000) {
      return res.status(400).json({ ok: false, error: "Message must be between 10 and 5000 characters." });
    }

    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const CONTACT_EMAIL = process.env.CONTACT_EMAIL;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !CONTACT_EMAIL) {
      console.error("Missing SMTP/CONTACT environment variables.");
      return res.status(500).json({ ok: false, error: "Server email is not configured." });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      to: CONTACT_EMAIL,
      from: SMTP_USER,
      replyTo: email,
      subject: `New message from ${name} via portfolio`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send message." });
  }
}
