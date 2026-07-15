import { useEffect, useState } from "react";

export function useTypewriter(fullText: string, active: boolean, speed = 12) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!active) return;
    // Resets the animation before subscribing to the interval below — the
    // same message id's text flips from "" to the final reply mid-mount,
    // so this can't be replaced with a render-time derivation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown("");
    let i = 0;
    const step = Math.max(1, Math.round(fullText.length / 60));
    const id = setInterval(() => {
      i += step;
      setShown(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullText, active]);

  return active ? shown : fullText;
}
