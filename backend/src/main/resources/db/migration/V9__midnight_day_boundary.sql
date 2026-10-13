-- The day now ends at midnight (12 AM): no more 4 AM rollover.
-- A day is editable until its own midnight, then frozen.

alter table users alter column day_start_hour set default 0;
update users set day_start_hour = 0;
