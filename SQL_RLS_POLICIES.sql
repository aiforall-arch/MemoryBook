-- ==============================================================================
-- RLS POLICIES FOR POST DELETION
-- Run this in your Supabase SQL Editor to fix the "resurfacing deleted posts" bug
-- ==============================================================================

-- 1. POSTS: Allow users to delete their own posts
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- 2. COMMENTS: Allow post owners to delete comments on their posts
-- (Required because the app cleans up comments before deleting the post)
DROP POLICY IF EXISTS "Post owners can delete comments" ON comments;
CREATE POLICY "Post owners can delete comments"
ON comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = comments.post_id 
    AND posts.user_id = auth.uid()
  )
);

-- 3. LIKES: Allow post owners to delete likes on their posts
DROP POLICY IF EXISTS "Post owners can delete likes" ON likes;
CREATE POLICY "Post owners can delete likes"
ON likes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = likes.post_id 
    AND posts.user_id = auth.uid()
  )
);
