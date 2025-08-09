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
