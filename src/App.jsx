import Login from "./pages/Login";
import { useAuth } from "./context/useAuth";
import Dashboard from "./pages/Dashboard";
import Supervisor from "./pages/Supervisor";

function App() {
  const { loading, isAuthenticated, profile } = useAuth();

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">Memeriksa session...</main>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (profile?.role === "SUPERVISOR") {
    return <Supervisor />;
  }

  if (profile?.role === "SALES") {
    return <Dashboard />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Akses Tidak Dikenali</h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Profile akun belum memiliki role yang valid.</p>
      </div>
    </main>
  );
}

export default App;
