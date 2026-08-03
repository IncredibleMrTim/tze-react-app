-- job_insert_notify (see 20260731120000_notify_job_insert) exists to keep
-- the job_updates websocket working once job creation moves to the Python
-- API and bypasses app/lib/db.ts's createJob (and its own pg_notify call).
-- That cutover hasn't happened yet on this environment — createJob is
-- still the only writer, and it already calls pg_notify itself — so
-- leaving the trigger enabled would double-fire job_updates for every
-- job insert. Disable it for now; re-enable it in the same migration (or a
-- follow-up) that lands the Python API cutover.
ALTER TABLE "Job" DISABLE TRIGGER job_insert_notify;
