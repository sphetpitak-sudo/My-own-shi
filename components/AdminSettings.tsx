"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, AlertTriangle } from "lucide-react";
import LoadingSkeleton from "./LoadingSkeleton";

interface ReadingCosts {
  single: number;
  three_card: number;
  celtic: number;
}

interface SettingsData {
  reading_costs: ReadingCosts;
  daily_bonus: { amount: number };
  referral_bonus: { amount: number };
  maintenance_mode: { enabled: boolean };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) { window.location.href = "/dashboard"; return; }

    const { data } = await supabase.from("admin_settings").select("key, value");

    const map: Record<string, ReadingCosts | { amount: number } | { enabled: boolean }> = {};
    data?.forEach((row: { key: string; value: Record<string, unknown> }) => {
      map[row.key] = row.value as ReadingCosts | { amount: number } | { enabled: boolean };
    });

    setSettings({
      reading_costs: (map.reading_costs as ReadingCosts) || { single: 5, three_card: 15, celtic: 50 },
      daily_bonus: (map.daily_bonus as { amount: number }) || { amount: 10 },
      referral_bonus: (map.referral_bonus as { amount: number }) || { amount: 20 },
      maintenance_mode: (map.maintenance_mode as { enabled: boolean }) || { enabled: false },
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const updates = [
      { key: "reading_costs", value: settings.reading_costs },
      { key: "daily_bonus", value: settings.daily_bonus },
      { key: "referral_bonus", value: settings.referral_bonus },
      { key: "maintenance_mode", value: settings.maintenance_mode },
    ];

    let hasError = false;
    for (const u of updates) {
      // Try update first, insert if no rows affected
      const { error: updateErr } = await supabase
        .from("admin_settings")
        .update({ value: u.value, updated_at: new Date().toISOString() })
        .eq("key", u.key);

      if (updateErr) {
        // Fallback to upsert if update fails
        const { error: upsertErr } = await supabase
          .from("admin_settings")
          .upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() });

        if (upsertErr) {
          hasError = true;
          break;
        }
      }
    }

    setSaving(false);
    if (hasError) {
      setError("ไม่สามารถบันทึกได้ กรุณาลองใหม่");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (loading || !settings) return <LoadingSkeleton variant="stats" />;

  return (
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="page-header mb-6">
            <div>
              <h1 className="page-title">ตั้งค่า</h1>
              <p className="page-sub">ตั้งค่าแพลตฟอร์ม</p>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Save size={15} />
              {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว!" : "บันทึก"}
            </button>
          </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl text-[13px] font-medium"
            style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid rgba(194, 65, 48, 0.1)" }}>
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="sec-title">ค่าทำนาย</h2>
              <span className="badge badge-neutral">แต้ม</span>
            </div>
            <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>กำหนดแต้มที่ใช้ต่อการอ่านแต่ละรูปแบบ — 0 = ฟรี</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["single", "three_card", "celtic"] as const).map((spread) => (
                <div key={spread} className="field">
                  <label className="label capitalize">{spread.replace("_", " ")}</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.reading_costs[spread]}
                    onChange={(e) => setSettings({
                      ...settings,
                      reading_costs: { ...settings.reading_costs, [spread]: Math.max(0, parseInt(e.target.value) || 0) }
                    })}
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="sec-title mb-4">โบนัส</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label className="label">โบนัสรายวัน</label>
                <input
                  type="number"
                  min={0}
                  value={settings.daily_bonus.amount}
                  onChange={(e) => setSettings({
                    ...settings,
                    daily_bonus: { amount: parseInt(e.target.value) || 0 }
                  })}
                  className="input"
                />
              </div>
              <div className="field">
                <label className="label">โบนัสแนะนำเพื่อน</label>
                <input
                  type="number"
                  min={0}
                  value={settings.referral_bonus.amount}
                  onChange={(e) => setSettings({
                    ...settings,
                    referral_bonus: { amount: parseInt(e.target.value) || 0 }
                  })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="stat-icon" style={{ background: settings.maintenance_mode.enabled ? "var(--red-soft)" : "var(--green-soft)" }}>
                  <AlertTriangle size={18} style={{ color: settings.maintenance_mode.enabled ? "var(--red)" : "var(--green)" }} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold">โหมดปิดปรับปรุง</div>
                  <div className="text-[12px] text-muted">
                    {settings.maintenance_mode.enabled ? "เว็บไซต์อยู่ในโหมดปิดปรับปรุง" : "เว็บไซต์ทำงานปกติ"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  maintenance_mode: { enabled: !settings.maintenance_mode.enabled }
                })}
                className={`cb ${settings.maintenance_mode.enabled ? "on" : ""}`}
              >
                {settings.maintenance_mode.enabled && <CheckIcon size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
