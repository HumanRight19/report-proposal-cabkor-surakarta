// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import { useAuth } from "./context/useAuth";

// function App() {
//   const { loading, isAuthenticated } = useAuth();

//   if (loading) {
//     return (
//       <main
//         style={{
//           minHeight: "100vh",
//           display: "grid",
//           placeItems: "center",
//           fontFamily: "Arial, sans-serif",
//           background: "#f8fafc",
//           color: "#475569",
//         }}
//       >
//         Memeriksa session...
//       </main>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Login />;
//   }

//   return <Dashboard />;
// }

// export default App;

import Login from "./pages/Login";
// import DatabaseTest from "./pages/DatabaseTest";
import { useAuth } from "./context/useAuth";
import Dashboard from "./pages/Dashboard";

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        Memeriksa session...
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard />;
}

export default App;
