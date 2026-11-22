-- Restrict client submissions to unverified, unpaid evidence.
-- Existing completion rows and the server review path are preserved.
BEGIN;

DROP POLICY IF EXISTS completions_insert_own ON vida_assoc.mission_completions;
CREATE POLICY completions_insert_own ON vida_assoc.mission_completions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND reward_paid = false
    AND reward_paid_at IS NULL
    AND validated_at IS NULL
    AND reviewed_by IS NULL
    AND ai_validation_score IS NULL
    AND ai_validation_notes IS NULL
  );

COMMIT;
