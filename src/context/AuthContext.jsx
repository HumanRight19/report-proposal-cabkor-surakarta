import { useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { supabase } from "../lib/supabaseClient";

const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const SESSION_STARTED_AT_KEY = "report_proposal_session_started_at";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const logoutTimerRef = useRef(null);

  function clearLogoutTimer() {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }

  function clearSessionStartTime() {
    sessionStorage.removeItem(SESSION_STARTED_AT_KEY);
  }

  function getSessionStartTime() {
    const storedValue = sessionStorage.getItem(SESSION_STARTED_AT_KEY);

    if (!storedValue) {
      return null;
    }

    const timestamp = Number(storedValue);

    if (!Number.isFinite(timestamp)) {
      return null;
    }

    return timestamp;
  }

  function setSessionStartTime(timestamp = Date.now()) {
    sessionStorage.setItem(SESSION_STARTED_AT_KEY, String(timestamp));
  }

  async function loadProfile(authUser) {
    if (!authUser?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();

    if (error) {
      console.error("Gagal mengambil profile:", error);

      setProfile(null);

      throw new Error("PROFILE_LOAD_ERROR");
    }

    if (!data) {
      console.error("Profile tidak ditemukan untuk user:", authUser.id);

      setProfile(null);

      throw new Error("PROFILE_NOT_FOUND");
    }

    setProfile(data);

    return data;
  }

  async function expireSession() {
    clearLogoutTimer();
    clearSessionStartTime();

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Gagal mengakhiri session:", error);

      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }

  function startSessionTimer(startedAt) {
    clearLogoutTimer();

    if (!startedAt) {
      return;
    }

    const elapsedTime = Date.now() - startedAt;
    const remainingTime = SESSION_TIMEOUT_MS - elapsedTime;

    if (remainingTime <= 0) {
      expireSession();
      return;
    }

    logoutTimerRef.current = setTimeout(() => {
      expireSession();
    }, remainingTime);
  }

  function initializeSessionTimer(currentSession) {
    if (!currentSession) {
      clearLogoutTimer();
      clearSessionStartTime();
      return;
    }

    let startedAt = getSessionStartTime();

    if (!startedAt) {
      startedAt = Date.now();
      setSessionStartTime(startedAt);
    }

    startSessionTimer(startedAt);
  }

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

      const currentSession = data.session ?? null;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
        try {
          await loadProfile(currentSession.user);
        } catch (profileError) {
          console.error("Gagal memuat profile:", profileError);
        }

        initializeSessionTimer(currentSession);
      } else {
        setProfile(null);
        clearLogoutTimer();
        clearSessionStartTime();
      }

      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) {
        return;
      }

      const nextSession = currentSession ?? null;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (event === "SIGNED_IN") {
        setSessionStartTime(Date.now());

        startSessionTimer(Date.now());

        try {
          await loadProfile(nextSession?.user);
        } catch (profileError) {
          console.error("Gagal memuat profile setelah login:", profileError);
        }
      }

      if (event === "SIGNED_OUT") {
        clearLogoutTimer();
        clearSessionStartTime();
        setProfile(null);
      }

      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") {
        if (nextSession) {
          initializeSessionTimer(nextSession);

          try {
            await loadProfile(nextSession.user);
          } catch (profileError) {
            console.error("Gagal memperbarui profile:", profileError);
          }
        } else {
          setProfile(null);
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;

      clearLogoutTimer();

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

    if (!normalizedUsername) {
      throw new Error("USERNAME_NOT_FOUND");
    }

    const { data: config, error: configError } = await supabase.from("app_config").select("username, auth_email").eq("username", normalizedUsername).maybeSingle();

    if (configError) {
      console.error("Gagal mengambil konfigurasi login:", configError);

      throw new Error("LOGIN_CONFIG_ERROR");
    }

    if (!config) {
      throw new Error("USERNAME_NOT_FOUND");
    }

    if (!config.auth_email) {
      console.error("Email Auth belum dikonfigurasi untuk username:", normalizedUsername);

      throw new Error("LOGIN_EMAIL_NOT_CONFIGURED");
    }

    return login(config.auth_email, password);
  }

  async function logout() {
    clearLogoutTimer();
    clearSessionStartTime();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    isAuthenticated: Boolean(session),
    login,
    loginWithUsername,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
