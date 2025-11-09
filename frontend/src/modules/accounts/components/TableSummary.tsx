interface TableSummaryProps {
  filtered: number;
  total: number;
}

export function TableSummary({ filtered, total }: TableSummaryProps) {
  return (
    <div className="table-summary">
      <div>
        Найдено <strong>{filtered}</strong> из {total}
      </div>
    </div>
  );
}
