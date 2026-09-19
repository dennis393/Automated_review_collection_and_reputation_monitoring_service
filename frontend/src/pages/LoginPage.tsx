import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import { Component as SignInCard } from "@/components/ui/sign-in-card-2";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(email: string, password: string) {
    setError(null);
    try {
      await login(email, password);
      navigate("/companies");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return <SignInCard onSubmit={handleSubmit} error={error} signUpHref="/register" />;
}
