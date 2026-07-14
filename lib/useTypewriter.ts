import { useEffect, useState } from "react";

export function useTypewriter(fullText: string, active: boolean, speed = 12) {
  const [shown, setShown] = useState(active ? "" : fullText);

  useEffect(() => {
    if (!active) {
      setShown(fullText);
      return;
    }
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

  return shown;
}
