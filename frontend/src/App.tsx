import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CompaniesPage from "./pages/CompaniesPage";
import FilialsPage from "./pages/FilialsPage";
import SourcesPage from "./pages/SourcesPage";
import CredentialsPage from "./pages/CredentialsPage";
import ReviewsPage from "./pages/ReviewsPage";
import TelegramPage from "./pages/TelegramPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/companies" replace />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/filials" element={<FilialsPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/credentials" element={<CredentialsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/telegram" element={<TelegramPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
