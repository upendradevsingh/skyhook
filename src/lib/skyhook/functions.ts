import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export const getOverviewFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getOverview } = await import("./store.server");
    return getOverview(context.userId);
  });

export const listObjectsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ prefix: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { listObjects } = await import("./store.server");
    return listObjects(context.userId, data.prefix ?? "");
  });

export const uploadObjectFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      key: z.string().min(1),
      contentType: z.string(),
      contentBase64: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { putObject } = await import("./store.server");
    return putObject(context.userId, { ...data, source: "ui" });
  });

export const deleteObjectFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ key: z.string().min(1), versionId: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { deleteObject } = await import("./store.server");
    await deleteObject(context.userId, data.key, "ui", data.versionId);
    return { ok: true };
  });

export const downloadObjectFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ key: z.string().min(1), versionId: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const { getObjectUrl, readObject, ensureConnection } = await import(
      "./store.server"
    );
    const conn = await ensureConnection(context.userId);
    if (conn.mode === "s3") {
      const rec = await getObjectUrl(context.userId, data.key, 300, data.versionId);
      return { kind: "url" as const, url: rec.url, key: data.key, versionId: rec.versionId };
    }
    const rec = await readObject(context.userId, data.key, data.versionId);
    return {
      kind: "inline" as const,
      key: rec.key,
      contentType: rec.contentType,
      contentBase64: rec.contentBase64,
      versionId: rec.versionId,
      versionN: rec.versionN,
      isLatest: rec.isLatest,
    };
  });

export const listVersionsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ key: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const { listVersions } = await import("./store.server");
    return listVersions(context.userId, data.key);
  });

export const saveConnectionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      provider: z.string(),
      bucket: z.string(),
      region: z.string(),
      endpoint: z.string(),
      publicBaseUrl: z.string(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
      forcePathStyle: z.boolean(),
      prefix: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { saveConnection } = await import("./store.server");
    return saveConnection(context.userId, data);
  });

export const testConnectionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { testConnection } = await import("./store.server");
    return testConnection(context.userId);
  });

export const clearConnectionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { clearConnection } = await import("./store.server");
    return clearConnection(context.userId);
  });

export const listTokensFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listTokens } = await import("./store.server");
    return listTokens(context.userId);
  });

export const createTokenFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ name: z.string() }))
  .handler(async ({ context, data }) => {
    const { createToken } = await import("./store.server");
    return createToken(context.userId, data.name);
  });

export const revokeTokenFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const { revokeToken } = await import("./store.server");
    await revokeToken(context.userId, data.id);
    return { ok: true };
  });

export const playgroundToolFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { name: string; args: Record<string, unknown> }) => {
    if (!data || typeof data.name !== "string") throw new Error("Tool name required");
    return { name: data.name, args: data.args ?? {} };
  })
  .handler(async ({ context, data }) => {
    const { runPlaygroundTool } = await import("./mcp.server");
    return runPlaygroundTool(context.userId, data.name, data.args);
  });
