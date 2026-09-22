export const MAX_SANDBOX_BYTES = 4 * 1024 * 1024;
export const MAX_S3_BYTES = 32 * 1024 * 1024;
export const MAX_VERSIONS_PER_KEY = 50;

export type StorageMode = "sandbox" | "s3";

export type ConnectionPublic = {
  id: string;
  provider: string;
  bucket: string;
  region: string;
  endpoint: string | null;
  publicBaseUrl: string | null;
  accessKeyId: string | null;
  hasSecret: boolean;
  forcePathStyle: boolean;
  prefix: string;
  mode: StorageMode;
  lastTestedAt: string | null;
  lastError: string | null;
};

export type ObjectRecord = {
  id: string;
  key: string;
  contentType: string;
  sizeBytes: number;
  etag: string | null;
  storage: StorageMode;
  source: string;
  createdAt: string;
  versionId: string;
  versionN: number;
  versionCount: number;
  isLatest: boolean;
};

export type VersionRecord = {
  versionId: string;
  versionN: number;
  isLatest: boolean;
  contentType: string;
  sizeBytes: number;
  etag: string | null;
  storage: StorageMode;
  source: string;
  createdAt: string;
};

export type ActivityRecord = {
  id: string;
  action: string;
  detail: string | null;
  key: string | null;
  bytes: number | null;
  source: string;
  ok: boolean;
  createdAt: string;
};

export type McpTokenPublic = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export type Overview = {
  connection: ConnectionPublic;
  objectCount: number;
  totalBytes: number;
  lastUploadAt: string | null;
  tokens: McpTokenPublic[];
  recent: ActivityRecord[];
};

export const MCP_TOOLS = [
  {
    name: "s3_upload",
    description:
      "Upload an object. Re-uploading the same key creates a new version; the key always points at latest.",
  },
  {
    name: "s3_list",
    description: "List objects (latest version of each key), optionally filtered by prefix.",
  },
  {
    name: "s3_read",
    description:
      "Read an object. Omit version_id to always get the latest. Pass version_id for a historical revision.",
  },
  {
    name: "s3_get_url",
    description:
      "Presigned GET URL for the latest object (or a specific version_id). Sandbox objects should use s3_read.",
  },
  {
    name: "s3_stat",
    description: "Return size, content type, version, and etag. Defaults to latest.",
  },
  {
    name: "s3_versions",
    description: "List all versions of a key, newest first. Latest is marked is_latest.",
  },
  {
    name: "s3_info",
    description: "Return the current bucket, region, and storage mode. Never returns secrets.",
  },
] as const;
