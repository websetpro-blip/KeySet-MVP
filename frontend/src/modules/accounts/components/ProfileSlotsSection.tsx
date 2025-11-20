import { useEffect, useState, useRef, ChangeEvent } from "react";

interface ProfileSlot {
  id: number;
  name: string;
  profile_path: string;
  cookies_file: string | null;
  profile_size: number;
  cookies_count: number;
  last_updated: string | null;
  is_active: boolean;
  notes: string | null;
}

interface Props {
  accountId: number;
  profilePath?: string;
  onUpdated?: () => void;
}

export function ProfileSlotsSection({ accountId, profilePath, onUpdated }: Props) {
  const [slots, setSlots] = useState<ProfileSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("default");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importTargetRef = useRef<number | null>(null);

  const loadSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${accountId}/slots`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (e) {
      setError("Не удалось загрузить слоты");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [accountId]);

  const refresh = async () => {
    await loadSlots();
    onUpdated?.();
  };

  const handleActivate = async (slotId: number) => {
    try {
      await fetch(`/api/accounts/${accountId}/slots/${slotId}/activate`, { method: "POST" });
      await refresh();
    } catch (e) {
      setError("Ошибка активации слота");
    }
  };

  const handleExport = async (slotId: number) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/slots/${slotId}/cookies/export`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slot_${slotId}_cookies.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Ошибка экспорта cookies");
    }
  };

  const handleImportClick = (slotId: number) => {
    importTargetRef.current = slotId;
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || importTargetRef.current === null) return;
    const slotId = importTargetRef.current;
    importTargetRef.current = null;
    const form = new FormData();
    form.append("file", file);
    try {
      await fetch(`/api/accounts/${accountId}/slots/${slotId}/cookies/import`, {
        method: "POST",
        body: form,
      });
      await refresh();
    } catch (e) {
      setError("Ошибка импорта cookies");
    }
  };

  const handleDelete = async (slotId: number) => {
    if (!window.confirm("Удалить слот и его данные?")) return;
    try {
      await fetch(`/api/accounts/${accountId}/slots/${slotId}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError("Ошибка удаления слота");
    }
  };

  const handleCreateSlot = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await fetch(`/api/accounts/${accountId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), is_active: slots.length === 0 }),
      });
      setNewName("default");
      await refresh();
    } catch (e) {
      setError("Не удалось создать слот");
    } finally {
      setCreating(false);
    }
  };

  const handleConvertLegacy = async () => {
    setCreating(true);
    setError(null);
    try {
      await fetch(`/api/accounts/${accountId}/slots/convert-legacy`, { method: "POST" });
      await refresh();
    } catch (e) {
      setError("Не удалось конвертировать профиль");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="profile-slots-card">
      <div className="section-header">
        <h3>
          <i className="fas fa-id-card" /> Профили браузера
        </h3>
        <div className="slot-actions-inline">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Имя слота"
          />
          <button className="btn btn-primary btn-small" onClick={handleCreateSlot} disabled={creating}>
            {creating ? "Создание..." : "Новый слот"}
          </button>
        </div>
      </div>

      {profilePath && slots.length === 0 && (
        <div className="info-section compact" style={{ marginBottom: 8 }}>
          <div className="info-item">
            <span className="info-label">Legacy профиль:</span>
            <span className="info-value">{profilePath}</span>
          </div>
          <button className="btn btn-secondary btn-small" onClick={handleConvertLegacy} disabled={creating}>
            Конвертировать в слот
          </button>
        </div>
      )}

      {error && (
        <p className="action-hint" style={{ color: "#b91c1c" }}>
          <i className="fas fa-exclamation-circle" /> {error}
        </p>
      )}
      {loading ? (
        <p>Загрузка слотов…</p>
      ) : slots.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Слотов нет. Создайте первый.</p>
      ) : (
        <div className="slots-list">
          {slots.map((slot) => (
            <div key={slot.id} className={`slot-card ${slot.is_active ? "active" : ""}`}>
              <div className="slot-header">
                <div>
                  <div className="slot-title">
                    {slot.name} {slot.is_active ? "✓" : ""}
                  </div>
                  <div className="slot-meta">
                    {slot.profile_path} · {slot.cookies_count} cookies ·{" "}
                    {slot.last_updated ? new Date(slot.last_updated).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="slot-buttons">
                  {!slot.is_active && (
                    <button className="btn btn-secondary btn-small" onClick={() => handleActivate(slot.id)}>
                      Активировать
                    </button>
                  )}
                  <button className="btn btn-secondary btn-small" onClick={() => handleExport(slot.id)}>
                    Экспорт
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={() => handleImportClick(slot.id)}>
                    Импорт
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => handleDelete(slot.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />
    </div>
  );
}
