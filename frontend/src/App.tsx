import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import AccountsModule from "./modules/accounts";
import MasksModule from "./modules/masks";
import DataModule from "./modules/data";
import AnalyticsModule from "./modules/analytics";

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/accounts" replace />} />
        <Route path="/accounts" element={<AccountsModule />} />
        <Route path="/masks" element={<MasksModule />} />
        <Route path="/data/*" element={<DataModule />} />
        <Route path="/analytics/*" element={<AnalyticsModule />} />
      </Routes>
    </AppLayout>
  );
}
