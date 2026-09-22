import { createFileRoute } from "@tanstack/react-router";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(status: number, body: unknown) {
  return withCors(
    Response.json(body, {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function handlePost({ request }: { request: Request }) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) {
    return withCors(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="skyhook", error="invalid_token"',
        },
      }),
    );
  }

  const { resolveMcpToken, handleMcpBody } = await import(
    "@/lib/skyhook/mcp.server"
  );
  const session = await resolveMcpToken(token);
  if (!session) {
    return withCors(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="skyhook", error="invalid_token"',
        },
      }),
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    });
  }

  try {
    const { responses, notification } = await handleMcpBody(session.userId, body);
    if (notification) {
      return withCors(new Response(null, { status: 202 }));
    }
    const payload = responses.length === 1 ? responses[0] : responses;
    return json(200, payload);
  } catch (err) {
    return json(500, {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: err instanceof Error ? err.message : "Internal error",
      },
    });
  }
}

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      OPTIONS: async () => withCors(new Response(null, { status: 204 })),
      GET: async () =>
        json(200, {
          name: "skyhook",
          title: "Skyhook S3 MCP",
          version: "1.0.0",
          transport: "streamable-http",
          auth: "bearer",
        }),
      POST: handlePost,
      DELETE: async () => withCors(new Response(null, { status: 204 })),
    },
  },
});
