"use client";

import { useState, useEffect } from "react";
import { useStore, type ThemeName } from "@/lib/store";
import { dictionary, type Lang } from "@/lib/dictionary";
import Modal from "@/app/components/Modal";
import {
  LayoutDashboard, Key, Users, Package, FileText, Settings, LogOut,
  Globe, Sun, Moon, Search, MoreVertical, Copy, RotateCcw, Ban, Trash2,
  Fingerprint, UserPlus, Plus,
} from "lucide-react";

const navItems = [
  { key: "dashboard" as const, icon: LayoutDashboard },
  { key: "keys" as const, icon: Key },
  { key: "users" as const, icon: Users },
  { key: "products" as const, icon: Package },
  { key: "journal" as const, icon: FileText },
  { key: "settings" as const, icon: Settings },
];

export default function AppShell() {
  const [lang, setLang] = useState<Lang>("ru");
  const [darkMode, setDarkMode] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState("dashboard");
  const store = useStore();
  const { state, login, logout, setTheme: setAccentTheme } = store;

  useEffect(() => {
    try {
      const sl = localStorage.getItem("lang") as Lang | null;
      if (sl) setLang(sl);
      const sd = localStorage.getItem("theme") as "dark" | "light" | null;
      if (sd) setDarkMode(sd);
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode === "dark");
    document.documentElement.classList.toggle("light", darkMode === "light");
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  if (!mounted) return <div className="min-h-screen bg-[#0a0c14]" />;

  if (!state.currentUser) {
    return <LoginScreen lang={lang} setLang={setLang} onLogin={login} />;
  }

  const t = dictionary[lang];

  return (
    <div data-lang={lang} className="min-h-screen bg-[#0a0c14] flex">
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#0d0f1a] border-r border-zinc-800/50 flex flex-col z-50">
        <div className="px-5 py-5 border-b border-zinc-800/50">
          <h1 className="text-lg font-bold accent-text">{t.appName}</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active ? "accent-light-bg accent-text border accent-border" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}>
                <Icon className="w-4 h-4" />{t[item.key]}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full accent-light-bg flex items-center justify-center text-xs font-bold accent-text">
              {state.currentUser?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{state.currentUser?.username}</div>
              <div className="text-xs text-zinc-500 capitalize">{t.roles[state.currentUser?.role || "superadmin"]}</div>
            </div>
            <button onClick={() => { logout(); }} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition" title={t.logout}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 ml-56">
        <header className="sticky top-0 z-40 h-14 border-b border-zinc-800/50 bg-[#0a0c14]/80 backdrop-blur-xl flex items-center justify-end px-6 gap-3">
          <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
            {(["purple", "blue", "green", "red"] as ThemeName[]).map((th) => (
              <button key={th} onClick={() => setAccentTheme(th)}
                className={`w-5 h-5 rounded-full transition-all duration-200 ${state.theme === th ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0c14] scale-110" : "opacity-50 hover:opacity-100"}`}
                style={{ backgroundColor: th === "purple" ? "#9333ea" : th === "blue" ? "#2563eb" : th === "green" ? "#16a34a" : "#dc2626" }}
                title={th} />
            ))}
          </div>
          <button onClick={() => setLang(lang === "ru" ? "en" : "ru")} className="flex items-center gap-1 bg-zinc-800/50 hover:bg-zinc-700/50 px-3 py-1.5 rounded-lg text-sm text-zinc-300 transition">
            <Globe className="w-3.5 h-3.5" />{lang === "ru" ? "RU" : "EN"}
          </button>
          <button onClick={() => { const n = darkMode === "dark" ? "light" : "dark"; setDarkMode(n); localStorage.setItem("theme", n); }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition">
            {darkMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>
        <main className="p-6">
          {page === "dashboard" && <DashboardPage store={store} />}
          {page === "keys" && <KeysPage store={store} />}
          {page === "users" && <UsersPage store={store} />}
          {page === "products" && <ProductsPage store={store} />}
          {page === "journal" && <JournalPage store={store} />}
          {page === "settings" && <SettingsPage store={store} />}
        </main>
      </div>
    </div>
  );
}

function LoginScreen({ lang, setLang, onLogin }: { lang: Lang; setLang: (l: Lang) => void; onLogin: (u: string, p: string) => boolean }) {
  const t = dictionary[lang];
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState(false);
  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center relative">
      <button onClick={() => setLang(lang === "ru" ? "en" : "ru")} className="absolute top-5 right-5 flex items-center gap-1 bg-zinc-800/50 hover:bg-zinc-700/50 px-3 py-1.5 rounded-lg text-sm text-zinc-300 transition">
        {lang === "ru" ? "EN" : "RU"}
      </button>
      <div className="w-full max-w-md mx-4">
        <div className="bg-[#111327]/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-center text-white mb-1">{t.appName}</h1>
          <p className="text-center text-zinc-400 text-sm mb-8">{t.login}</p>
          <form onSubmit={(e) => { e.preventDefault(); if (!onLogin(username, password)) setError(true); }} className="space-y-4">
            {error && <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">Неверное имя пользователя или пароль</div>}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.username}</label>
              <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(false); }}
                className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[color:var(--accent)]/50 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.password}</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[color:var(--accent)]/50 transition" />
            </div>
            <button type="submit" className="w-full py-2.5 accent-gradient accent-gradient-hover text-white font-medium rounded-xl transition-all duration-200 accent-shadow mt-2">{t.signIn}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

type StoreType = ReturnType<typeof useStore>;

function DashboardPage({ store }: { store: StoreType }) {
  const { state } = store;
  const t = dictionary.ru;
  const activeKeys = state.keys.filter((k) => k.status === "active").length;
  const expiringSoon = state.keys.filter((k) => k.status === "active" && k.expiresAt).length;
  const stats = [
    { key: "totalKeys", icon: Key, value: state.keys.length, color: "text-blue-400" },
    { key: "activeKeys", icon: LayoutDashboard, value: activeKeys, color: "text-green-400" },
    { key: "expiringSoon", icon: Ban, value: expiringSoon, color: "text-amber-400" },
    { key: "totalUsers", icon: Users, value: state.users.length, color: "text-pink-400" },
  ];
  const recentLogs = state.logs.slice(0, 7);
  const productCounts: Record<string, number> = {};
  state.keys.forEach((k) => { productCounts[k.product] = (productCounts[k.product] || 0) + 1; });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t.dashboard}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => { const Icon = s.icon; return (
          <div key={s.key} className="bg-[#111327] border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{t[s.key as keyof typeof t] as string}</span>
              <Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ); })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111327] border border-zinc-800/50 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-800/50"><h2 className="text-lg font-semibold text-white">{t.recentActivity}</h2></div>
          <div className="divide-y divide-zinc-800/30">
            {recentLogs.length === 0 ? <div className="px-5 py-8 text-center text-zinc-500">{t.noData}</div> :
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium accent-text">{log.user}</span>
                    <span className="text-sm text-zinc-400">{log.action}</span>
                  </div>
                  <span className="text-sm text-zinc-500">{log.date.split(" ")[1]}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-[#111327] border border-zinc-800/50 rounded-xl">
          <div className="px-5 py-4 border-b border-zinc-800/50"><h2 className="text-lg font-semibold text-white">{t.keysByProduct}</h2></div>
          <div className="divide-y divide-zinc-800/30">
            {Object.keys(productCounts).length === 0 ? <div className="px-5 py-8 text-center text-zinc-500">{t.noData}</div> :
              Object.entries(productCounts).map(([product, count]) => (
                <div key={product} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-zinc-300">{product}</span>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KeysPage({ store }: { store: StoreType }) {
  const { state, deleteKey, resetHwid, bindHwid, revokeKey, addKey } = store;
  const t = dictionary.ru;
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showGen, setShowGen] = useState(false);
  const [genProd, setGenProd] = useState("");
  const [genDur, setGenDur] = useState("1 день");
  const [genCnt, setGenCnt] = useState(1);
  const [genMaxAct, setGenMaxAct] = useState(-1);
  const [copied, setCopied] = useState<string | null>(null);
  const [bindM, setBindM] = useState<{ id: string; key: string } | null>(null);
  const [hwidIn, setHwidIn] = useState("");
  const [resetC, setResetC] = useState<string | null>(null);

  const filtered = state.keys.filter((k) =>
    k.key.toLowerCase().includes(search.toLowerCase()) || k.product.toLowerCase().includes(search.toLowerCase()) || k.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t.licenseKeys}</h1>
        <button onClick={() => setShowGen(true)} className="flex items-center gap-2 accent-bg accent-bg-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg accent-shadow"><Key className="w-4 h-4" />{t.generate}</button>
      </div>
      {showGen && (
        <div className="bg-[#111327] border border-zinc-800/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">{t.genKeys}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div><label className="block text-sm text-zinc-400 mb-1">{t.product}</label>
              <input type="text" value={genProd} onChange={(e) => setGenProd(e.target.value)} list="plist" placeholder="Введите или выберите" className="w-full px-3 py-2 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" />
              <datalist id="plist">{state.products.map((p) => <option key={p.id} value={p.name} />)}</datalist></div>
            <div><label className="block text-sm text-zinc-400 mb-1">{t.duration}</label>
              <select value={genDur} onChange={(e) => setGenDur(e.target.value)} className="w-full px-3 py-2 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition">
                <option>1 день</option><option>7 дней</option><option>30 дней</option><option>90 дней</option><option>Навсегда</option></select></div>
            <div><label className="block text-sm text-zinc-400 mb-1">{t.count}</label>
              <input type="number" min={1} max={100} value={genCnt} onChange={(e) => setGenCnt(Number(e.target.value))} className="w-full px-3 py-2 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
            <div><label className="block text-sm text-zinc-400 mb-1">Лимит активаций (-1 = ∞)</label>
              <input type="number" min={-1} max={1000} value={genMaxAct} onChange={(e) => setGenMaxAct(Number(e.target.value))} className="w-full px-3 py-2 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
            <div className="flex items-end gap-2">
              <button onClick={() => { if (!genProd.trim()) return; addKey(genProd.trim(), genDur, genCnt, genMaxAct); setShowGen(false); setGenProd(""); setGenCnt(1); setGenMaxAct(-1); }} className="px-4 py-2 accent-bg accent-bg-hover text-white rounded-xl text-sm font-medium transition">{t.generate}</button>
              <button onClick={() => setShowGen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition">{t.cancel}</button></div>
          </div>
        </div>
      )}
      <div className="bg-[#111327] border border-zinc-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800/50">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/30 text-zinc-400 border-b border-zinc-800/50">
              <tr><th className="px-5 py-3 font-medium">{t.key}</th><th className="px-5 py-3 font-medium">{t.product}</th><th className="px-5 py-3 font-medium">{t.status}</th><th className="px-5 py-3 font-medium">{t.duration}</th><th className="px-5 py-3 font-medium">Активации</th><th className="px-5 py-3 font-medium">{t.owner}</th><th className="px-5 py-3 font-medium">HWID</th><th className="px-5 py-3 font-medium w-10"></th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {filtered.length === 0 ? <tr><td colSpan={8} className="px-5 py-8 text-center text-zinc-500">{t.noData}</td></tr> :
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/20 transition">
                  <td className="px-5 py-3 font-mono font-medium accent-text flex items-center gap-2">{item.key}
                    <button onClick={() => { navigator.clipboard.writeText(item.key); setCopied(item.key); setTimeout(() => setCopied(null), 1500); }} className="p-1 text-zinc-500 hover:text-white transition"><Copy className="w-3 h-3" /></button>
                    {copied === item.key && <span className="text-xs text-green-400">✓</span>}</td>
                  <td className="px-5 py-3 text-zinc-300">{item.product}</td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : item.status === "banned" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>{item.status === "active" ? t.active : item.status === "banned" ? t.banned : t.created}</span></td>
                  <td className="px-5 py-3 text-zinc-300">{item.duration}</td>
                  <td className="px-5 py-3 text-zinc-300 font-mono text-xs">{item.maxActivations === -1 ? "∞" : `${item.activationsUsed} / ${item.maxActivations}`}</td>
                  <td className="px-5 py-3 text-zinc-300">{item.owner}</td>
                  <td className="px-5 py-3">{item.hwid ? (
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-green-400 truncate max-w-[120px]" title={item.hwid}>{item.hwid}</span>
                      <button onClick={() => setResetC(item.id)} className="p-1 text-zinc-500 hover:text-amber-400 transition shrink-0"><RotateCcw className="w-3 h-3" /></button></div>
                  ) : (
                    <button onClick={() => { setBindM({ id: item.id, key: item.key }); setHwidIn(""); }} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition"><Fingerprint className="w-3 h-3" />Привязать</button>
                  )}</td>
                  <td className="px-5 py-3 relative">
                    <button onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"><MoreVertical className="w-4 h-4" /></button>
                    {openMenu === item.id && <><div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-5 top-full mt-1 w-48 bg-[#1a1c2e] border border-zinc-700/50 rounded-xl shadow-2xl z-20 py-1">
                        <button onClick={() => { setBindM({ id: item.id, key: item.key }); setHwidIn(""); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/50 transition"><Fingerprint className="w-4 h-4" />Привязать HWID</button>
                        <button onClick={() => { setResetC(item.id); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/50 transition"><RotateCcw className="w-4 h-4" />{t.resetHwid}</button>
                        <button onClick={() => { revokeKey(item.id); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-zinc-800/50 transition"><Ban className="w-4 h-4" />{t.revoke}</button>
                        <button onClick={() => { deleteKey(item.id); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800/50 transition"><Trash2 className="w-4 h-4" />{t.delete}</button>
                      </div></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={!!bindM} onClose={() => { setBindM(null); setHwidIn(""); }} title="Привязка HWID">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-zinc-300 mb-1">Ключ</label><div className="px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl accent-text text-sm font-mono">{bindM?.key}</div></div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">HWID клиента</label>
            <input type="text" value={hwidIn} onChange={(e) => setHwidIn(e.target.value)} placeholder="Введите HWID..." className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[color:var(--accent)]/50 transition font-mono" onKeyDown={(e) => e.key === "Enter" && bindM && hwidIn.trim() && bindHwid(bindM.id, hwidIn.trim())} /></div>
          <div className="flex gap-3">
            <button onClick={() => { if (bindM && hwidIn.trim()) { bindHwid(bindM.id, hwidIn.trim()); setBindM(null); setHwidIn(""); } }} disabled={!hwidIn.trim()} className="flex-1 py-2.5 accent-gradient accent-gradient-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 accent-shadow">Привязать</button>
            <button onClick={() => { setBindM(null); setHwidIn(""); }} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition">{t.cancel}</button></div>
        </div>
      </Modal>
      <Modal open={!!resetC} onClose={() => setResetC(null)} title="Сбросить HWID?">
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">Ключ будет деактивирован. Клиент должен заново привязать HWID.</p>
          <div className="flex gap-3">
            <button onClick={() => { resetHwid(resetC!); setResetC(null); }} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition">Сбросить</button>
            <button onClick={() => setResetC(null)} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition">{t.cancel}</button></div>
        </div>
      </Modal>
    </div>
  );
}

function UsersPage({ store }: { store: StoreType }) {
  const { state, addUser, deleteUser } = store;
  const t = dictionary.ru;
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [nu, setNu] = useState({ username: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const filtered = state.users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t.users}</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 accent-bg accent-bg-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg accent-shadow"><UserPlus className="w-4 h-4" />{t.createUser}</button>
      </div>
      <div className="bg-[#111327] border border-zinc-800/50 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800/50">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-800/30 text-zinc-400 border-b border-zinc-800/50">
            <tr><th className="px-5 py-3 font-medium">{t.user}</th><th className="px-5 py-3 font-medium">{t.role}</th><th className="px-5 py-3 font-medium">{t.lastSeen}</th><th className="px-5 py-3 font-medium w-10"></th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {filtered.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">{t.noData}</td></tr> :
            filtered.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/20 transition">
                <td className="px-5 py-3 text-white font-medium">{u.username}</td>
                <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold accent-light-bg accent-text border accent-border capitalize">{t.roles[u.role]}</span></td>
                <td className="px-5 py-3 text-zinc-500">{u.createdAt?.split(" ")[0] || "-"}</td>
                <td className="px-5 py-3">{u.username !== "admin" && <button onClick={() => deleteUser(u.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(""); }} title={t.createUser}>
        <div className="space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>}
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.user}</label>
            <input type="text" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.password}</label>
            <input type="password" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.role}</label>
            <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition">
              {(["user", "reseller", "admin", "superadmin"] as const).map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}</select></div>
          <button onClick={() => {
            if (!nu.username.trim()) { setError("Введите имя пользователя"); return; }
            if (!nu.password.trim()) { setError("Введите пароль"); return; }
            if (state.users.some((u) => u.username === nu.username)) { setError("Пользователь уже существует"); return; }
            addUser(nu.username, nu.password, nu.role, 0); setNu({ username: "", password: "", role: "user" }); setError(""); setShowCreate(false);
          }} className="w-full py-2.5 accent-gradient accent-gradient-hover text-white font-medium rounded-xl transition-all duration-200 accent-shadow">{t.save}</button>
        </div>
      </Modal>
    </div>
  );
}

function ProductsPage({ store }: { store: StoreType }) {
  const { state, addProduct, deleteProduct } = store;
  const t = dictionary.ru;
  const [showCreate, setShowCreate] = useState(false);
  const [np, setNp] = useState({ name: "", version: "", price: 0 });
  const [error, setError] = useState("");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t.productsPage}</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 accent-bg accent-bg-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg accent-shadow"><Plus className="w-4 h-4" />{t.createUser}</button>
      </div>
      <div className="bg-[#111327] border border-zinc-800/50 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-800/30 text-zinc-400 border-b border-zinc-800/50">
            <tr><th className="px-5 py-3 font-medium">{t.productName}</th><th className="px-5 py-3 font-medium">{t.version}</th><th className="px-5 py-3 font-medium">{t.price}</th><th className="px-5 py-3 font-medium">{t.status}</th><th className="px-5 py-3 font-medium w-20"></th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {state.products.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-500">{t.noData}</td></tr> :
            state.products.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-800/20 transition">
                <td className="px-5 py-3 text-white font-medium">{p.name}</td>
                <td className="px-5 py-3 text-zinc-400">{p.version}</td>
                <td className="px-5 py-3 text-zinc-300">${p.price.toFixed(2)}</td>
                <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{p.active ? t.activeYes : "Нет"}</span></td>
                <td className="px-5 py-3"><button onClick={() => deleteProduct(p.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(""); }} title={t.createUser}>
        <div className="space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>}
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.productName}</label>
            <input type="text" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.version}</label>
            <input type="text" value={np.version} onChange={(e) => setNp({ ...np, version: e.target.value })} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.price}</label>
            <input type="number" step="0.01" min={0} value={np.price} onChange={(e) => setNp({ ...np, price: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <button onClick={() => {
            if (!np.name.trim()) { setError("Введите название"); return; }
            if (!np.version.trim()) { setError("Введите версию"); return; }
            if (np.price <= 0) { setError("Введите цену"); return; }
            addProduct(np.name, np.version, np.price); setNp({ name: "", version: "", price: 0 }); setError(""); setShowCreate(false);
          }} className="w-full py-2.5 accent-gradient accent-gradient-hover text-white font-medium rounded-xl transition-all duration-200 accent-shadow">{t.save}</button>
        </div>
      </Modal>
    </div>
  );
}

function JournalPage({ store }: { store: StoreType }) {
  const { state } = store;
  const t = dictionary.ru;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t.activityLog}</h1>
      <div className="bg-[#111327] border border-zinc-800/50 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-800/30 text-zinc-400 border-b border-zinc-800/50">
            <tr><th className="px-5 py-3 font-medium">{t.date}</th><th className="px-5 py-3 font-medium">{t.user}</th><th className="px-5 py-3 font-medium">{t.action}</th><th className="px-5 py-3 font-medium">{t.ip}</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {state.logs.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">{t.noData}</td></tr> :
            state.logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-800/20 transition">
                <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{log.date}</td>
                <td className="px-5 py-3 font-medium accent-text">{log.user}</td>
                <td className="px-5 py-3"><span className="text-white font-medium">{log.action}</span>{log.detail && <span className="block text-xs text-zinc-500 mt-0.5">{log.detail}</span>}</td>
                <td className="px-5 py-3 text-zinc-500 font-mono text-xs">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPage({ store }: { store: StoreType }) {
  const { changePassword, state, setTheme } = store;
  const t = dictionary.ru;
  const [cp, setCp] = useState("");
  const [np, setNp] = useState("");
  const [cp2, setCp2] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const themes: { name: ThemeName; label: string; color: string }[] = [
    { name: "purple", label: "Фиолетовая", color: "#9333ea" },
    { name: "blue", label: "Синяя", color: "#2563eb" },
    { name: "green", label: "Зелёная", color: "#16a34a" },
    { name: "red", label: "Красная", color: "#dc2626" },
  ];
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">{t.settings}</h1>
      <div className="bg-[#111327] border border-zinc-800/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">{t.changePassword}</h2>
        <p className="text-sm text-zinc-400 mb-5">{t.changePasswordDesc}</p>
        {msg && <div className={`mb-4 text-sm rounded-xl px-4 py-2 ${msg.type === "success" ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"}`}>{msg.text}</div>}
        <div className="space-y-4 max-w-sm">
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.currentPassword}</label>
            <input type="password" value={cp} onChange={(e) => setCp(e.target.value)} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.newPassword}</label>
            <input type="password" value={np} onChange={(e) => setNp(e.target.value)} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">Повторите новый пароль</label>
            <input type="password" value={cp2} onChange={(e) => setCp2(e.target.value)} className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition" /></div>
          <button onClick={() => {
            if (!cp || !np) { setMsg({ type: "error", text: "Заполните все поля" }); return; }
            if (np !== cp2) { setMsg({ type: "error", text: "Пароли не совпадают" }); return; }
            if (np.length < 3) { setMsg({ type: "error", text: "Пароль слишком короткий" }); return; }
            const ok = changePassword(cp, np);
            if (ok) { setMsg({ type: "success", text: "Пароль изменён" }); setCp(""); setNp(""); setCp2(""); }
            else { setMsg({ type: "error", text: "Неверный текущий пароль" }); }
          }} className="px-6 py-2.5 accent-bg accent-bg-hover text-white font-medium rounded-xl text-sm transition shadow-lg accent-shadow">{t.save}</button>
        </div>
      </div>
      <div className="bg-[#111327] border border-zinc-800/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">{t.preferences}</h2>
        <div className="space-y-6 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Цветовая тема</label>
            <div className="grid grid-cols-4 gap-3">
              {themes.map((th) => (
                <button key={th.name} onClick={() => setTheme(th.name)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${state.theme === th.name ? "border-white/30 bg-white/5" : "border-zinc-800/50 hover:border-zinc-700"}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: th.color }}>
                    {state.theme === th.name && <span className="text-white text-sm">✓</span>}
                  </div>
                  <span className="text-xs text-zinc-400">{th.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-medium text-zinc-300 mb-1.5">{t.language}</label>
            <select className="w-full px-4 py-2.5 bg-[#0d0f1a] border border-zinc-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-[color:var(--accent)]/50 transition">
              <option>{t.russian}</option><option>{t.english}</option></select></div>
        </div>
      </div>
    </div>
  );
}
