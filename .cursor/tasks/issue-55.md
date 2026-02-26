# Issue #55

title:	App Shell & Page Routing
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	HUS1904
projects:	
milestone:	
number:	55
--
Set up the main application structure: sidebar navigation, routing, 
and empty page shells for every section. Everything else is built on top of this.
Should be one of the first things completed.

---
# Sub-issues

## Sub-issue #56
title:	App shell layout with sidebar
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	56
--
Goal: Create the main layout wrapper all pages sit inside.
- [ ] Left sidebar + right content area layout
- [ ] Sidebar always visible on desktop
- [ ] Content area renders child routes/pages
- [ ] Consistent header bar with system name and logout button
- [ ] No console errors on any route

---
## Sub-issue #57
title:	Sidebar navigation component
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	57
--
Goal: Persistent nav linking to all main sections.
- [ ] Links to: Dashboard, Bookings, Rooms, Maintenance, Security, Settings
- [ ] Active link highlighted based on current route
- [ ] Icons + labels per item
- [ ] Hides items based on user role

---
## Sub-issue #58
title:	Dashboard page shell
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	58
--
Goal: Empty placeholder page at / or /dashboard route.
- [ ] Route exists and renders without errors
- [ ] Page title "DTU Hotel Booking System" in header
- [ ] Ready to receive the 7-day calendar grid (#7)

---
## Sub-issue #59
title:	Rooms page shell
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	59
--
Goal: Empty placeholder at /rooms route.
- [ ] Route exists and renders without errors
- [ ] Page heading "Room Management" shown
- [ ] Ready to receive rooms table and stat cards (#8)

---
## Sub-issue #60
title:	Bookings page shell
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	60
--
Goal: Empty placeholder at /bookings route.
- [ ] Route exists and renders without errors
- [ ] Page heading "Bookings Management" shown
- [ ] Ready to receive bookings table and create button (#12)

---
## Sub-issue #61
title:	Security page shell
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	61
--
Goal: Empty placeholder at /security route.
- [ ] Route exists and renders without errors
- [ ] Admin-only (redirects others to /forbidden)

---
## Sub-issue #62
title:	Maintenance page shell
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	62
--
Goal: Empty placeholder at /maintenance route.
- [ ] Route exists and renders without errors
- [ ] Page heading "Room Status Management" shown
- [ ] Ready to receive room detail and toggle (#16)

---
## Sub-issue #63
title:	Settings page shell
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	63
--
Goal: Basic settings page for user/system configuration.
- [ ] Route exists at /settings
- [ ] Shows logged-in user info (name, role, email)
- [ ] Placeholder sections for future settings
- [ ] Change password field (stretch)

---
## Sub-issue #64
title:	404 / Not Found page
state:	OPEN
author:	HUS1904
labels:	
comments:	0
assignees:	
projects:	
milestone:	
number:	64
--
Goal: Handle unknown routes gracefully.
- [ ] Shown for any unmatched route
- [ ] Has a link back to dashboard
- [ ] Consistent with app styling

---
