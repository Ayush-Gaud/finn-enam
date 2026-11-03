-- FINN schema: cached-first portfolio intelligence + pgvector retrieval
-- Apply in Supabase SQL Editor (or: supabase db push / psql).

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Core entities
-- ---------------------------------------------------------------------------

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  ticker text not null unique,
  yahoo_symbol text not null unique,
  name text not null,
  sector text not null,
  in_portfolio boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists prices_eod (
  company_id uuid not null references companies(id) on delete cascade,
  date date not null,
  close numeric not null,
  volume bigint not null,
  avg_vol_20d numeric,
  pct_change_1d numeric,
  primary key (company_id, date)
);

create index if not exists prices_eod_date_idx on prices_eod (date desc);

create table if not exists filings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  filed_at timestamptz not null,
  title text not null,
  category text not null,
  materiality text not null check (materiality in ('high', 'medium', 'low')),
  summary text not null default '',
  source_url text,
  raw_text text,
  created_at timestamptz not null default now()
);

create index if not exists filings_filed_at_idx on filings (filed_at desc);
create index if not exists filings_company_id_idx on filings (company_id);
create index if not exists filings_category_idx on filings (category);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  doc_type text not null check (doc_type in ('annual_report', 'concall_transcript', 'quarterly_results', 'investor_presentation')),
  period text not null,
  title text not null,
  source_url text,
  fetched_at timestamptz not null default now()
);

create index if not exists documents_company_id_idx on documents (company_id);

create table if not exists doc_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  page int,
  embedding vector(768),
  unique (document_id, chunk_index)
);

create index if not exists doc_chunks_document_id_idx on doc_chunks (document_id);

-- IVFFlat for cosine similarity. Empty tables can fail index build on some
-- pgvector versions — wrap and re-run after embeddings are loaded if needed.
do $$
begin
  if not exists (
    select 1 from pg_indexes where indexname = 'doc_chunks_embedding_ivfflat_idx'
  ) then
    begin
      execute $idx$
        create index doc_chunks_embedding_ivfflat_idx
          on doc_chunks
          using ivfflat (embedding vector_cosine_ops)
          with (lists = 100)
      $idx$;
    exception
      when others then
        raise notice 'ivfflat index not created yet (%). Re-run after seeding embeddings.', SQLERRM;
    end;
  end if;
end $$;

create table if not exists llm_cache (
  cache_key text primary key,
  model text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists user_settings (
  id int primary key default 1 check (id = 1),
  vol_multiple numeric not null default 2.0,
  price_pct numeric not null default 5.0,
  window_hours int not null default 24,
  muted_categories text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into user_settings (id) values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Similarity search
-- ---------------------------------------------------------------------------

create or replace function match_chunks(
  query_embedding vector(768),
  match_count int default 8,
  filter_company_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  page int,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.document_id,
    c.chunk_index,
    c.content,
    c.page,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from doc_chunks c
  join documents d on d.id = c.document_id
  where c.embedding is not null
    and (filter_company_id is null or d.company_id = filter_company_id)
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- ---------------------------------------------------------------------------
-- RLS — public read for demo; writes via service role
-- ---------------------------------------------------------------------------

alter table companies enable row level security;
alter table prices_eod enable row level security;
alter table filings enable row level security;
alter table documents enable row level security;
alter table doc_chunks enable row level security;
alter table llm_cache enable row level security;
alter table user_settings enable row level security;

drop policy if exists "public read companies" on companies;
create policy "public read companies" on companies for select using (true);

drop policy if exists "public read prices_eod" on prices_eod;
create policy "public read prices_eod" on prices_eod for select using (true);

drop policy if exists "public read filings" on filings;
create policy "public read filings" on filings for select using (true);

drop policy if exists "public read documents" on documents;
create policy "public read documents" on documents for select using (true);

drop policy if exists "public read doc_chunks" on doc_chunks;
create policy "public read doc_chunks" on doc_chunks for select using (true);

drop policy if exists "public read user_settings" on user_settings;
create policy "public read user_settings" on user_settings for select using (true);

-- llm_cache: no anon access (server/service role only)
