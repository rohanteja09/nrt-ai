import Chat from "@/components/Chat";
import Logo from "@/components/Logo";
import StatusBadge from "@/components/StatusBadge";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="relative border-b border-white/40 bg-white/60 px-4 py-3 backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/50">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} animateIn />
            <div>
              <h1 className="text-base font-semibold tracking-tight">NRT AI</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Chat &middot; Browse &middot; Code &middot; See &middot; Create
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <StatusBadge />
          </div>
        </div>
        <div className="gradient-bar absolute inset-x-0 bottom-0" />
      </header>
      <Chat />
    </div>
  );
}
