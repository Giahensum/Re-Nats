import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './app/AuthContext.jsx'
import ReactGA from 'react-ga4'

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (measurementId) {
  ReactGA.initialize(measurementId);
} else {
  console.warn("GA4 Measurement ID is missing in .env file");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
