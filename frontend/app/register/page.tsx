"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      await register(name, email, password);
      setSucesso(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Título */}
        <div className="mb-8 text-center">
          <span
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--accent-light)" }}
          >
            🎟 TicketApp
          </span>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Crie sua conta gratuitamente
          </p>
        </div>

        {sucesso ? (
          /* Feedback de sucesso */
          <div
            className="rounded-lg px-4 py-5 text-center text-sm font-medium"
            style={{
              backgroundColor: "rgba(52,211,153,0.1)",
              color: "var(--success)",
              border: "1px solid rgba(52,211,153,0.3)",
            }}
          >
            Conta criada com sucesso! Redirecionando para o login…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo nome */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

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
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
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
                backgroundColor: "var(--accent)",
                color: "#fff",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
              }}
            >
              {loading ? "Criando conta…" : "Criar conta"}
            </button>
          </form>
        )}

        {/* Link para login */}
        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Já tem uma conta?{" "}
          <Link
            href="/"
            className="font-medium transition hover:underline"
            style={{ color: "var(--accent-light)" }}
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
