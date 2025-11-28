"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/db";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type AuthStep = "email" | "code" | "sending";

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStep("sending");
    setError(null);

    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setSentTo(email.trim());
      setStep("code");
    } catch (err) {
      console.error("Send code error:", err);
      setError("Error al enviar el código. Intenta de nuevo.");
      setStep("email");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !sentTo) return;

    setError(null);

    try {
      await db.auth.signInWithMagicCode({ email: sentTo, code: code.trim() });
      onSuccess();
    } catch (err) {
      console.error("Verify code error:", err);
      setError("Código incorrecto o expirado. Intenta de nuevo.");
    }
  };

  const handleResend = async () => {
    if (!sentTo) return;
    setStep("sending");
    setError(null);

    try {
      await db.auth.sendMagicCode({ email: sentTo });
      setStep("code");
      setCode("");
    } catch (err) {
      console.error("Resend error:", err);
      setError("Error al reenviar. Intenta de nuevo.");
      setStep("code");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {step === "code" ? "Ingresa el código" : "Iniciar sesión"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Step */}
        {step === "email" && (
          <form onSubmit={handleSendCode}>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Te enviaremos un código a tu correo para iniciar sesión.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              required
            />
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Enviar código
            </button>
          </form>
        )}

        {/* Sending Step */}
        {step === "sending" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Enviando código...</p>
          </div>
        )}

        {/* Code Verification Step */}
        {step === "code" && (
          <form onSubmit={handleVerifyCode}>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Enviamos un código a <strong>{sentTo}</strong>
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de 6 dígitos"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-center text-2xl tracking-widest"
              autoFocus
              maxLength={6}
              required
            />
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors mb-3"
            >
              Verificar
            </button>
            <button
              type="button"
              onClick={handleResend}
              className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200"
            >
              Reenviar código
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200"
            >
              Cambiar correo
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
