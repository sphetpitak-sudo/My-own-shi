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
  const supabase = createClient();

  const loadSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) { window.location.href = "/dashboard"; return; }

    const { data } = await supabase.from("admin_settings").select("key, value");

    const map: Record<string, ReadingCosts | { amount: number } | { enabled: boolean }> = {};
    data?.forEach((row: { key: string; value: ReadingCosts | { amount: number } | { enabled: boolean } }) => {
      map[row.key] = row.value;
    });

    setSettings({
      reading_costs: (map.reading_costs as ReadingCosts) || { single: 5, three_card: 15, celtic: 50 },
      daily_bonus: (map.daily_bonus as { amount: number }) || { amount: 10 },
      referral_bonus: (map.referral_bonus as { amount: number }) || { amount: 20 },
      maintenance_mode: (map.maintenance_mode as { enabled: boolean }) || { enabled: false },
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);

    const updates = [
      { key: "reading_costs", value: settings.reading_costs },
      { key: "daily_bonus", value: settings.daily_bonus },
      { key: "referral_bonus", value: settings.referral_bonus },
      { key: "maintenance_mode", value: settings.maintenance_mode },
    ];

    for (const u of updates) {
      await supabase.from("admin_settings").upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !settings) return <LoadingSkeleton variant="stats" />;

  return (
    <div className="tab-content">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Configure platform settings</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          <Save size={15} />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <h2 className="sec-title mb-4">Reading Costs</h2>
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
                    reading_costs: { ...settings.reading_costs, [spread]: parseInt(e.target.value) || 0 }
                  })}
                  className="input"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="sec-title mb-4">Bonuses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">Daily Bonus Amount</label>
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
              <label className="label">Referral Bonus Amount</label>
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
                <div className="text-[14px] font-semibold">Maintenance Mode</div>
                <div className="text-[12px] text-muted">
                  {settings.maintenance_mode.enabled ? "Site is in maintenance mode" : "Site is live"}
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
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
