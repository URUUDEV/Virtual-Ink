-- Explicitly synthetic infrastructure fixture, not a real order/vendor.
BEGIN;
DO $$ BEGIN
  IF current_database() NOT IN ('virtual_ink_development', 'virtual_ink_test') THEN
    RAISE EXCEPTION 'Demo seed requires a dedicated development/test database';
  END IF;
END $$;
INSERT INTO virtual_ink.background_jobs(id, kind, payload)
VALUES ('00000000-0000-4000-8000-000000000001', 'system.probe', '{"demo":true}')
ON CONFLICT (id) DO NOTHING;
COMMIT;
