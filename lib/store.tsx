"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

export interface LicenseKey {
  id: string;
  key: string;
  product: string;
  status: "active" | "created" | "expired" | "banned";
  duration: string;
  owner: string;
  hwid: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: "user" | "reseller" | "admin" | "superadmin";
  balance: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  version: string;
  price: number;
  active: boolean;
}

export interface LogEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  detail: string;
  ip: string;
}

export type ThemeName = "purple" | "blue" | "green" | "red";

interface AppState {
  users: User[];
  keys: LicenseKey[];
  products: Product[];
  logs: LogEntry[];
  currentUser: User | null;
  theme: ThemeName;
}

const STORAGE_VERSION = 2;

const defaultState: AppState = {
  users: [
    {
      id: "1",
      username: "admin",
      password: "admin",
      role: "superadmin",
      balance: 0,
      createdAt: new Date().toISOString(),
    },
  ],
  keys: [],
  products: [],
  logs: [],
  currentUser: null,
  theme: "purple" as ThemeName,
};

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parts = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
  return "KEY-" + parts.join("-");
}

function formatDate(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface StoreContextValue {
  state: AppState;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addKey: (product: string, duration: string, count: number) => void;
  deleteKey: (id: string) => void;
  resetHwid: (id: string) => void;
  bindHwid: (id: string, hwid: string) => void;
  revokeKey: (id: string) => void;
  addUser: (username: string, password: string, role: string, balance: number) => void;
  deleteUser: (id: string) => void;
  addProduct: (name: string, version: string, price: number) => void;
  deleteProduct: (id: string) => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
  addLog: (action: string, detail?: string) => void;
  setTheme: (theme: ThemeName) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const savedVersion = localStorage.getItem("appVersion");
      const saved = localStorage.getItem("appState");
      if (saved && Number(savedVersion) >= STORAGE_VERSION) {
        const parsed = JSON.parse(saved) as AppState;
        return { ...defaultState, ...parsed, currentUser: null };
      }
      localStorage.setItem("appVersion", String(STORAGE_VERSION));
    } catch {}
    return defaultState;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const toSave = { ...state, currentUser: null };
    localStorage.setItem("appState", JSON.stringify(toSave));
  }, [state]);

  // Загружаем ключи из D1 при старте
  useEffect(() => {
    const API_URL = "https://license-api.burdikey-panel.workers.dev";
    fetch(`${API_URL}/api/keys`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const d1Keys: LicenseKey[] = data.map((row: any) => ({
          id: row.id,
          key: row.key,
          product: row.product,
          status: row.status,
          duration: row.duration_days === -1 ? "Навсегда" : `${row.duration_days} дней`,
          owner: row.created_by,
          hwid: row.hwid || null,
          createdAt: new Date(row.created_at * 1000).toISOString().replace("T", " ").slice(0, 19),
          expiresAt: row.expires_at ? new Date(row.expires_at * 1000).toISOString().replace("T", " ").slice(0, 19) : null,
        }));
        setState((prev) => {
          const existingIds = new Set(prev.keys.map((k) => k.id));
          const newD1Keys = d1Keys.filter((k) => !existingIds.has(k.id));
          if (newD1Keys.length === 0) return prev;
          return { ...prev, keys: [...d1Keys, ...prev.keys.filter((k) => !d1Keys.find((d) => d.id === k.id))] };
        });
      })
      .catch(() => {});
  }, []);

  const login = (username: string, password: string): boolean => {
    const current = stateRef.current;
    const user = current.users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return false;

    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: username,
      action: "login",
      detail: "",
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      currentUser: user,
      logs: [logEntry, ...prev.logs],
    }));
    return true;
  };

  const logout = () => {
    const current = stateRef.current;
    if (current.currentUser) {
      const logEntry: LogEntry = {
        id: generateId(),
        date: formatDate(new Date()),
        user: current.currentUser.username,
        action: "logout",
        detail: "",
        ip: "127.0.0.1",
      };
      setState((prev) => ({ ...prev, currentUser: null, logs: [logEntry, ...prev.logs] }));
    } else {
      setState((prev) => ({ ...prev, currentUser: null }));
    }
  };

  const addKey = (product: string, duration: string, count: number) => {
    const current = stateRef.current;
    const newKeys: LicenseKey[] = Array.from({ length: count }, () => ({
      id: generateId(),
      key: generateKey(),
      product,
      status: "created" as const,
      duration,
      owner: current.currentUser?.username || "unknown",
      hwid: null,
      createdAt: formatDate(new Date()),
      expiresAt: null,
    }));

    // Отправляем ключи в D1 через Worker API
    const API_URL = "https://license-api.burdikey-panel.workers.dev";
    for (const k of newKeys) {
      fetch(`${API_URL}/api/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: k.key,
          product: k.product,
          duration: k.duration,
          createdBy: k.owner,
        }),
      }).catch((e) => console.error("Failed to sync key to D1:", e));
    }

    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "generate_keys",
      detail: `${count}x ${product} ${duration}`,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      keys: [...newKeys, ...prev.keys],
      logs: [logEntry, ...prev.logs],
    }));
  };

  const deleteKey = (id: string) => {
    const current = stateRef.current;
    const key = current.keys.find((k) => k.id === id);
    const API_URL = "https://license-api.burdikey-panel.workers.dev";
    fetch(`${API_URL}/api/keys?id=${id}`, { method: "DELETE" })
      .catch((e) => console.error("Failed to delete key from D1:", e));
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "delete_key",
      detail: key?.key || id,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      keys: prev.keys.filter((k) => k.id !== id),
      logs: [logEntry, ...prev.logs],
    }));
  };

  const resetHwid = (id: string) => {
    const current = stateRef.current;
    const key = current.keys.find((k) => k.id === id);
    const API_URL = "https://license-api.burdikey-panel.workers.dev";
    fetch(`${API_URL}/api/keys`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hwid: null, status: "created" }),
    }).catch((e) => console.error("Failed to reset HWID in D1:", e));
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "reset_hwid",
      detail: key?.key || id,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      keys: prev.keys.map((k) => (k.id === id ? { ...k, hwid: null } : k)),
      logs: [logEntry, ...prev.logs],
    }));
  };

  const bindHwid = (id: string, hwid: string) => {
    const current = stateRef.current;
    const key = current.keys.find((k) => k.id === id);
    const API_URL = "https://license-api.burdikey-panel.workers.dev";
    fetch(`${API_URL}/api/keys`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hwid, status: "active", activated_at: Math.floor(Date.now() / 1000) }),
    }).catch((e) => console.error("Failed to bind HWID in D1:", e));
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "bind_hwid",
      detail: `${key?.key || id} → ${hwid}`,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      keys: prev.keys.map((k) =>
        k.id === id ? { ...k, hwid, status: "active" as const } : k
      ),
      logs: [logEntry, ...prev.logs],
    }));
  };

  const revokeKey = (id: string) => {
    const current = stateRef.current;
    const key = current.keys.find((k) => k.id === id);
    const API_URL = "https://license-api.burdikey-panel.workers.dev";
    fetch(`${API_URL}/api/keys`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "banned" }),
    }).catch((e) => console.error("Failed to ban key in D1:", e));
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "revoke_key",
      detail: key?.key || id,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      keys: prev.keys.map((k) =>
        k.id === id ? { ...k, status: "banned" as const } : k
      ),
      logs: [logEntry, ...prev.logs],
    }));
  };

  const addUser = (username: string, password: string, role: string, balance: number) => {
    const current = stateRef.current;
    const newUser: User = {
      id: generateId(),
      username,
      password,
      role: role as User["role"],
      balance,
      createdAt: formatDate(new Date()),
    };
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "create_user",
      detail: username,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      logs: [logEntry, ...prev.logs],
    }));
  };

  const deleteUser = (id: string) => {
    const current = stateRef.current;
    const user = current.users.find((u) => u.id === id);
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "delete_user",
      detail: user?.username || id,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
      logs: [logEntry, ...prev.logs],
    }));
  };

  const addProduct = (name: string, version: string, price: number) => {
    const current = stateRef.current;
    const newProduct: Product = {
      id: generateId(),
      name,
      version,
      price,
      active: true,
    };
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "create_product",
      detail: name,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
      logs: [logEntry, ...prev.logs],
    }));
  };

  const deleteProduct = (id: string) => {
    const current = stateRef.current;
    const product = current.products.find((p) => p.id === id);
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action: "delete_product",
      detail: product?.name || id,
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
      logs: [logEntry, ...prev.logs],
    }));
  };

  const changePassword = (oldPass: string, newPass: string): boolean => {
    const current = stateRef.current;
    if (!current.currentUser) return false;
    if (current.currentUser.password !== oldPass) return false;

    const updatedUser = { ...current.currentUser, password: newPass };
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser.username,
      action: "change_password",
      detail: "",
      ip: "127.0.0.1",
    };
    setState((prev) => ({
      ...prev,
      currentUser: updatedUser,
      users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      logs: [logEntry, ...prev.logs],
    }));
    return true;
  };

  const addLog = (action: string, detail?: string) => {
    const current = stateRef.current;
    const logEntry: LogEntry = {
      id: generateId(),
      date: formatDate(new Date()),
      user: current.currentUser?.username || "unknown",
      action,
      detail: detail || "",
      ip: "127.0.0.1",
    };
    setState((prev) => ({ ...prev, logs: [logEntry, ...prev.logs] }));
  };

  const setTheme = (theme: ThemeName) => {
    setState((prev) => ({ ...prev, theme }));
  };

  return (
    <StoreContext.Provider
      value={{
        state,
        login,
        logout,
        addKey,
        deleteKey,
        resetHwid,
        bindHwid,
        revokeKey,
        addUser,
        deleteUser,
        addProduct,
        deleteProduct,
        changePassword,
        addLog,
        setTheme,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
