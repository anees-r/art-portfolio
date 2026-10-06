// Drizzle descriptions of the views Nezden exposes to the art site.
//
// Every object is declared with `.existing()`: Drizzle treats it as something
// that already exists and will never try to create, alter or drop it. This app
// has no drizzle-kit config and no migrations — Nezden owns the schema.
import { pgView, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';

const ts = (name) => timestamp(name, { withTimezone: true, mode: 'string' });

export const artSiteArtworks = pgView('art_site_artworks', {
  id: integer('id'),
  slug: text('slug'),
  title: text('title'),
  year: text('year'),
  collectionId: integer('collection_id'),
  collectionSlug: text('collection_slug'),
  collectionTitle: text('collection_title'),
  collectionSort: integer('collection_sort'),
  medium: text('medium'),
  dimensions: text('dimensions'),
  description: text('description'),
  artistNote: text('artist_note'),
  placeholderPreset: text('placeholder_preset'),
  sortInCollection: integer('sort_in_collection'),
  imagePath: text('image_path'),
  imageThumbPath: text('image_thumb_path'),
  imageWidth: integer('image_width'),
  imageHeight: integer('image_height'),
  imageAlt: text('image_alt'),
  imageColor: text('image_color'),
  thumbnailPath: text('thumbnail_path'),
  isFeatured: boolean('is_featured'),
  featuredPosition: integer('featured_position'),
  publishedAt: ts('published_at'),
  updatedAt: ts('updated_at'),
}).existing();

export const artSiteCollections = pgView('art_site_collections', {
  id: integer('id'),
  slug: text('slug'),
  title: text('title'),
  description: text('description'),
  yearRange: text('year_range'),
  tone: text('tone'),
  sort: integer('sort'),
  coverArtworkId: integer('cover_artwork_id'),
  updatedAt: ts('updated_at'),
}).existing();

export const artSiteProfile = pgView('art_site_profile', {
  displayName: text('display_name'),
  roleLine: text('role_line'),
  bio: text('bio'),
  statement: text('statement'),
  focus: text('focus'),
  tools: text('tools').array(),
  portraitPath: text('portrait_path'),
  title: text('title'),
  subtitle: text('subtitle'),
  introHeading: text('intro_heading'),
  heroArtworkId: integer('hero_artwork_id'),
  navWork: boolean('nav_work'),
  navCollections: boolean('nav_collections'),
  navProcess: boolean('nav_process'),
  navAbout: boolean('nav_about'),
  nezdenUrl: text('nezden_url'),
  artSiteUrl: text('art_site_url'),
  devSiteUrl: text('dev_site_url'),
}).existing();

export const artSiteProcessSteps = pgView('art_site_process_steps', {
  id: integer('id'),
  title: text('title'),
  body: text('body'),
  sort: integer('sort'),
}).existing();
