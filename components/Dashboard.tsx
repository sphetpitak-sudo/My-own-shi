"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Assignment, Subject } from "@/lib/types";
import { ToastProvider, useToast } from "./Toast";
import StudyDashboard from "./StudyDashboard";
import StudyStreaks from "./StudyStreaks";
import PomodoroTimer from "./PomodoroTimer";
import AssignmentTemplates from "./AssignmentTemplates";
import StudyCharts from "./StudyCharts";
import ExportCSV from "./ExportCSV";
import SubjectForm from "./SubjectForm";
import SubjectList from "./SubjectList";
import AssignmentForm from "./AssignmentForm";
import AssignmentList from "./AssignmentList";
import CalendarView from "./CalendarView";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import Settings from "./Settings";
import {
  LayoutDashboard, BookOpen, ListTodo, LogOut, Menu, X,
  Wallet, Plus, Settings as SettingsIcon, Calendar,
} from "lucide-react";

type Tab = "overview" | "subjects" | "tasks" | "calendar" | "settings";

function Shell() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; color: string } | null>(null);
  const [templateData, setTemplateData] = useState<{ title: string; description: string; priority: "low" | "medium" | "high"; estimatedMinutes: number } | null>(null);

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setUserEmail(user.email || "");
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setAvatarUrl(user.user_metadata?.avatar_url || "");
    }
    return user;
  }, [supabase]);

  const fetchSubjects = useCallback(async () => {
    const user = await fetchUser();
    if (!user) return;
    const { data } = await supabase.from("subjects").select("*").eq("user_id", user.id).order("sort_order");
    setSubjects(data || []);
    setLoading(false);
  }, [supabase, fetchUser]);

  const fetchAssignments = useCallback(async () => {
    const user = await fetchUser();
    if (!user) return;
    const { data } = await supabase.from("assignments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setAssignments(data || []);
    setLoading(false);
  }, [supabase, fetchUser]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchSubjects(), fetchAssignments()]);
  }, [fetchSubjects, fetchAssignments]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel("realtime-studyhub")
      .on("postgres_changes", { event: "*", schema: "public", table: "subjects", filter: `user_id=eq.${userId}` }, () => fetchSubjects())
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `user_id=eq.${userId}` }, () => fetchAssignments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId, fetchSubjects, fetchAssignments]);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  const seedDefaultSubjects = async () => {
    const user = await fetchUser();
    if (!user) return;
    const defaults = [
      { name: lang === "th" ? "คณิตศาสตร์" : "Mathematics", color: "#4F7CFF" },
      { name: lang === "th" ? "วิทยาศาสตร์" : "Science", color: "#22C55E" },
      { name: lang === "th" ? "ภาษาอังกฤษ" : "English", color: "#F59E0B" },
      { name: lang === "th" ? "ภาษาไทย" : "Thai", color: "#EF4444" },
      { name: lang === "th" ? "สังคมศึกษา" : "Social Studies", color: "#A855F7" },
    ];
    for (const d of defaults) {
      await supabase.from("subjects").insert({ user_id: user.id, name: d.name, color: d.color, icon: "BookOpen", is_default: true });
    }
    fetchSubjects();
  };

  const NAV: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "overview", label: t.overview, icon: LayoutDashboard },
    { key: "subjects", label: t.subjects, icon: BookOpen },
    { key: "tasks", label: t.tasks, icon: ListTodo },
    { key: "calendar", label: t.calendar, icon: Calendar },
    { key: "settings", label: t.settings, icon: SettingsIcon },
  ];

  const titles: Record<Tab, { title: string; sub: string }> = {
    overview: { title: t.overview, sub: t.overview_sub },
    subjects: { title: t.subjects, sub: t.subjects_sub },
    tasks: { title: t.tasks, sub: t.tasks_sub },
    calendar: { title: t.calendar, sub: t.calendar_sub },
    settings: { title: t.settings, sub: t.settings_sub },
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-[10px] object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[14px] font-bold"
              style={{ background: "var(--primary)", color: "var(--text-invert)" }}>
              {displayName ? displayName.charAt(0).toUpperCase() : <Wallet size={16} />}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-bold text-white tracking-tight truncate">{displayName || "User"}</span>
            <span className="text-[11px] truncate" style={{ color: "#8a867d" }}>{userEmail}</span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: "#8a867d" }}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-label">{lang === "th" ? "เมนู" : "Menu"}</div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${tab === key ? "active" : ""}`}
              onClick={() => { setTab(key); setSidebarOpen(false); }}>
              <span className="nav-icon"><Icon size={17} /></span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={17} /></span>
            {t.logout}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="overlay lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="main-area">
        {/* Topbar */}
        <header className="sticky top-0 z-40 backdrop-blur-md"
          style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 px-4 lg:px-10 py-3">
            <button className="btn-icon lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="flex-1" />
            <LangToggle />
            <ThemeToggle />
            {tab !== "settings" && (
              <button className="btn btn-primary !py-2 !px-3.5 !text-[13px]"
                onClick={() => {
                  if (tab === "subjects") {
                    document.getElementById("subject-form")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    setTab("tasks");
                    setTimeout(() => document.getElementById("assignment-form")?.scrollIntoView({ behavior: "smooth" }), 80);
                  }
                }}>
                <Plus size={15} />
                <span className="hidden sm:inline">{t.add}</span>
              </button>
            )}
          </div>
        </header>

        <main className="content">
          {/* Page header */}
          <div className="page-header mb-6 animate-in">
            <div>
              <h1 className="page-title">{titles[tab].title}</h1>
              <p className="page-sub">{titles[tab].sub}</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="stat-card">
                    <div className="shimmer w-9 h-9 rounded-[10px] mb-3" />
                    <div className="shimmer h-3 w-16 mb-2" />
                    <div className="shimmer h-6 w-12" />
                  </div>
                ))}
              </div>
              <div className="card p-4"><div className="shimmer h-4 w-32 mb-3" /><div className="shimmer h-10 w-full mb-2" /><div className="shimmer h-10 w-full mb-2" /><div className="shimmer h-10 w-full" /></div>
            </div>
          ) : (
            <>
              {tab === "overview" && (
                <div className="tab-content space-y-4">
                  <StudyDashboard assignments={assignments} subjects={subjects} />
                  <StudyCharts assignments={assignments} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StudyStreaks assignments={assignments} />
                    <PomodoroTimer />
                  </div>
                  <AssignmentTemplates onSelect={(tpl) => {
                    setTemplateData(tpl);
                    setTab("tasks");
                    setTimeout(() => document.getElementById("assignment-form")?.scrollIntoView({ behavior: "smooth" }), 80);
                  }} />
                </div>
              )}

              {tab === "subjects" && (
                <div className="mt-5 space-y-4 tab-content">
                  {subjects.length === 0 && (
                    <div className="card p-4 text-center">
                      <p className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>
                        {lang === "th" ? "ยังไม่มีวิชา — เพิ่มวิชาหรือใช้ค่าเริ่มต้น" : "No subjects yet — add your own or use defaults"}
                      </p>
                      <button onClick={seedDefaultSubjects} className="btn btn-ghost !text-[12px]">
                        {lang === "th" ? "เพิ่มวิชาพื้นฐาน" : "Add default subjects"}
                      </button>
                    </div>
                  )}
                  <div id="subject-form">
                    <SubjectForm onSaved={() => { fetchSubjects(); toast(lang === "th" ? "บันทึกวิชาสำเร็จ" : "Subject saved", "success"); }}
                      editing={editingSubject} onCancelEdit={() => setEditingSubject(null)} />
                  </div>
                  <SubjectList subjects={subjects} onEdit={(s) => setEditingSubject({ id: s.id, name: s.name, color: s.color })} onDeleted={() => { fetchSubjects(); toast(lang === "th" ? "ลบวิชาแล้ว" : "Subject deleted", "success"); }} />
                </div>
              )}

              {tab === "tasks" && (
                <div className="mt-5 space-y-4 tab-content">
                  <div className="flex items-center justify-between">
                    <div id="assignment-form" className="flex-1">
                      <AssignmentForm subjects={subjects} onSaved={() => { fetchAssignments(); setTemplateData(null); toast(editingAssignment ? t.assignment_updated : t.assignment_created, "success"); }}
                        editing={editingAssignment} onCancelEdit={() => { setEditingAssignment(null); setTemplateData(null); }}
                        template={templateData} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <ExportCSV assignments={assignments} subjects={subjects} />
                  </div>
                  <AssignmentList assignments={assignments} subjects={subjects}
                    onEdit={setEditingAssignment}
                    onDeleted={() => { fetchAssignments(); toast(t.assignment_deleted, "success"); }}
                    onStatusChange={fetchAssignments} />
                </div>
              )}

              {tab === "calendar" && (
                <div className="mt-5 tab-content">
                  <CalendarView assignments={assignments} subjects={subjects} />
                </div>
              )}

              {tab === "settings" && (
                <div className="mt-5 tab-content">
                  <Settings />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`bottom-nav-item ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            <span className="nav-icon"><Icon size={19} /></span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
