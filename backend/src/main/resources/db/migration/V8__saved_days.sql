-- Remove habits + thoughts entirely (superseded by the daily check-in and saved days).

drop table if exists habit_logs;
drop table if exists habits;
drop table if exists thoughts;

-- A day can be sealed: a kept, read-only record of everything that happened.
alter table diary_entries add column sealed_at timestamptz;
