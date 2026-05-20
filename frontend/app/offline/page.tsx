import { PublicNav } from "@/components/layout/public-nav";

export default function OfflinePage() {
  return (
    <div>
      <PublicNav />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">You are offline</h1>
        <p className="mt-3 text-muted-foreground">AI Job Copilot is PWA-ready. Cached pages can be enabled with a service worker during deployment.</p>
      </main>
    </div>
  );
}
