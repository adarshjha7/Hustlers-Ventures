# Terminal 44 — Bus Bay & Order Tracking System
### Requirements & Architecture Plan (Draft v1)

## 1. Background & Objective

Terminal 44 is a restaurant located where 16+ bus bays operate. The goal is to build an in-house system (separate from the existing Petpooja/"Paid Puja" restaurant POS) that:

1. Tracks which bus is standing in which bay, with its operator, route, and timing details.
2. Displays this live on a public TV board (airport-style).
3. Links restaurant orders back to the bus/route that generated them, so we can report which buses/operators/routes drive the most revenue.
4. Gives the kitchen visibility into which bay an order belongs to, so food reaches the right bus before it departs.

**Confirmed constraints:**
- Bus check-in is **manual entry** (staff types the bus number) — no RFID/GPS hardware in scope for v1.
- Petpooja has **no usable API** — the new system must be a **separate layer**, not a plug-in to Petpooja.
- The terminal has **16+ bays**, so the UI/TV board needs to scale to a grid, not a short list.

---

## 2. System Components

### A. Bus Registry (Master Data)
A maintained database of buses, operators, and routes — this is what makes "auto-fetch" possible.

| Field | Notes |
|---|---|
| Bus number | Primary lookup key (e.g. 1984) |
| Operator name | e.g. Zing |
| Route (origin → destination) | |
| Bus type | Sleeper / Seater / AC / Non-AC |
| Scheduled arrival time at Terminal 44 | Per route/schedule |
| Scheduled departure time | Per route/schedule |
| Driver/conductor contact (optional) | |
| Average historical halt duration | Calculated over time, not entered manually |

Someone (ops/admin) needs to own keeping this table updated as operators add/change buses and routes — this is the single most important dependency for "auto-fetch" to actually work.

### B. Bay Check-in Screen (staff-facing)
- Staff selects a bay (1 through 16+, shown as a grid/list) and types the bus number.
- System looks up the Bus Registry and auto-fills operator, route, scheduled times.
- Staff confirms actual arrival time (auto-timestamped) and can later mark departure.
- Status per bay: **Empty → Arrived → Boarding → Departed / Delayed**.

### C. Live TV Display Board
- Airport-style board: **Bay | Bus No. | Operator | Route | Arrival | Departure | Status**.
- Pulls directly from the Bay Check-in data — no separate data entry.
- With 16+ bays, use a scrolling/paginated grid (e.g. 8 rows per screen, auto-rotating) rather than a single flat list.

### D. Order-to-Bus Tagging (the workaround, given no Petpooja API)
Since Petpooja can't be customized, the cleanest no-integration approach is:

- **Reserve one "table" per bay inside Petpooja** (e.g. Table "B1" = Bay 1, "B2" = Bay 2, ... up to B16+).
- Waiter flow: ask "Bus or car?" →
  - **Car** → seat/order normally on regular tables.
  - **Bus** → order goes under the reserved table number matching that bay (staff already knows the bay from the check-in screen or the TV board).
- Petpooja's own table-wise sales report now inherently contains bus-vs-non-bus and bay-wise data — **no code integration needed**, just a reporting convention.
- Your in-house system periodically pulls/imports Petpooja's exported sales report (CSV export, typically supported by most POS including Petpooja) and joins it against the Bay Check-in log (which bus was in Bay 6 at 3:15 PM) to attribute revenue to bus number/operator/route.

This avoids needing Petpooja to change anything, at the cost of a light manual/scheduled data import step.

*(Caveat worth flagging to your lead: if two different buses use the same bay on the same day, attribution is done by matching order timestamp to the bay's occupancy window — this only works cleanly if departure times are marked promptly on the check-in screen.)*

### E. Kitchen Display
- Existing KDS (if Petpooja has one) already shows table number — since bus orders route through bay-mapped tables, the kitchen automatically sees "Table B6" and knows it's time-sensitive (bus could leave soon).
- Optional enhancement: color/flag bay-tagged orders differently so kitchen staff prioritize them (buses don't wait, walk-in customers do).

### F. Analytics Dashboard
Built from the joined Bay Check-in + Petpooja sales export data:
- Revenue/orders by **operator** (which bus company's passengers spend the most).
- Revenue/orders by **route** (which routes justify negotiating longer halts, priority bays, etc.).
- Revenue/orders by **bay** (are some bays under-served by staff/menu visibility?).
- Order volume vs. scheduled arrival times (helps kitchen prep staffing around peak bus hours).

---

## 3. Suggested Build Phases

**Phase 1 (MVP):**
- Bus Registry (manual admin entry, no auto-import from operators yet).
- Bay Check-in screen with manual bus-number entry and auto-fetch.
- Reserved table-per-bay convention in Petpooja.

**Phase 2:**
- Live TV Display board.
- Scheduled import + join of Petpooja sales export with bay occupancy logs.
- Basic analytics dashboard (by operator/route/bay).

**Phase 3 (optional, later):**
- Automated bus detection (RFID/QR/GPS) to remove manual entry.
- Direct Petpooja integration if/when an API becomes available.
- Predictive staffing (based on scheduled bus arrivals).

---

## 4. Open Questions to Resolve With the Team

- Who owns and updates the Bus Registry (new buses/operators/route changes)?
- Does Petpooja support CSV/report export in a way that includes table number and timestamp per order? (Needs confirming with Petpooja support/docs.)
- What happens if a bus is delayed and a second bus is assigned the same bay same day — how strict does the reconciliation need to be?
- Is there a plan to eventually add automated check-in (RFID/GPS) once budget allows?



Now I have two questions regarding it, which my lead asked me:



1. Confirm that it will always be a manual entry done by a person when a bus arrives. There we don't need any GPS tracking for which bus is going to arrive so it will always be manual.

2. Unrelated to it, there is one more important question: websites don't work efficiently on TV. It's an Android TV so websites do not work efficiently. How do we manage that thing? For example let's say on TV I'll also show this bus departure thing and I also want to show our own restaurant pictures in between as an advertisement for 5 seconds. Also how can I manage this efficiently on three different devices? How does this particular tech work? What is the technology required for me in building this kind of a website or whatever is needed? There will always be one instance of the app, which will be used by different persons. 3-4 persons will use that app: someone will use it for data entry, and someone would use it for checking what bay is located to what and everything. There will be one instance of the app, which I'll show on three different TVs at a time, like the same thing on three different TVs. How is this done? How do airport systems manage it? How is this CMS being managed there?



 That's the prior question right now.