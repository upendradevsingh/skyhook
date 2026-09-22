-- Skyhook: per-user S3 connections, MCP tokens, object catalog, activity
create table if not exists s3_connections (
  id text primary key,
  user_id text not null unique,
  provider text not null default 'aws',
  bucket text not null default '',
  region text not null default 'us-east-1',
  endpoint text,
  public_base_url text,
  access_key_id text,
  secret_access_key_enc text,
  force_path_style boolean not null default false,
  prefix text not null default '',
  last_tested_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mcp_tokens (
  id text primary key,
  user_id text not null,
  name text not null default 'default',
  token_hash text not null unique,
  token_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists mcp_tokens_user_id_idx on mcp_tokens (user_id);

create table if not exists objects (
  id text primary key,
  user_id text not null,
  object_key text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes integer not null default 0,
  etag text,
  storage text not null default 'sandbox',
  body_b64 text,
  source text not null default 'ui',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, object_key)
);
create index if not exists objects_user_id_idx on objects (user_id);

create table if not exists activity (
  id text primary key,
  user_id text not null,
  action text not null,
  detail text,
  object_key text,
  bytes integer,
  source text not null default 'ui',
  ok boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists activity_user_id_idx on activity (user_id, created_at desc);
