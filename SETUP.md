# TaskFlow Setup Guide

## 🚀 Quick Start

### 1. Supabase Project Setup

Your Supabase project is already configured:
- **Project URL**: `https://xujhgoldqdlxbrdfzvfz.supabase.co`
- **Anon Key**: Already configured in the app

### 2. Database Setup

Run these SQL scripts in your Supabase SQL Editor (in order):

#### Step 1: Create Tables
\`\`\`sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create boards table
create table public.boards (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create board_members table for collaborative access
create table public.board_members (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(board_id, user_id)
);

-- Create tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('todo', 'in-progress', 'done')) default 'todo' not null,
  assignee_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete cascade not null,
  attachment_url text,
  position integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profiles table to store user display information
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index boards_owner_id_idx on public.boards(owner_id);
create index board_members_board_id_idx on public.board_members(board_id);
create index board_members_user_id_idx on public.board_members(user_id);
create index tasks_board_id_idx on public.tasks(board_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_assignee_id_idx on public.tasks(assignee_id);
\`\`\`

#### Step 2: Enable RLS
\`\`\`sql
-- Enable Row Level Security on all tables
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.tasks enable row level security;
alter table public.profiles enable row level security;
\`\`\`

#### Step 3: Create RLS Policies
\`\`\`sql
-- Profiles policies
create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Boards policies
create policy "Users can view boards they are members of" on public.boards
  for select using (
    auth.uid() = owner_id or 
    exists (
      select 1 from public.board_members 
      where board_id = id and user_id = auth.uid()
    )
  );

create policy "Users can create boards" on public.boards
  for insert with check (auth.uid() = owner_id);

create policy "Only owners can update boards" on public.boards
  for update using (auth.uid() = owner_id);

create policy "Only owners can delete boards" on public.boards
  for delete using (auth.uid() = owner_id);

-- Board members policies
create policy "Users can view board members for boards they belong to" on public.board_members
  for select using (
    exists (
      select 1 from public.boards 
      where id = board_id and (
        owner_id = auth.uid() or 
        exists (
          select 1 from public.board_members bm 
          where bm.board_id = board_id and bm.user_id = auth.uid()
        )
      )
    )
  );

create policy "Board owners can manage members" on public.board_members
  for all using (
    exists (
      select 1 from public.boards 
      where id = board_id and owner_id = auth.uid()
    )
  );

create policy "Users can join boards when invited" on public.board_members
  for insert with check (auth.uid() = user_id);

-- Tasks policies
create policy "Users can view tasks for boards they are members of" on public.tasks
  for select using (
    exists (
      select 1 from public.boards b
      left join public.board_members bm on b.id = bm.board_id
      where b.id = board_id and (
        b.owner_id = auth.uid() or 
        bm.user_id = auth.uid()
      )
    )
  );

create policy "Board members can create tasks" on public.tasks
  for insert with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.boards b
      left join public.board_members bm on b.id = bm.board_id
      where b.id = board_id and (
        b.owner_id = auth.uid() or 
        bm.user_id = auth.uid()
      )
    )
  );

create policy "Board members can update tasks" on public.tasks
  for update using (
    exists (
      select 1 from public.boards b
      left join public.board_members bm on b.id = bm.board_id
      where b.id = board_id and (
        b.owner_id = auth.uid() or 
        bm.user_id = auth.uid()
      )
    )
  );

create policy "Task creators and board owners can delete tasks" on public.tasks
  for delete using (
    auth.uid() = created_by or
    exists (
      select 1 from public.boards 
      where id = board_id and owner_id = auth.uid()
    )
  );
\`\`\`

#### Step 4: Create Functions and Triggers
\`\`\`sql
-- Function to automatically create board member entry for board owner
create or replace function public.handle_new_board()
returns trigger as $$
begin
  insert into public.board_members (board_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically add board owner as member
create trigger on_board_created
  after insert on public.boards
  for each row execute procedure public.handle_new_board();

-- Function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger handle_updated_at before update on public.boards
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
\`\`\`

### 3. Enable Realtime (Optional)

In your Supabase Dashboard:
1. Go to **Database** > **Replication**
2. Enable realtime for these tables:
   - `public.boards`
   - `public.board_members` 
   - `public.tasks`

### 4. Run the Application

\`\`\`bash
npm install
npm run dev
\`\`\`

Visit `http://localhost:3000` and you should see the connection test on the login page.

## 🔧 Troubleshooting

### Connection Issues
- Verify your Supabase project URL and anon key
- Check that all SQL scripts have been executed
- Ensure RLS is enabled on all tables

### Authentication Issues
- Make sure the `handle_new_user()` function is created
- Check that the profiles table exists
- Verify email confirmation settings in Supabase Auth

### Permission Issues
- Ensure all RLS policies are created correctly
- Check that users are properly added to board_members table
- Verify foreign key relationships

## 📚 Next Steps

1. **Create your first account** using the signup page
2. **Create a board** from the boards dashboard
3. **Add tasks** and test drag-and-drop functionality
4. **Invite team members** (feature coming soon)
5. **Upload attachments** (feature coming soon)
