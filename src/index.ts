import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import moment from "moment";
import { globalErrorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notfound.middleware";
import { serve } from "@hono/node-server";
import { env } from "./env";
import { createSessionController } from "./controllers/session";
import * as whastapp from "wa-multi-session";
import { createMessageController } from "./controllers/message";
import { CreateWebhookProps } from "./webhooks";
import { createWebhookMessage } from "./webhooks/message";
import { createWebhookSession } from "./webhooks/session";
import { createProfileController } from "./controllers/profile";
import { serveStatic } from "@hono/node-server/serve-static";
import { askOllama } from "./ollama";

const app = new Hono();

app.use(
  logger((...params) => {
    params.map((e) => console.log(`${moment().toISOString()} | ${e}`));
  })
);
app.use(cors());

app.onError(globalErrorMiddleware);
app.notFound(notFoundMiddleware);

/**
 * serve media message static files
 */
app.use(
  "/media/*",
  serveStatic({
    root: "./",
  })
);

/**
 * session routes
 */
app.route("/session", createSessionController());
/**
 * message routes
 */
app.route("/message", createMessageController());
/**
 * profile routes
 */
app.route("/profile", createProfileController());

const port = env.PORT;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

whastapp.onConnected((session) => {
  console.log(`session: '${session}' connected`);
});

// Implement Webhook
if (env.WEBHOOK_BASE_URL) {
  const webhookProps: CreateWebhookProps = {
    baseUrl: env.WEBHOOK_BASE_URL,
  };

  // message webhook
  whastapp.onMessageReceived(createWebhookMessage(webhookProps));

  // session webhook
  const webhookSession = createWebhookSession(webhookProps);

  whastapp.onConnected((session) => {
    console.log(`session: '${session}' connected`);
    webhookSession({ session, status: "connected" });
  });
  whastapp.onConnecting((session) => {
    console.log(`session: '${session}' connecting`);
    webhookSession({ session, status: "connecting" });
  });
  whastapp.onDisconnected((session) => {
    console.log(`session: '${session}' disconnected`);
    webhookSession({ session, status: "disconnected" });
  });
}
// End Implement Webhook

// Auto-reply: balas otomatis setiap kali pesan masuk, hanya 1x per pengirim
const autoReplySent = new Set<string>();
whastapp.onMessageReceived(async (msg) => {
  // Ambil isi pesan teks
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    msg.message?.contactMessage?.displayName ||
    msg.message?.locationMessage?.comment ||
    msg.message?.liveLocationMessage?.caption ||
    null;

  const to = msg.key.remoteJid;
  // Gunakan kombinasi sessionId dan remoteJid sebagai key unik
  const replyKey = `${msg.sessionId}:${to}`;
  if (text && to && text.toLowerCase().includes("halov2") && !autoReplySent.has(replyKey)) {
    await whastapp.sendTextMessage({
      sessionId: msg.sessionId,
      to,
      text: "Halo juga! Ini adalah balasan otomatis. v2",
    });
    autoReplySent.add(replyKey);
  }
});

// Auto-reply: aktif jika disummon dengan @HaiNeoBot, parameter setelahnya diproses
const botSummon = "@HaiNeoBot";
whastapp.onMessageReceived(async (msg) => {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    msg.message?.contactMessage?.displayName ||
    msg.message?.locationMessage?.comment ||
    msg.message?.liveLocationMessage?.caption ||
    null;

  const to = msg.key.remoteJid;
  if (!text || !to) return;

  // Cek apakah pesan diawali summon bot
  if (text.trim().startsWith(botSummon)) {
    // Ambil parameter setelah summon
    const param = text.trim().slice(botSummon.length).trim();
    let reply = null;
    if (/^jam berapa sekarang\??$/i.test(param)) {
      // Balas dengan jam saat ini
      const now = new Date();
      const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      reply = `Sekarang jam ${jam}`;
    } else if (param) {
      // Kirim ke Ollama jika ada parameter lain
      reply = await askOllama(param);
    }
    if (reply) {
      await whastapp.sendTextMessage({
        sessionId: msg.sessionId,
        to,
        text: reply,
      });
    }
  }
});

whastapp.loadSessionsFromStorage();
