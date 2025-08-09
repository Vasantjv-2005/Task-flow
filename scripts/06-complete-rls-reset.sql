-- First, completely drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are a member of" ON boards;
DROP POLICY IF EXISTS "Users can view their own memberships" ON board_members;
DROP POLICY IF EXISTS "Users can insert themselves into boards" ON board_members;
DROP POLICY IF EXISTS "Select boards by membership" ON boards;
DROP POLICY IF EXISTS "Insert boards by owner" ON boards;
DROP POLICY IF EXISTS "Update boards by owner" ON boards;
DROP POLICY IF EXISTS "Insert board members" ON board_members;
DROP POLICY IF EXISTS "Select board members" ON board_members;
DROP POLICY IF EXISTS "Users can insert boards they own" ON boards;
DROP POLICY IF EXISTS "Users can view boards they own" ON boards;
DROP POLICY IF EXISTS "Users can update boards they own" ON boards;
DROP POLICY IF EXISTS "Users can delete boards they own" ON boards;
DROP POLICY IF EXISTS "Users can view their own memberships" ON board_members;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON board_members;
DROP POLICY IF EXISTS "Board owners can manage all memberships" ON board_members;

-- Drop any other existing policies
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
DROP POLICY IF EXISTS "Users can create boards" ON boards;
DROP POLICY IF EXISTS "Only owners can update boards" ON boards;
DROP POLICY IF EXISTS "Only owners can delete boards" ON boards;
DROP POLICY IF EXISTS "Users can view board members for boards they belong to" ON board_members;
DROP POLICY IF EXISTS "Board owners can manage members" ON board_members;
DROP POLICY IF EXISTS "Users can join boards when invited" ON board_members;

-- Create the simplest possible policies for boards
-- Policy 1: Users can see boards they own
CREATE POLICY "boards_select_own" ON boards
  FOR SELECT USING (auth.uid() = owner_id);

-- Policy 2: Users can create boards they own
CREATE POLICY "boards_insert_own" ON boards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policy 3: Users can update boards they own
CREATE POLICY "boards_update_own" ON boards
  FOR UPDATE USING (auth.uid() = owner_id);

-- Policy 4: Users can delete boards they own
CREATE POLICY "boards_delete_own" ON boards
  FOR DELETE USING (auth.uid() = owner_id);

-- Create simple policies for board_members
-- Policy 1: Users can see memberships where they are the user
CREATE POLICY "board_members_select_own" ON board_members
  FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Users can insert memberships for themselves
CREATE POLICY "board_members_insert_own" ON board_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Board owners can see all memberships for their boards
CREATE POLICY "board_members_select_as_owner" ON board_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_members.board_id 
      AND boards.owner_id = auth.uid()
    )
  );

-- Policy 4: Board owners can insert memberships for their boards
CREATE POLICY "board_members_insert_as_owner" ON board_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_members.board_id 
      AND boards.owner_id = auth.uid()
    )
  );

-- Policy 5: Board owners can delete memberships for their boards
CREATE POLICY "board_members_delete_as_owner" ON board_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_members.board_id 
      AND boards.owner_id = auth.uid()
    )
  );
