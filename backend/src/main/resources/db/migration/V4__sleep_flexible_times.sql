-- Sleep is logged in two moments: at bedtime the wake time is unknown, and vice versa.

alter table sleep_logs alter column bed_time  drop not null;
alter table sleep_logs alter column wake_time drop not null;
