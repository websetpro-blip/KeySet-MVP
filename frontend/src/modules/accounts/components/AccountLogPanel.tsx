import { useEffect, useMemo, useRef } from "react";
import type { Account } from "../types";
import { formatCombinedAccountLog } from "../utils";

interface AccountLogPanelProps {
  accounts: Account[];
  extraLogs?: string[];
}

export function AccountLogPanel({ accounts, extraLogs = [] }: AccountLogPanelProps) {
  const bodyRef = useRef<HTMLPreElement | null>(null);
  const content = useMemo(() => {
    const base = formatCombinedAccountLog(accounts);
    if (!extraLogs.length) return base;
    const lines = [...(base ? [base, ""] : []), "=== Клиентские события ===", ...extraLogs];
    return lines.join("\n");
  }, [accounts, extraLogs]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <div className="account-log-panel">
      <pre ref={bodyRef} className="account-log-body" tabIndex={0}>
        {content ||
          "Журнал пуст. Выполните действия с аккаунтами, чтобы появились записи."}
      </pre>
    </div>
  );
}

