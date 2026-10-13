-- Meal photos: optional image per meal, stored locally or on S3.

alter table meals add column photo_key varchar(255);
