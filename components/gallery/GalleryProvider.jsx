'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Viewer from './Viewer';

const GalleryCtx = createContext(null);

/**
 * Shared state for one gallery page: the cinematic viewer and the corridor
 * filter (so the collection "doors" can re-hang the corridor).
 */
export default function GalleryProvider({ artworks, tones, siteName, children }) {
  const viewer = useRef(null);
  const [filterRequest, setFilterRequest] = useState(null);

  const openViewer = useCallback((slug, fromEl) => viewer.current?.open(slug, fromEl) ?? false, []);
  const requestFilter = useCallback(
    (id, opts) => setFilterRequest({ id, scroll: !!opts?.scroll, n: Date.now() }),
    []
  );

  const value = useMemo(
    () => ({ artworks, tones, openViewer, requestFilter, filterRequest }),
    [artworks, tones, openViewer, requestFilter, filterRequest]
  );

  return (
    <GalleryCtx.Provider value={value}>
      {children}
      <Viewer ref={viewer} artworks={artworks} tones={tones} siteName={siteName} />
    </GalleryCtx.Provider>
  );
}

export const useGallery = () => useContext(GalleryCtx);
