#!/usr/bin/env node

// Servidor Node.js persistente pra rodar em VPS/Railway/Render — adaptador
// Express oficial do Expo Router (docs.expo.dev/router/reference/api-routes),
// escolhido em vez de EAS Hosting (Cloudflare Workers) porque o compilador
// de consultas WASM do Prisma 7 (~5MB) se repete em cada uma das 35 rotas
// de API quando empacotado como função serverless, estourando o limite de
// 64MB por função do Workers. Aqui é um processo só, sem esse limite.
const path = require("path");
const { createRequestHandler } = require("expo-server/adapter/express");

const express = require("express");
const compression = require("compression");
const morgan = require("morgan");

const CLIENT_BUILD_DIR = path.join(process.cwd(), "dist/client");
const SERVER_BUILD_DIR = path.join(process.cwd(), "dist/server");

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

process.env.NODE_ENV = "production";

app.use(
  express.static(CLIENT_BUILD_DIR, {
    maxAge: "1h",
    extensions: ["html"],
  })
);

app.use(morgan("tiny"));

// Fuso horário do celular (header X-Timezone, mandado pelo app em toda
// chamada) disponível pra requisição inteira — "hoje" e "agora" no backend
// seguem o relógio do aparelho (ver src/lib/timeZone.ts, que lê este mesmo
// store via globalThis: server.js e as rotas são bundles separados).
const { AsyncLocalStorage } = require("node:async_hooks");
globalThis.__convivoRequestContext ??= new AsyncLocalStorage();
const TIME_ZONE_PATTERN = /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/;

function validTimeZone(value) {
  if (typeof value !== "string" || value.length > 64 || !TIME_ZONE_PATTERN.test(value)) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return null;
  }
}

app.use((req, _res, next) => {
  const timeZone = validTimeZone(req.get("x-timezone")) ?? "America/Sao_Paulo";
  globalThis.__convivoRequestContext.run({ timeZone }, next);
});

app.all(
  "/{*all}",
  createRequestHandler({
    build: SERVER_BUILD_DIR,
  })
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
