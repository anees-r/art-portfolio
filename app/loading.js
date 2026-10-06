// Shown while a page's Nezden data is being read: an empty frame waiting for its piece.
export default function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="frame-l" />
      <span>Hanging the work</span>
    </div>
  );
}
