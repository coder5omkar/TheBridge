-- The daily check-in questionnaire: water, highlights, drains, gratitude, movement.

alter table diary_entries add column water_cups integer check (water_cups between 0 and 30);
alter table diary_entries add column highlights text;
alter table diary_entries add column drained text;
alter table diary_entries add column gratitude text;
alter table diary_entries add column moved boolean;
