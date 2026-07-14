export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
      Built by{" "}
      <a
        href="https://github.com/rohanteja09"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
      >
        Rohan Teja Nallapaneni
      </a>{" "}
      · running entirely on Cloudflare&apos;s free tier
    </footer>
  );
}
