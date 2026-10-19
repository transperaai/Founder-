import { createServer, type Server } from "node:http";
import fixtures from "./fixtures.json";

// A stand-in for api.fathom.ai/external/v1, serving fixtures. Accepts only
// VALID_KEY. Used by the Fathom client tests and, as a separate process, by Playwright.

export const VALID_KEY = "fathom-test-key";

export type FakeFathomOptions = {
  /** Fail the next N requests to this path prefix with the given status. */
  failures?: { path: string; status: number; times: number; retryAfter?: number }[];
};

export function createFakeFathom(options: FakeFathomOptions = {}) {
  const requests: { path: string; query: Record<string, string>; apiKey: string | undefined }[] = [];
  const failures = options.failures?.map((f) => ({ ...f })) ?? [];

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname.replace(/^\/external\/v1/, "");
    const apiKey = req.headers["x-api-key"] as string | undefined;
    requests.push({ path, query: Object.fromEntries(url.searchParams), apiKey });
    const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { "content-type": "application/json", ...headers });
      res.end(JSON.stringify(body));
    };

    if (path === "/health") return send(200, { ok: true });
    const failure = failures.find((f) => path.startsWith(f.path) && f.times > 0);
    if (failure) {
      failure.times--;
      return send(failure.status, { error: "failure" }, failure.retryAfter ? { "retry-after": String(failure.retryAfter) } : {});
    }
    if (apiKey !== VALID_KEY) return send(401, { error: "unauthorized" });

    if (path === "/meetings") {
      const cursor = url.searchParams.get("cursor");
      const index = cursor ? fixtures.pages.findIndex((_, i) => `page-${i + 1}` === cursor) : 0;
      if (index < 0) return send(400, { error: "bad cursor" });
      return send(200, fixtures.pages[index]);
    }
    const transcript = path.match(/^\/recordings\/(\d+)\/transcript$/);
    if (transcript) {
      const items = (fixtures.transcripts as Record<string, unknown>)[transcript[1]];
      return items ? send(200, { transcript: items }) : send(404, { error: "not found" });
    }
    send(404, { error: "not found" });
  });

  return {
    requests,
    async start(port = 0) {
      await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
      const address = server.address() as { port: number };
      return `http://127.0.0.1:${address.port}/external/v1`;
    },
    stop: () => new Promise<void>((resolve) => (server as Server).close(() => resolve())),
  };
}

// `tsx tests/fake-fathom/server.ts` runs it standalone for Playwright.
if (process.argv[1]?.endsWith("fake-fathom/server.ts")) {
  const port = Number(process.env.FAKE_FATHOM_PORT ?? 3101);
  createFakeFathom()
    .start(port)
    .then((url) => console.log(`Fake Fathom listening on ${url}`));
}
