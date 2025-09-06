export default function SuccessPage() {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center text-white">
        <h1 className="text-2xl font-bold">Payment received ✅</h1>
        <p className="mt-3 text-white/80">
          Your credits will be credited shortly. You can close this page or go to Dashboard.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-full bg-indigo-500 hover:bg-indigo-400 px-5 py-2 font-semibold"
        >
          Go to Dashboard
        </a>
      </main>
    );
  }
  