import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { Analytics } from './components/Analytics'
import { Recommendations } from './components/Recommendations'
import { Settings } from './components/Settings'
import { Navigation } from './components/Navigation'
import { OAuthCallback } from './components/OAuthCallback'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route path="/callback" element={<OAuthCallback />} />
          <Route path="*" element={
            <>
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
