-- Photo access tokens: images render in plain <img> tags (no auth headers)
-- via unguessable links like /api/v1/media/{token}.

alter table meals add column photo_token varchar(64);
update meals set photo_token = replace(gen_random_uuid()::text, '-', '') where photo_key is not null;
create unique index idx_meals_photo_token on meals (photo_token);
