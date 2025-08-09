-- Enable Row Level Security on all tables
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.tasks enable row level security;
alter table public.profiles enable row level security;
