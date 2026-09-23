import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { supabase } from "../lib/supabaseClient";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Gagal mengambil session:", error);
      }

      if (!mounted) {
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) {
        return;
      }

      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async function loginWithUsername(username, password) {
    const normalizedUsername = username.trim().toLowerCase();

    const { data: config, error: configError } = await supabase.from("app_config").select("username, auth_email").eq("id", 1).maybeSingle();

    if (configError) {
      console.error("Gagal mengambil konfigurasi login:", configError);

      throw new Error("LOGIN_CONFIG_ERROR");
    }

    if (!config || config.username.toLowerCase() !== normalizedUsername) {
      throw new Error("USERNAME_NOT_FOUND");
    }

    return login(config.auth_email, password);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  const value = {
    session,
    user,
    loading,
    isAuthenticated: Boolean(session),
    login,
    loginWithUsername,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
