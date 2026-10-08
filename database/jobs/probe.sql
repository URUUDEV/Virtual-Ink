-- Atomically finish one no-op probe. SKIP LOCKED permits separate workers.
-- No external side effects or customer-data job support in this foundation.
BEGIN;
WITH candidate AS (
  SELECT id FROM virtual_ink.background_jobs
  WHERE kind = 'system.probe' AND payload = '{"demo":true}'::jsonb
    AND state = 'queued' AND run_after <= now() AND attempts < 3
  ORDER BY run_after, id
  FOR UPDATE SKIP LOCKED LIMIT 1
)
UPDATE virtual_ink.background_jobs AS job
SET state = 'completed', attempts = job.attempts + 1, completed_at = now()
FROM candidate WHERE job.id = candidate.id
RETURNING job.id, job.kind, job.state;
COMMIT;
