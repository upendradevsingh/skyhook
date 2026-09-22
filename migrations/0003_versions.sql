-- Per-key version history. `objects` remains the latest pointer.
alter table objects add column if not exists version_id text;
alter table objects add column if not exists version_n integer not null default 1;
alter table objects add column if not exists version_count integer not null default 1;

create table if not exists object_versions (
  id text primary key,
  user_id text not null,
  object_key text not null,
  version_id text not null,
  version_n integer not null,
  is_latest boolean not null default true,
  content_type text not null default 'application/octet-stream',
  size_bytes integer not null default 0,
  etag text,
  storage text not null default 'sandbox',
  body_b64 text,
  source text not null default 'ui',
  created_at timestamptz not null default now(),
  unique (user_id, object_key, version_id)
);
create index if not exists object_versions_key_idx
  on object_versions (user_id, object_key, version_n desc);

insert into object_versions (
  id, user_id, object_key, version_id, version_n, is_latest,
  content_type, size_bytes, etag, storage, body_b64, source, created_at
)
select
  id, user_id, object_key, coalesce(version_id, 'v1'), 1, true,
  content_type, size_bytes, etag, storage, body_b64, source, created_at
from objects o
where not exists (
  select 1 from object_versions v
  where v.user_id = o.user_id and v.object_key = o.object_key
);

update objects
set version_id = coalesce(version_id, 'v1'),
    version_n = coalesce(version_n, 1),
    version_count = coalesce(version_count, 1)
where version_id is null;
