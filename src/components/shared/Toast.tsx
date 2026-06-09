"use client";
import { Toaster } from "react-hot-toast";

const BASE: React.CSSProperties = {
  background: "white",
  color: "#1f2937",
  fontWeight: "600",
  fontSize: "14px",
  lineHeight: "1.25",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.12), 0 4px 10px -5px rgb(0 0 0 / 0.08)",
  padding: "12px 16px",
  minWidth: "300px",
  maxWidth: "480px",
};

export function ToastContainer() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ top: 8 }}
      toastOptions={{
        duration: 5000,
        style: BASE,
        success: {
          iconTheme: { primary: "#0d9488", secondary: "white" },
          style: { ...BASE, borderLeft: "4px solid #0d9488" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "white" },
          style: { ...BASE, borderLeft: "4px solid #ef4444" },
        },
      }}
    />
  );
}
