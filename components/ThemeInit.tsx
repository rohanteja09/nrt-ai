export const THEME_STORAGE_KEY = "nrt-theme";

// Runs before hydration to set the .dark class synchronously, avoiding a
// flash of the wrong theme. Kept as a plain string so it can be inlined.
const script = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function ThemeInit() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
