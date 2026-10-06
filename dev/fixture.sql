-- =============================================================================
-- DEV-ONLY FIXTURE — a stand-in for the Nezden database, for local development.
--
-- This creates objects with the SAME NAMES AND COLUMNS as the read-only views
-- Nezden exposes (art_site_artworks, art_site_collections, art_site_profile,
-- art_site_process_steps) plus the two tables the social-links query joins.
--
--   * It runs ONLY inside the throwaway Postgres from docker-compose.dev.yml.
--   * NEVER run this against Nezden's real database. Nezden owns that schema.
--   * The art portfolio itself never creates, migrates or writes anything.
--
-- If you run Nezden locally, skip this and point NEZDEN_DATABASE_URL at
-- Nezden's own database instead.
-- =============================================================================

CREATE TABLE art_site_collections (
  id               int PRIMARY KEY,
  slug             text UNIQUE NOT NULL,
  title            text NOT NULL,
  description      text,
  year_range       text,
  tone             text,
  sort             int NOT NULL DEFAULT 0,
  cover_artwork_id int,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE art_site_artworks (
  id                 int PRIMARY KEY,
  slug               text UNIQUE NOT NULL,
  title              text NOT NULL,
  year               text,
  collection_id      int,
  collection_slug    text,
  collection_title   text,
  collection_sort    int,
  medium             text,
  dimensions         text,
  description        text,
  artist_note        text,
  placeholder_preset text,
  sort_in_collection int NOT NULL DEFAULT 0,
  image_path         text,
  image_thumb_path   text,
  image_width        int,
  image_height       int,
  image_alt          text,
  image_color        text,
  thumbnail_path     text,
  is_featured        boolean NOT NULL DEFAULT false,
  featured_position  int,
  published_at       timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE art_site_profile (
  display_name    text,
  role_line       text,
  bio             text,
  statement       text,
  focus           text,
  tools           text[],
  portrait_path   text,
  title           text,
  subtitle        text,
  intro_heading   text,
  hero_artwork_id int,
  nav_work        boolean,
  nav_collections boolean,
  nav_process     boolean,
  nav_about       boolean,
  nezden_url      text,
  art_site_url    text,
  dev_site_url    text
);

CREATE TABLE art_site_process_steps (
  id    int PRIMARY KEY,
  title text NOT NULL,
  body  text,
  sort  int NOT NULL DEFAULT 0
);

CREATE TABLE media_asset (
  id   int PRIMARY KEY,
  path text NOT NULL
);

CREATE TABLE social_link (
  id               int PRIMARY KEY,
  label            text NOT NULL,
  url              text NOT NULL,
  icon             text,
  icon_color       text,
  custom_icon_id   int REFERENCES media_asset(id),
  show_on_art_site boolean NOT NULL DEFAULT true,
  sort             int NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Sample content (mirrors the prototype's sample gallery)
-- ---------------------------------------------------------------------------

INSERT INTO art_site_collections (id, slug, title, description, year_range, tone, sort, cover_artwork_id) VALUES
 (1, 'death-of-self', 'Death of Self', 'A conceptual exploration of identity, dissolution and transformation.', '2023', 'rgba(166,79,94,.32)', 1, 1),
 (2, 'awakening', 'Awakening', 'A movement from dissolution toward awareness.', '2023–2024', 'rgba(226,154,104,.26)', 2, NULL),
 (3, 'time', 'Time', 'Exploration of change, impermanence and existence.', '2024', 'rgba(143,176,201,.24)', 3, NULL),
 (4, 'dome-of-enlightenment', 'Dome of Enlightenment', 'A more architectural, symbolic visual exploration.', '2025', 'rgba(185,133,63,.26)', 4, NULL),
 (5, 'lavender', 'Lavender', 'A softer, more atmospheric body of work.', '2025', 'rgba(138,111,224,.34)', 5, 99);
 -- cover_artwork_id 99 deliberately points at a hidden artwork → falls back to the first work.

INSERT INTO art_site_artworks
 (id, slug, title, year, collection_id, collection_slug, collection_title, collection_sort, medium, dimensions,
  description, artist_note, placeholder_preset, sort_in_collection,
  image_path, image_thumb_path, image_width, image_height, image_alt, image_color, thumbnail_path,
  is_featured, featured_position, published_at, updated_at) VALUES
 (1, 'death-of-self-i', 'Death of Self I', '2023', 1, 'death-of-self', 'Death of Self', 1, 'Digital painting', '4000 × 5000 px',
  E'A figure comes apart into the light behind it.\n\nSample text: replace with the real description in Nezden.', 'Sample note. I wanted to see what stays when the outline goes.', NULL, 1,
  'sample/dissolve1.webp', 'sample/dissolve1-thumb.webp', 1200, 1500, 'A figure dissolving into warm particles of light', '#65443f', NULL,
  true, 2, now() - interval '9 days', now() - interval '9 days'),
 (2, 'death-of-self-ii', 'Death of Self II', '2023', 1, 'death-of-self', 'Death of Self', 1, 'Digital painting', '5000 × 4000 px',
  'The same figure, further along. Sample text.', NULL, NULL, 2,
  'sample/dissolve7.webp', 'sample/dissolve7-thumb.webp', 1500, 1200, NULL, '#6f4b43', NULL,
  false, NULL, now() - interval '8 days', now() - interval '8 days'),
 (3, 'awakening-i', 'Awakening I', '2024', 2, 'awakening', 'Awakening', 2, 'Digital painting', '3600 × 4400 px',
  'Light arrives before anything can be named. Sample text.', 'Sample note.', NULL, 1,
  'sample/awaken3.webp', 'sample/awaken3-thumb.webp', 1170, 1430, NULL, '#4f4f49', NULL,
  true, 3, now() - interval '6 days', now() - interval '6 days'),
 (4, 'time-i', 'Time I', '2024', 3, 'time', 'Time', 3, 'Illustration', '4000 × 4000 px',
  'Rings that do not agree on the hour. Sample text.', NULL, NULL, 1,
  'sample/time5.webp', 'sample/time5-thumb.webp', 1400, 1400, NULL, '#261d1a', NULL,
  true, 4, now() - interval '4 days', now() - interval '4 days'),
 (5, 'dome-of-enlightenment-i', 'Dome of Enlightenment I', '2025', 4, 'dome-of-enlightenment', 'Dome of Enlightenment', 4, 'Concept art', '3200 × 4400 px',
  'A room built around one opening. Sample text.', 'Sample note.', NULL, 1,
  'sample/dome2.webp', 'sample/dome2-thumb.webp', 1040, 1430, NULL, '#2a2a33', NULL,
  true, 1, now() - interval '3 days', now() - interval '3 days'),
 (6, 'lavender-i', 'Lavender I', '2025', 5, 'lavender', 'Lavender', 5, 'Digital painting', '5500 × 4000 px',
  'A field at the end of the day. Sample text.', NULL, NULL, 1,
  'sample/lavender4.webp', 'sample/lavender4-thumb.webp', 1650, 1200, NULL, '#7760a9', NULL,
  false, NULL, now() - interval '2 days', now() - interval '2 days'),
 -- No image uploaded yet → rendered with its placeholder preset at 4:5.
 (7, 'lavender-ii', 'Lavender II', '2025', 5, 'lavender', 'Lavender', 5, 'Digital painting', NULL,
  'Work in progress. The image has not been uploaded yet, so the gallery paints its placeholder.', NULL, 'Field', 2,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  false, NULL, now() - interval '1 day', now() - interval '1 day'),
 -- Uncollected work.
 (8, 'hourglass', 'Hourglass', '2025', NULL, NULL, NULL, NULL, 'Study', NULL,
  'A small study that does not belong anywhere yet. Sample text.', NULL, 'Hourglass', 0,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  false, NULL, now() - interval '12 hours', now() - interval '12 hours');

INSERT INTO art_site_profile VALUES (
 'Anees Rehman',
 'Digital artist · Illustrator · Painter',
 E'I''m self-taught. By day I''m a software engineer; the rest of the time I make images.\n\nI''m drawn to symbols, architecture and the kind of questions that don''t have clean answers. Most of what''s here began as a feeling I couldn''t explain, and making the picture was how I found out what it was.',
 E'I make things because ideas become clearer when I give them form.\n\nSometimes that form is software.\n\nSometimes it is an image.\n\nSometimes I don''t fully understand what I''m making until it exists.',
 'Dissolution and return: how a self comes apart and what comes back.',
 ARRAY['Digital painting','Illustration','Photoshop','Illustrator','Concept art','Graphic design','Sketching'],
 'sample/portrait21.webp',
 'Gallery',
 'A collection of things I''ve made.',
 'Things I''ve made',
 1,
 true, true, true, true,
 'https://nezden.com',
 'https://art.nezden.com',
 NULL
);

INSERT INTO art_site_process_steps (id, title, body, sort) VALUES
 (1, 'Idea', 'A feeling, a symbol, a question I can''t answer yet.', 1),
 (2, 'Sketch', 'Fast, rough marks. Nothing is precious here.', 2),
 (3, 'Study', 'Light, colour, anatomy, architecture, whatever the piece needs to be true.', 3),
 (4, 'Experiment', 'Try it five ways. Keep the one that surprises me.', 4),
 (5, 'Finished work', 'It goes on the wall when I stop wanting to change it.', 5);

INSERT INTO social_link (id, label, url, icon, icon_color, custom_icon_id, show_on_art_site, sort) VALUES
 (1, 'Instagram', 'https://instagram.com/', 'instagram', NULL, NULL, true, 1),
 (2, 'Behance', 'https://behance.net/', 'behance', NULL, NULL, true, 2),
 (3, 'Email', 'mailto:hello@example.com', 'mail', NULL, NULL, true, 3),
 (4, 'GitHub', 'https://github.com/', 'github', NULL, NULL, false, 4);
