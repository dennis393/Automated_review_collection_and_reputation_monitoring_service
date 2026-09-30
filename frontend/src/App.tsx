import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import EntryStatusPage from "./pages/EntryStatusPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import FilialsPage from "./pages/FilialsPage";
import CredentialsPage from "./pages/CredentialsPage";
import ReviewsPage from "./pages/ReviewsPage";
import "./App.css";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/filials" element={<FilialsPage />} />
        <Route path="/credentials" element={<CredentialsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Вся навигация теперь подчинена состоянию входа через Telegram — отдельных
// публичных роутов вроде /login больше нет, попасть в приложение можно
// только с валидным initData
function AuthGate() {
  const { status } = useAuth();

  switch (status) {
    case "loading":
      return <EntryStatusPage kind="loading" />;
    case "outside-telegram":
      return <EntryStatusPage kind="outside-telegram" />;
    case "error":
      return <EntryStatusPage kind="error" />;
    case "needs-onboarding":
      return <OnboardingPage />;
    case "ready":
      return <AppRoutes />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
