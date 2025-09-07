# RFC 5545: iCalendar Recurrence Rules (RRULE)

The **iCalendar specification (RFC 5545)** defines how to express repeating events such as 
"every Monday at 14:14" or "the first Friday of every month."  
It is widely used in calendar systems (Google Calendar, Outlook, Apple Calendar).

---

## RRULE Basics

An `RRULE` describes how an event recurs.  
The main components are:

- **FREQ** → Frequency (DAILY, WEEKLY, MONTHLY, YEARLY)  
- **BYDAY** → Day(s) of the week (`MO, TU, WE, TH, FR, SA, SU`)  
- **BYHOUR, BYMINUTE, BYSECOND** → Time of day  
- **UNTIL** → End date/time (ISO 8601 format)  
- **COUNT** → Number of times to repeat  

---

## Snippets / Examples

Every Monday at 14:14  

Every Tuesday at 16:00  
RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=14;BYMINUTE=14

Every Wednesday at 20:30  
RRULE:FREQ=WEEKLY;BYDAY=TU;BYHOUR=16;BYMINUTE=0

Every weekday (Mon–Fri) at 09:00  
RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0

First Friday of every month at 18:00  
RRULE:FREQ=MONTHLY;BYDAY=1FR;BYHOUR=18;BYMINUTE=0

Daily for 10 occurrences  
RRULE:FREQ=DAILY;COUNT=10

Weekly until December 31, 2025  
RRULE:FREQ=WEEKLY;UNTIL=20251231T235959Z
