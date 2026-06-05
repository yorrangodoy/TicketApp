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
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-base)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Logo / Título */}
        <div className="mb-8 text-center">
          <span
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--accent-light)" }}
          >
            🎟 TicketApp
          </span>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Acesse sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo e-mail */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2"
              style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                // @ts-expect-error custom prop
                "--tw-ring-color": "var(--accent)",
              }}
            />
          </div>

          {/* Campo senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2"
              style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            />
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
            className="w-full rounded-lg py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading ? "var(--accent-hover)" : "var(--accent)",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
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
  );
}
