"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, setToken } from "./lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const { token } = await login(email, password);
      setToken(token);
      router.push("/eventos");
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Glow roxo difuso atrás do card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 animate-glow"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124,58,237,0.35), transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div
          className="rounded-2xl p-8 shadow-2xl backdrop-blur-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            backgroundImage:
              "linear-gradient(var(--bg-card), var(--bg-card)), linear-gradient(135deg, rgba(167,139,250,0.5), rgba(124,58,237,0.1) 40%, transparent)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
        >
          {/* Logo / Título */}
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                boxShadow: "0 10px 30px rgba(124,58,237,0.45)",
              }}
            >
              🎟
            </div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Ticket<span style={{ color: "var(--accent-light)" }}>App</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Seus eventos favoritos a um clique
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo e-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                E-mail
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-lg py-3 pl-11 pr-4 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.25)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Campo senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Senha
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg py-3 pl-11 pr-4 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.25)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <p
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  backgroundColor: "rgba(248,113,113,0.1)",
                  color: "var(--error)",
                  border: "1px solid rgba(248,113,113,0.3)",
                }}
              >
                {erro}
              </p>
            )}

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.35)";
              }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          {/* Link para cadastro */}
          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="font-medium transition hover:underline"
              style={{ color: "var(--accent-light)" }}
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
