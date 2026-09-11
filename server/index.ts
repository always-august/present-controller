import { createServer } from "node:http";
import next from "next";
import { RoomEngine } from "./engine";
import { createRestHandler } from "./rest";
import { RoomStore } from "./store";
import { RoomSocketServer } from "./ws";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";

async function main() {
  const app = next({ dev, hostname, port });
  await app.prepare();
  const handle = app.getRequestHandler();
  const nextUpgrade = app.getUpgradeHandler();

  const store = new RoomStore();
  // engine과 ws가 서로를 참조하므로 broadcast는 지연 바인딩
  let sockets: RoomSocketServer;
  const engine = new RoomEngine(store, (roomId, event) => sockets.broadcast(roomId, event));
  sockets = new RoomSocketServer(store, engine);
  const rest = createRestHandler(store, engine);

  const server = createServer(async (req, res) => {
    try {
      if (await rest(req, res)) return;
      await handle(req, res);
    } catch (err) {
      console.error("[http] error", err);
      if (!res.headersSent) res.writeHead(500).end("internal error");
    }
  });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    if (pathname === "/ws") {
      sockets.handleUpgrade(req, socket, head);
    } else {
      // Next dev HMR 웹소켓 등
      nextUpgrade(req, socket, head);
    }
  });

  const shutdown = () => {
    console.log("[server] flushing snapshot and exiting");
    store.flush();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  server.listen(port, hostname, () => {
    console.log(`> presenter-timer ready on http://localhost:${port} (${dev ? "dev" : "prod"})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
