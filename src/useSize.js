import { useEffect, useRef, useState } from 'react';

// The size of an element in pixels, kept up as it changes, so that a chart is
// drawn at the size it is shown and its text is never scaled.
export default function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}
