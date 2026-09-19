interface AlertProps {
  type?: "error" | "success" | "info";
  message: string | null;
}

export default function Alert({ type = "error", message }: AlertProps) {
  if (!message) return null;
  return <div className={`alert alert-${type}`}>{message}</div>;
}
