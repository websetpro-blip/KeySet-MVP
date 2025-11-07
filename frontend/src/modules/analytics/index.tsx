import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";

export default function AnalyticsModule() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
