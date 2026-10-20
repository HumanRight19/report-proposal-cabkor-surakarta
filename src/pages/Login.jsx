import { useState } from "react";
import { useAuth } from "../context/useAuth";

function Login() {
  const { loginWithUsername } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      await loginWithUsername(username.trim(), password);
    } catch (error) {
      console.error("Login gagal:", error);

      if (error.message === "USERNAME_NOT_FOUND") {
        setError("Username tidak ditemukan.");
      } else if (error.message === "Invalid login credentials") {
        setError("Username atau password salah.");
      } else {
        setError("Login gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-200 hover:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#080d19] px-4 py-8 text-slate-100 sm:px-6">
      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#64748b_0.7px,transparent_0.7px)] bg-[size:24px_24px] opacity-40" />
      </div>

      <section className="relative w-full max-w-[440px]">
        {/* BRAND & LOGO */}
        <header className="mb-6 text-center">
          <div className="mx-auto mb-4 flex w-full max-w-[170px] items-center justify-center sm:max-w-[190px]">
            {!logoError ? (
              <img src="/logo.png" alt="Logo Bank Jateng" className="block h-auto max-h-[72px] w-full object-contain sm:max-h-[80px]" onError={() => setLogoError(true)} />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white sm:h-12 sm:w-12 sm:text-xl">RP</div>
            )}
          </div>

          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-indigo-300 sm:text-[10px] sm:tracking-[0.28em]">Internal Management System</p>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Report Proposal</h1>

          <p className="mt-1.5 text-sm text-slate-400">Bank Jateng Area Surakarta</p>
        </header>

        {/* LOGIN CARD */}
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/25 sm:p-8">
          <div className="mb-7">
            <span className="inline-flex items-center rounded-full bg-indigo-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">Selamat datang</span>

            <h2 className="mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl">Masuk ke Sistem</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">Masukkan akun Anda untuk melanjutkan ke dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USERNAME */}
            <div>
              <label htmlFor="username" className="mb-2 block text-xs font-bold text-slate-300">
                Username
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
                  </svg>
                </span>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  placeholder="Masukkan username"
                  disabled={loading}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-bold text-slate-300">
                Password
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2.5" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                  </svg>
                </span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  disabled={loading}
                  required
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-200 disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden="true">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />
                      <path
                        d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4.7 9.8 6.5a2.9 2.9 0 0 1 0 3c-.5.8-1.2 1.7-2.1 2.6M6.2 6.2C4.4 7.5 3.2 9.1 2.2 10.5a2.9 2.9 0 0 0 0 3C3.3 15.2 6.8 20 12 20c1.7 0 3.2-.4 4.5-1.1"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden="true">
                      <path d="M2.2 12s3.5-6 9.8-6 9.8 6 9.8 6-3.5 6-9.8 6-9.8-6-9.8-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-900/70 bg-rose-950/30 p-3.5 text-rose-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-black">!</span>

                <div>
                  <p className="text-xs font-extrabold">Login gagal</p>
                  <p className="mt-1 text-xs leading-5">{error}</p>
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true">
                    <path d="M5 12h13" strokeLinecap="round" />
                    <path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* SECURITY NOTE */}
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-800 pt-5 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true">
              <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" strokeLinejoin="round" />
              <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span className="text-[11px] font-medium">Akses internal yang aman</span>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] text-slate-500">
          <span className="font-bold tracking-wider">REPORT PROPOSAL</span>
          <span aria-hidden="true">•</span>
          <span>Area Surakarta</span>
        </footer>
      </section>
    </main>
  );
}

export default Login;
