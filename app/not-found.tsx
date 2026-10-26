import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex h-full min-h-screen items-center justify-center bg-background p-6">
      <div className="floating-panel max-w-md p-8 text-center">
        <p className="text-sm font-semibold tracking-wide text-accent">404</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 text-sm text-muted">
          The page you were looking for isn&apos;t here. Your notes live on the
          canvas.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          Go to the canvas
        </Link>
      </div>
    </main>
  );
}
