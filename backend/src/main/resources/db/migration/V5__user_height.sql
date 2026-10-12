-- Height lives on the profile (used for BMI and weight context).

alter table users add column height_cm numeric(5, 1) check (height_cm between 50 and 300);
