import { ACCENT_STORAGE_KEY } from "@/lib/preferences";

// Runs before hydration to set data-accent synchronously, avoiding a flash
// of the default accent on load.
const script = `
(function () {
  try {
    var stored = localStorage.getItem("${ACCENT_STORAGE_KEY}");
    if (stored) document.documentElement.setAttribute("data-accent", stored);
  } catch (e) {}
})();
`;

export default function AccentInit() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
