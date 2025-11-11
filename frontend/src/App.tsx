import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";

const AccountsModule = lazy(() => import("./modules/accounts"));
const MasksModule = lazy(() => import("./modules/masks"));
const DataModule = lazy(() => import("./modules/data"));
const AnalyticsModule = lazy(() => import("./modules/analytics"));

const RouteFallback = () => (
  <div className="app-route-fallback">
    <span>Загрузка…</span>
  </div>
);

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/accounts" replace />} />
        <Route
          path="/accounts"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AccountsModule />
            </Suspense>
          }
        />
        <Route
          path="/masks"
          element={
            <Suspense fallback={<RouteFallback />}>
              <MasksModule />
            </Suspense>
          }
        />
        <Route
          path="/data/*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <DataModule />
            </Suspense>
          }
        />
        <Route
          path="/analytics/*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AnalyticsModule />
            </Suspense>
          }
        />
      </Routes>
    </AppLayout>
  );
}
