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
