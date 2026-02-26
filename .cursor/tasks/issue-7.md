# Issue #7

title:	Calendar Functionality
state:	OPEN
author:	Wahlb3rg
labels:	
comments:	0
assignees:	HUS1904
projects:	
milestone:	
number:	7
--
Room calendar/grid view (days horizontally, rooms vertically)

Auto-refresh af room-grid (polling hvert X sek. eller “refresh” knap) for realtime-ish overblik

Calendar/grid overview of rooms with color-coded status

Opsæt Status Color Coding (UI) Implementer logik til farvekoder: Grøn (Ledig), Rød (Booket), Gul (Rengøring), Grå (Vedligeholdelse) på værelser i kalender visning og andet

---
# Sub-issues

## Sub-issue #27
title:	Render week header with date range + navigation
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	HUS1904
projects:	
milestone:	
number:	27
--
Goal: Show a "10–16 March 2026" style header that users can navigate week by week.

- [ ] Displays formatted date range (e.g. "10–16 March 2026")
- [ ] Prev/Next arrows shift the week correctly



---
## Sub-issue #28
title:	Render room rows and booking blocks on calendar grid
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	HUS1904
projects:	
milestone:	
number:	28
--
Goal: Display each room as a row with booking blocks spanning the correct days.

- [ ] Each room has its own row
- [ ] Booking blocks span the correct day columns
- [ ] Shows guest name + status inside the block
- [ ] Empty cells shown for available days

---
## Sub-issue #29
title:	Color-code calendar blocks by status and add legend
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	29
--
Goal: Make booking states visually distinct with a color legend.

- [ ] Confirmed = grey/teal
- [ ] Checked-in = dark red
- [ ] Maintenance = orange
- [ ] Legend at bottom matches block colors

---
## Sub-issue #30
title:	Click booking block to open details popover
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	30
--
Goal: Show key booking info when clicking a block on the calendar.

- [ ] Popover/modal shows: guest name, dates, status, price
- [ ] Clicking outside or pressing Escape closes it
- [ ] Does not break grid layout when open

---
## Sub-issue #31
title:	Refresh calendar grid
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	31
--
Goal: Keep the grid up to date with/without manual page reload.

- [ ]  Refresh button triggers re-fetch


---
