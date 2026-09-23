import { useState } from "react";
import { useAuth } from "../context/useAuth";

function Login() {
  const { loginWithUsername } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <main className="login-page">
      {/* BACKGROUND DECORATION */}
      <div className="login-background">
        <span className="login-orb login-orb-one" />
        <span className="login-orb login-orb-two" />
        <span className="login-orb login-orb-three" />
      </div>

      <section className="login-shell">
        {/* BRAND */}
        <div className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">
            <span>RP</span>
          </div>

          <div className="login-brand-text">
            <span className="login-brand-eyebrow">INTERNAL SYSTEM</span>

            <h1>REPORT PROPOSAL</h1>
          </div>
        </div>

        {/* LOGIN CARD */}
        <div className="clay-surface login-card">
          <div className="login-card-heading">
            <span className="login-eyebrow">SELAMAT DATANG</span>

            <h2>Masuk ke Sistem</h2>

            <p>Silakan masuk menggunakan akun Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* USERNAME */}
            <div className="login-field">
              <label htmlFor="username">Username</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />

                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  placeholder="Masukkan username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="10" width="16" height="11" rx="2.5" />

                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                  </svg>
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  disabled={loading}
                />

                <button type="button" className="login-password-toggle" onClick={() => setShowPassword((current) => !current)} disabled={loading} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 3l18 18" strokeLinecap="round" />

                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />

                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4.7 9.8 6.5a2.9 2.9 0 0 1 0 3c-.5.8-1.2 1.7-2.1 2.6" strokeLinecap="round" />

                      <path d="M6.2 6.2C4.4 7.5 3.2 9.1 2.2 10.5a2.9 2.9 0 0 0 0 3C3.3 15.2 6.8 20 12 20c1.7 0 3.2-.4 4.5-1.1" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2.2 12s3.5-6 9.8-6 9.8 6 9.8 6-3.5 6-9.8 6-9.8-6-9.8-6Z" />

                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="login-error" role="alert">
                <span className="login-error-icon">!</span>

                <div>
                  <strong>Login gagal</strong>

                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <>
                  <span className="login-spinner" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>

                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h13" strokeLinecap="round" />

                    <path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* SECURITY NOTE */}
          <div className="login-security">
            <span className="login-security-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" strokeLinejoin="round" />

                <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>

            <span>Akses internal yang aman</span>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="login-footer">
          <span>REPORT PROPOSAL</span>

          <span className="login-footer-dot">•</span>

          <span>Internal Management System</span>
        </footer>
      </section>
    </main>
  );
}

export default Login;
