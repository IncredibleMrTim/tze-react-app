-- Job creation now happens via the Python API, which writes directly to
-- this table and bypasses app/lib/db.ts's createJob (and its pg_notify call).
-- This trigger fires on INSERT regardless of which writer performed it, so
-- the job_updates websocket channel (see app/api/ws/route.ts) keeps working.
--
-- UPDATE/DELETE are intentionally NOT covered here: app/lib/db.ts's
-- updateJob/deleteJob still run on the Node/Prisma path and already call
-- pg_notify themselves. Adding triggers for those too would double-fire
-- the websocket for that path.
CREATE OR REPLACE FUNCTION notify_job_insert() RETURNS TRIGGER AS $$
BEGIN
  -- pg_notify has an 8000-byte payload limit; a broadcast failure (e.g. a
  -- job with a large parts/poPages/partsOnArrivalPhotos array) must never
  -- roll back the insert, matching the old fire-and-forget notify() call.
  BEGIN
    PERFORM pg_notify(
      'job_updates',
      json_build_object('type', 'created', 'job', row_to_json(NEW))::text
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'job_insert_notify: pg_notify failed: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_insert_notify
AFTER INSERT ON "Job"
FOR EACH ROW
EXECUTE FUNCTION notify_job_insert();
