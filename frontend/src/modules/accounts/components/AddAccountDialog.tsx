import { useState } from "react";
import type { CreateAccountPayload } from "../api";

interface AddAccountDialogProps {
  onSubmit: (payload: CreateAccountPayload) => Promise<void>;
  onClose: () => void;
}

export function AddAccountDialog({ onSubmit, onClose }: AddAccountDialogProps) {
  const [formData, setFormData] = useState<CreateAccountPayload>({
    name: "",
    profile_path: "",
    proxy: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Email аккаунта обязателен");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать аккаунт");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateAccountPayload, value: string) => {
    setFormData((prev: CreateAccountPayload) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-8 w-[500px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">Добавить аккаунт</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email аккаунта <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="example@yandex.ru"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Путь к профилю
              </label>
              <input
                type="text"
                value={formData.profile_path ?? ""}
                onChange={(e) => handleChange("profile_path", e.target.value)}
                placeholder="C:\AI\yandex\.profiles\account1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Путь к папке с профилем браузера для этого аккаунта
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Прокси
              </label>
              <input
                type="text"
                value={formData.proxy ?? ""}
                onChange={(e) => handleChange("proxy", e.target.value)}
                placeholder="host:port или http://user:pass@host:port"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Формат: host:port или http://user:pass@host:port
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заметки
              </label>
              <textarea
                value={formData.notes ?? ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Дополнительная информация об аккаунте"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={submitting || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Создание..." : "Создать аккаунт"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
