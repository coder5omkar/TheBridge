-- Align smallint columns with their Java Integer mappings.
-- Hibernate 7 schema validation is strict about smallint vs integer.

alter table users             alter column day_start_hour type integer;
alter table diary_entries     alter column mood           type integer;
alter table diary_entries     alter column energy         type integer;
alter table exercise_sessions alter column gems_awarded   type integer;
alter table sleep_logs        alter column quality        type integer;
alter table meals             alter column hunger_before  type integer;
alter table meals             alter column hunger_after   type integer;
