import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import { SignUpCard } from "@/components/ui/sign-up-card";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(fullName: string, email: string, password: string) {
    setError(null);
    try {
      await registerUser({ email, password, full_name: fullName });
      await login(email, password);
      navigate("/companies");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return <SignUpCard onSubmit={handleSubmit} error={error} signInHref="/login" />;
}
