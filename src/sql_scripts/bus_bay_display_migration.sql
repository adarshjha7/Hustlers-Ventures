-- ============================================================
-- Bus Bay Display (Terminal 44 — /xyz demo board)
-- ============================================================
-- Backs the public, unauthenticated live TV board at /xyz. Mirrors the
-- "Bay Check-in" concept from terminal44prd.md (bay, bus number, operator,
-- route, arrival/departure, status) closely enough that this table can
-- keep being used (or lightly extended) if that fuller system gets built
-- later — this migration only covers what the /xyz demo needs today.
--
-- Realtime: the /xyz page subscribes to postgres_changes on this table via
-- the Supabase browser client, so any INSERT/UPDATE/DELETE here appears on
-- the live page within moments — no refresh needed on the TV.
-- ============================================================

CREATE TABLE IF NOT EXISTS bus_bay_display (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bay                 TEXT NOT NULL,               -- e.g. "A1"
  bus_number          TEXT NOT NULL,                -- e.g. "TG13Z 1984"
  operator_name       TEXT NOT NULL,                -- e.g. "Zing Bus"
  route_from          TEXT NOT NULL,                -- e.g. "Hyderabad"
  route_to            TEXT NOT NULL,                -- e.g. "Bangalore"
  route_via           TEXT,                         -- e.g. "Kurnool, Anantapur" (optional)
  scheduled_arrival   TIMESTAMPTZ NOT NULL,
  scheduled_departure TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'approaching', 'boarding', 'at_terminal', 'departed')),
  sort_order          INT NOT NULL DEFAULT 0,       -- controls display order on the board
  is_active           BOOLEAN NOT NULL DEFAULT true, -- set false instead of deleting to hide a row
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public, read-only — this is a TV board, nobody is logged in on it.
ALTER TABLE bus_bay_display ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read the bus bay display"
  ON bus_bay_display FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policy is added — writes go through
-- supabaseAdmin (service role) only, e.g. from a future admin screen or
-- directly via the Supabase SQL editor for now.

-- Required for the browser client's realtime subscription to actually
-- receive postgres_changes events for this table.
ALTER PUBLICATION supabase_realtime ADD TABLE bus_bay_display;

-- ============================================================
-- Dummy data — matches the reference board image (times adjusted to
-- "today" via now()-relative offsets so the demo always looks live
-- instead of showing a fixed past date). Re-run this block any time you
-- want to reset the demo data back to a fresh-looking set.
-- ============================================================
INSERT INTO bus_bay_display
  (bay, bus_number, operator_name, route_from, route_to, route_via, scheduled_arrival, scheduled_departure, status, sort_order)
VALUES
  ('A1', 'TG13Z 1984', 'Zing Bus',      'Hyderabad', 'Bangalore',     'Kurnool, Anantapur', now() - interval '56 minutes', now() - interval '13 minutes', 'at_terminal', 1),
  ('A2', 'TS09OR 4521', 'Orange Travels','Hyderabad', 'Vijayawada',    'Guntur',              now() - interval '43 minutes', now() + interval '2 minutes',  'at_terminal', 2),
  ('A3', 'KA05VR 1122', 'VRL Travels',   'Bangalore', 'Hyderabad',     'Kurnool',             now() - interval '28 minutes', now() + interval '17 minutes', 'at_terminal', 3),
  ('A4', 'KA01SS 7788', 'SRS Travels',   'Hyderabad', 'Chennai',       'Nellore',             now() - interval '8 minutes',  now() + interval '37 minutes', 'at_terminal', 4),
  ('A5', 'TS07GJ 3344', 'Garuda Travels','Hyderabad', 'Goa',           'Hubli, Belgaum',      now() + interval '7 minutes',  now() + interval '52 minutes', 'boarding',    5),
  ('A6', 'NL01BX 9090', 'IntrCity SmartBus', 'Hyderabad', 'Pune',      'Solapur',             now() + interval '22 minutes', now() + interval '67 minutes', 'boarding',    6),
  ('A7', 'KA02HM 1234', 'Hanif Travels', 'Hyderabad', 'Mangalore',     'Dharwad',             now() + interval '42 minutes', now() + interval '87 minutes', 'approaching', 7),
  ('A8', 'AP39AB 5678', 'Pavan Travels', 'Hyderabad', 'Visakhapatnam', 'Warangal',             now() + interval '62 minutes', now() + interval '107 minutes','scheduled',   8);
