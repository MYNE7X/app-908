-- ============================================================
-- Expert Solutions — Support Chat System
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Support chat sessions
create table if not exists public.support_chats (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users on delete cascade not null,
  subject     text        not null,
  status      text        not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,
  closed_at   timestamptz
);

-- 2. Messages within a chat session
create table if not exists public.support_messages (
  id          uuid        default gen_random_uuid() primary key,
  chat_id     uuid        references public.support_chats on delete cascade not null,
  sender_id   uuid        references auth.users on delete cascade not null,
  is_admin    boolean     not null default false,
  body        text        not null,
  read_at     timestamptz,
  created_at  timestamptz default now() not null
);

-- 3. Indexes for performance
create index if not exists idx_support_chats_user_id  on public.support_chats(user_id);
create index if not exists idx_support_chats_status   on public.support_chats(status);
create index if not exists idx_support_chats_updated  on public.support_chats(updated_at desc);
create index if not exists idx_support_msgs_chat_id   on public.support_messages(chat_id);
create index if not exists idx_support_msgs_created   on public.support_messages(created_at);

-- 4. Auto-update updated_at on support_chats when a new message arrives
create or replace function public.fn_chat_updated_at()
returns trigger language plpgsql security definer as $$
begin
  update public.support_chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists trg_chat_updated_at on public.support_messages;
create trigger trg_chat_updated_at
  after insert on public.support_messages
  for each row execute procedure public.fn_chat_updated_at();

-- 5. Enable Row Level Security
alter table public.support_chats   enable row level security;
alter table public.support_messages enable row level security;

-- 6. RLS Policies — support_chats

-- Users can read their own chats
drop policy if exists "users_select_own_chats"  on public.support_chats;
create policy "users_select_own_chats"
  on public.support_chats for select
  using (user_id = auth.uid());

-- Users can create a chat for themselves
drop policy if exists "users_insert_own_chats" on public.support_chats;
create policy "users_insert_own_chats"
  on public.support_chats for insert
  with check (user_id = auth.uid());

-- Users can update their own chats (e.g. close)
drop policy if exists "users_update_own_chats" on public.support_chats;
create policy "users_update_own_chats"
  on public.support_chats for update
  using (user_id = auth.uid());

-- Admins/super-admins can do everything on all chats
drop policy if exists "admins_all_chats" on public.support_chats;
create policy "admins_all_chats"
  on public.support_chats for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- 7. RLS Policies — support_messages

-- Users can read messages in their own chats
drop policy if exists "users_select_own_msgs" on public.support_messages;
create policy "users_select_own_msgs"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.support_chats
      where id = chat_id and user_id = auth.uid()
    )
  );

-- Users can send messages only in their own open chats
drop policy if exists "users_insert_own_msgs" on public.support_messages;
create policy "users_insert_own_msgs"
  on public.support_messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.support_chats
      where id = chat_id
        and user_id = auth.uid()
        and status = 'open'
    )
  );

-- Users can mark messages read (update read_at)
drop policy if exists "users_update_own_msgs" on public.support_messages;
create policy "users_update_own_msgs"
  on public.support_messages for update
  using (
    exists (
      select 1 from public.support_chats
      where id = chat_id and user_id = auth.uid()
    )
  );

-- Admins/super-admins can do everything on all messages
drop policy if exists "admins_all_msgs" on public.support_messages;
create policy "admins_all_msgs"
  on public.support_messages for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- 8. Enable Realtime for live chat
alter publication supabase_realtime add table public.support_messages;
alter publication supabase_realtime add table public.support_chats;
