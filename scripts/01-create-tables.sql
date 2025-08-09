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
