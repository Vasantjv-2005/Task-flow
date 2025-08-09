-- COMPLETELY DROP ALL EXISTING POLICIES AND START FRESH
-- This will permanently fix the infinite recursion error

-- Drop ALL existing policies on ALL tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on boards table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'boards') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON boards';
    END LOOP;
    
    -- Drop all policies on board_members table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'board_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON board_members';
    END LOOP;
    
    -- Drop all policies on tasks table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tasks';
    END LOOP;
    
    -- Drop all policies on profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

-- Create the SIMPLEST possible policies that will NEVER cause recursion

-- PROFILES: Allow all operations (no restrictions)
CREATE POLICY "profiles_all_access" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- BOARDS: Super simple - users can do everything with their own boards
CREATE POLICY "boards_owner_all" ON boards 
FOR ALL 
USING (auth.uid() = owner_id) 
WITH CHECK (auth.uid() = owner_id);

-- BOARD_MEMBERS: Simple policies without any joins
CREATE POLICY "board_members_own" ON board_members 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- TASKS: Simple policy - users can access tasks for boards they own
CREATE POLICY "tasks_board_owner" ON tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = tasks.board_id 
    AND boards.owner_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boards 
    WHERE boards.id = tasks.board_id 
    AND boards.owner_id = auth.uid()
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('boards', 'board_members', 'tasks', 'profiles')
ORDER BY tablename, policyname;
