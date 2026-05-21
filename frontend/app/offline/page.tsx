import { PublicNav } from "@/components/layout/public-nav";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto grid min-h-[70vh] max-w-2xl content-center px-4 py-12 text-center">
        <div className="rounded-md border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-primary">Offline mode</p>
          <h1 className="mt-2 text-3xl font-bold">You are offline</h1>
          <p className="mt-3 text-muted-foreground">Saved navigation can fall back here when the network drops. Reconnect to continue resume analysis, job matching, AI chat, and synced tracking.</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted">Home</Link>
            <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
