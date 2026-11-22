ALTER TABLE churches ADD COLUMN photos_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN church_id TEXT;

INSERT INTO churches (
  id, name, pastor_name, address, city, state, country, postal_code,
  lat, lng, service_times, contact_info, photo_url, photos_json,
  verified, status, submitted_by, created_at, verified_at
) VALUES (
  'church-riverbank-ca',
  'IDDV El Buen Pastor — Riverbank',
  'Co-Pastor Azael Tapia',
  '3109 Santa Fe St',
  'Riverbank',
  'CA',
  'Estados Unidos',
  '95367',
  37.736108061398205,
  -120.93872212946533,
  'Martes 7:00 PM–9:00 PM · Jueves 7:00 PM–9:00 PM · Viernes 7:00 PM–9:00 PM (Estudio bíblico de jóvenes) · Domingo 2:00 PM–5:00 PM',
  NULL,
  'https://audio.himnarioebp.com/church-photos/riverbank-ca-1.jpg',
  '["https://audio.himnarioebp.com/church-photos/riverbank-ca-1.jpg","https://audio.himnarioebp.com/church-photos/riverbank-ca-2.jpg"]',
  1,
  'approved',
  NULL,
  1763820000000,
  1763820000000
) ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  pastor_name = excluded.pastor_name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  country = excluded.country,
  postal_code = excluded.postal_code,
  lat = excluded.lat,
  lng = excluded.lng,
  service_times = excluded.service_times,
  photo_url = excluded.photo_url,
  photos_json = excluded.photos_json,
  verified = 1,
  status = 'approved';
