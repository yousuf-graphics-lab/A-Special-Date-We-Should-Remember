/**
 * Skeleton for the private dashboard while the entry is fetched.
 */
export default function VaultLoading(): JSX.Element {
  return (
    <main className="mx-auto w-full max-w-3xl animate-pulse px-4 py-10 sm:px-6" aria-busy="true">
      <span className="sr-only">Opening the vault…</span>
      <div className="mb-8 h-3 w-24 rounded-full bg-white/10" />
      <div className="mb-4 h-8 w-48 rounded-full bg-white/10" />
      <div className="glass h-64 w-full" />
      <div className="glass mt-5 h-40 w-full" />
    </main>
  );
}
