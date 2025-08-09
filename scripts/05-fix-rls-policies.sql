-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are a member of" ON boards;
DROP POLICY IF EXISTS "Users can view their own memberships" ON board_members;
DROP POLICY IF EXISTS "Users can insert themselves into boards" ON board_members;

-- Drop any other existing policies that might cause conflicts
DROP POLICY IF EXISTS "Select boards by membership" ON boards;
DROP POLICY IF EXISTS "Insert boards by owner" ON boards;
DROP POLICY IF EXISTS "Update boards by owner" ON boards;
DROP POLICY IF EXISTS "Insert board members" ON board_members;
DROP POLICY IF EXISTS "Select board members" ON board_members;

-- Create simple, non-recursive policies for boards
CREATE POLICY "Users can insert boards they own"
ON boards
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view boards they own"
ON boards
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can update boards they own"
ON boards
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete boards they own"
ON boards
FOR DELETE
USING (auth.uid() = owner_id);

-- Create simple policies for board_members
CREATE POLICY "Users can view their own memberships"
ON board_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships"
ON board_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Board owners can manage all memberships"
ON board_members
FOR ALL
USING (
  auth.uid() IN (
    SELECT owner_id FROM boards WHERE id = board_id
  )
);
