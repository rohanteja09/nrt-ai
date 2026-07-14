import Chat from "@/components/Chat";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200/60 px-4 py-3 backdrop-blur-md dark:border-zinc-800/60">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div>
              <h1 className="text-base font-semibold tracking-tight">NRT AI</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Chat &middot; Browse &middot; Code &middot; See &middot; Create
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-zinc-200/70 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            live
          </span>
        </div>
      </header>
      <Chat />
    </div>
  );
}
