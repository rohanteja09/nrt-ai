import Chat from "@/components/Chat";
import Logo from "@/components/Logo";
import StatusBadge from "@/components/StatusBadge";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200/60 px-4 py-3 backdrop-blur-md dark:border-zinc-800/60">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div>
              <h1 className="text-base font-semibold tracking-tight">NRT AI</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Chat &middot; Browse &middot; Code &middot; See &middot; Create
              </p>
            </div>
          </div>
          <StatusBadge />
        </div>
      </header>
      <Chat />
    </div>
  );
}
