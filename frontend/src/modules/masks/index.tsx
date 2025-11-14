import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";

export default function MasksModuleWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
