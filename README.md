# Skyhook

MCP server for Amazon S3 (and S3-compatible stores). Sign in with Google, connect a bucket — or start in a private sandbox — then point Claude, Cursor, or any MCP client at Skyhook.

Re-uploading the same key **versions** the document. Fetch without `version_id` **always returns latest**.

## Tools

| Tool | What it does |
|---|---|
| `s3_upload` | Upload. Same key → new version; the key points at latest. |
| `s3_list` | List objects (latest of each key), optional prefix. |
| `s3_read` | Read bytes. Omit `version_id` for latest. |
| `s3_get_url` | Presigned GET URL (latest, or a specific `version_id`). |
| `s3_stat` | Size, content type, version, etag. Defaults to latest. |
| `s3_versions` | History for a key, newest first, `is_latest` marked. |
| `s3_delete` | Delete a key (all versions) or a single `version_id`. |
| `s3_info` | Bucket, region, storage mode. Never returns secrets. |

## MCP client

After Google sign-in, mint a bearer token (`sk_hk_…`) in the console.

```json
{
  "mcpServers": {
    "skyhook": {
      "url": "https://YOUR-HOST/api/mcp",
      "headers": {
        "Authorization": "Bearer sk_hk_…"
      }
    }
  }
}
```

Transport is **Streamable HTTP** (`POST /api/mcp`). Requests without a valid token get `401`.

## Versioning

- Each upload of a key records a new revision (up to 50 kept).
- The object key is a pointer at **latest**.
- `s3_read` / `s3_stat` / `s3_get_url` with no `version_id` always fetch latest.
- Pass `version_id` to read or delete a historical revision.
- `s3_delete` without `version_id` removes the key and all versions; with `version_id` it drops that revision and retargets remaining latest.
- If the S3 bucket has versioning enabled, Skyhook stores the S3 `VersionId`. Otherwise history is kept in Skyhook (bodies retained when they fit in the sandbox size cap).

## Storage

Until AWS / R2 / MinIO credentials are saved, uploads land in a **per-user sandbox**. Paste a bucket, region, access key, and secret in the console to switch to real S3. Compatible with path-style endpoints (MinIO, R2).

## Auth

Skyhook identities are Google (and X) accounts. Every object, token, and connection is scoped to the signed-in user. AWS secrets are encrypted at rest (AES-256-GCM). MCP tokens are stored as SHA-256 hashes — the plaintext `sk_hk_…` value is shown once.

## Develop

```bash
npm install
npm run dev
```

App at `http://localhost:8080`. Local preview uses embedded Postgres (PGLite) when `DATABASE_URL` is unset.

```bash
npm run typecheck
npm run build
```

### Environment

Do not commit a `.env`. Set these in your host:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | production | Neon / Postgres. Omit locally to use PGLite. |
| `BETTER_AUTH_SECRET` | production | Session + secret-encryption key. |
| `GROK_AUTH_ISSUER` | production | Auth broker issuer (Google/X via broker). |
| `GROK_AUTH_CLIENT_ID` / `GROK_AUTH_CLIENT_SECRET` | production | Per-app OAuth client. |

## License

MIT
