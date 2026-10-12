-- TheBridge V2 — seed the calm exercise catalog

insert into exercises (slug, name, type, pattern, duration_options, description, sos, sort_order) values
('box-breathing', 'Box Breathing', 'breathing', '[4,4,4,4]'::jsonb, '{2,5,10}',
 'Inhale 4 · hold 4 · exhale 4 · hold 4. The steady, reliable reset.', false, 1),

('four-seven-eight', '4-7-8 Relaxing Breath', 'breathing', '[4,7,8,0]'::jsonb, '{2,5}',
 'Long exhale tells the nervous system it is safe. A bedtime classic.', false, 2),

('coherent-breathing', 'Coherent Breathing', 'breathing', '[5,0,5,0]'::jsonb, '{5,10}',
 'Slow, even five-second pace. Smooths heart rate variability.', false, 3),

('physiological-sigh', 'Physiological Sigh', 'breathing', '[2,1,6,0]'::jsonb, '{1,2}',
 'Double inhale, long exhale. The fastest known way to downshift stress.', true, 4),

('grounding-54321', '5-4-3-2-1 Grounding', 'grounding',
 '{"steps":["5 things you can see","4 you can touch","3 you can hear","2 you can smell","1 you can taste"]}'::jsonb,
 '{3,5}', 'Walk your senses back into the present room.', false, 5),

('body-scan', 'Body Scan', 'bodyscan',
 '{"phases":["feet","legs","hips","belly","chest","arms","shoulders","face"]}'::jsonb,
 '{5,10}', 'Slow attention sweep from feet to face. Releases what you did not notice holding.', false, 6),

('pmr', 'Progressive Muscle Relaxation', 'pmr',
 '{"cycle":["tense 5 seconds","release 15 seconds"]}'::jsonb,
 '{10,15}', 'Tense each muscle group, then let go — teaches the body the difference.', false, 7);
