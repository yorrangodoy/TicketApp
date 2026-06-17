"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getEvents,
  getToken,
  removeToken,
  getRoleFromToken,
  createEvent,
  deleteEvent,
  getLogs,
  type Evento,
  type LogEntry,
} from "../lib/api";

/* Formata preço em reais */
function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* Formata data ISO para exibição amigável */
function formatarData(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Helpers puramente visuais ──────────────────────────────── */

/* Gradientes para a "capa" de cada card (não temos imagens reais) */
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
  "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #0891b2 0%, #2563eb 100%)",
  "linear-gradient(135deg, #db2777 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
  "linear-gradient(135deg, #4f46e5 0%, #a78bfa 100%)",
];

/* Iniciais do evento para exibir sobre a faixa gradiente */
function getIniciais(titulo: string): string {
  const palavras = titulo.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return "🎫";
  const letras = palavras.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letras.join("");
}

/* Estilo do badge de disponibilidade conforme a quantidade de ingressos */
function estiloDisponibilidade(qtd: number): { bg: string; color: string; label: string } {
  if (qtd <= 0) {
    return {
      bg: "rgba(248,113,113,0.15)",
      color: "var(--error)",
      label: "Esgotado",
    };
  }
  if (qtd <= 10) {
    return {
      bg: "rgba(245,158,11,0.15)",
      color: "#f59e0b",
      label: `${qtd} restante${qtd !== 1 ? "s" : ""}`,
    };
  }
  return {
    bg: "rgba(52,211,153,0.15)",
    color: "var(--success)",
    label: `${qtd} disponíveis`,
  };
}

export default function EventosPage() {
  const router = useRouter();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const isAdmin = getRoleFromToken() === "admin";
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const [formErro, setFormErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    total_tickets: 100,
    price: 0,
  });

  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs]   = useState(false);

  useEffect(() => {
    /* Redireciona para login se não houver token */
    if (!getToken()) {
      router.replace("/");
      return;
    }

    getEvents()
      .then(setEventos)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Erro ao carregar eventos";
        /* Token expirado ou inválido → volta ao login */
        if (msg.toLowerCase().includes("401") || msg.toLowerCase().includes("autoriza")) {
          removeToken();
          router.replace("/");
        } else {
          setErro(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    removeToken();
    router.replace("/");
  }

  async function handleCriarEvento(e: FormEvent) {
    e.preventDefault();
    setFormErro(null);
    setCriando(true);
    try {
      await createEvent({
        ...form,
        total_tickets: Number(form.total_tickets),
        price: Number(form.price),
      });
      setShowModal(false);
      setForm({ title: "", description: "", date: "", venue: "", total_tickets: 100, price: 0 });
      const lista = await getEvents();
      setEventos(lista);
    } catch (err: unknown) {
      setFormErro(err instanceof Error ? err.message : "Erro ao criar evento");
    } finally {
      setCriando(false);
    }
  }

  async function handleDeletar(id: number) {
    if (!confirm("Deletar este evento?")) return;
    setDeleting(id);
    try {
      await deleteEvent(id);
      setEventos((prev) => prev.filter((e) => e.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao deletar");
    } finally {
      setDeleting(null);
    }
  }

  async function handleCarregarLogs() {
    setLoadingLogs(true);
    try {
      const data = await getLogs();
      setLogs(data);
      setShowLogs(true);
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{
          backgroundColor: "rgba(20,20,31,0.75)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                boxShadow: "0 6px 18px rgba(124,58,237,0.45)",
              }}
            >
              🎟
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Ticket<span style={{ color: "var(--accent-light)" }}>App</span>
            </span>
            {isAdmin && (
              <span
                className="rounded-full px-3 py-1 text-xs font-bold tracking-wide"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                  color: "#fff",
                }}
              >
                ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={handleCarregarLogs}
                disabled={loadingLogs}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(124,58,237,0.15)',
                  color: 'var(--accent-light)',
                  border: '1px solid rgba(124,58,237,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!loadingLogs) e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.28)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.15)";
                }}
              >
                {loadingLogs ? 'Carregando...' : '📋 Logs'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--error)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--error)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <section className="mb-12 text-center animate-fade-in-up">
          <span
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide"
            style={{
              backgroundColor: "rgba(124,58,237,0.12)",
              color: "var(--accent-light)",
              border: "1px solid rgba(124,58,237,0.25)",
            }}
          >
            ✦ Plataforma de ingressos
          </span>
          <h1
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Descubra os melhores{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              eventos
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: "var(--text-muted)" }}>
            Shows, conferências e experiências únicas. Garanta seu ingresso em poucos cliques.
          </p>

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.35)";
              }}
            >
              + Criar Evento
            </button>
          )}
        </section>

        {/* Estado: carregando */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-72 animate-pulse"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
              />
            ))}
          </div>
        )}

        {/* Estado: erro */}
        {!loading && erro && (
          <div
            className="mx-auto max-w-xl rounded-xl px-6 py-5 text-center text-sm"
            style={{
              backgroundColor: "rgba(248,113,113,0.1)",
              color: "var(--error)",
              border: "1px solid rgba(248,113,113,0.3)",
            }}
          >
            {erro}
          </div>
        )}

        {/* Estado: sem eventos */}
        {!loading && !erro && eventos.length === 0 && (
          <div className="mx-auto mt-12 max-w-md text-center">
            <div className="mb-4 text-5xl">🎭</div>
            <p className="text-lg" style={{ color: "var(--text-muted)" }}>
              Nenhum evento disponível no momento.
            </p>
          </div>
        )}

        {/* Grid de cards */}
        {!loading && !erro && eventos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento, index) => {
              const disp = estiloDisponibilidade(evento.available_tickets);
              const gradiente = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
              return (
                <div
                  key={evento.id}
                  className="group flex flex-col overflow-hidden rounded-2xl transition-all duration-300"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
                    e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,58,237,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Faixa "capa" com gradiente + iniciais */}
                  <div
                    className="relative flex h-32 items-center justify-center"
                    style={{ background: gradiente }}
                  >
                    <span className="text-4xl font-black tracking-tight text-white/95 drop-shadow">
                      {getIniciais(evento.title)}
                    </span>
                    <span className="absolute right-3 top-3 text-2xl drop-shadow">🎫</span>
                    {/* Badge de disponibilidade sobreposto */}
                    <span
                      className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm"
                      style={{ backgroundColor: disp.bg, color: disp.color }}
                    >
                      {disp.label}
                    </span>
                  </div>

                  {/* Corpo do card */}
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <h2
                      className="text-lg font-semibold leading-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {evento.title}
                    </h2>

                    <div
                      className="flex flex-1 flex-col gap-2 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="flex items-center gap-2">📅 {formatarData(evento.date)}</span>
                      <span className="flex items-center gap-2">📍 {evento.location}</span>
                    </div>

                    {/* Preço em destaque */}
                    <div
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{ backgroundColor: "var(--bg-input)" }}
                    >
                      <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        A partir de
                      </span>
                      <span className="text-xl font-bold" style={{ color: "var(--accent-light)" }}>
                        {formatarPreco(evento.price)}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 pt-1">
                      {isAdmin && (
                        <button
                          onClick={() => handleDeletar(Number(evento.id))}
                          disabled={deleting === Number(evento.id)}
                          className="rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                          style={{
                            backgroundColor: "rgba(248,113,113,0.15)",
                            color: "var(--error)",
                            border: "1px solid rgba(248,113,113,0.3)",
                          }}
                        >
                          {deleting === Number(evento.id) ? "Deletando…" : "Deletar"}
                        </button>
                      )}

                      <Link
                        href={`/eventos/${evento.id}/comprar`}
                        className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200"
                        style={{
                          background:
                            evento.available_tickets > 0
                              ? "linear-gradient(135deg, var(--accent), var(--accent-light))"
                              : "var(--border)",
                          color: evento.available_tickets > 0 ? "#fff" : "var(--text-muted)",
                          pointerEvents: evento.available_tickets > 0 ? "auto" : "none",
                          boxShadow:
                            evento.available_tickets > 0 ? "0 6px 18px rgba(124,58,237,0.3)" : "none",
                        }}
                      >
                        {evento.available_tickets > 0 ? "Comprar ingresso" : "Esgotado"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Painel de Logs do Sistema — visual de terminal/console */}
        {showLogs && isAdmin && (
          <div
            className="mt-12 overflow-hidden rounded-2xl animate-fade-in-up"
            style={{
              backgroundColor: "#0d0d16",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Barra de título estilo terminal */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ backgroundColor: "#15151f", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#ff5f56" }} />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#ffbd2e" }} />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#27c93f" }} />
                </div>
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  📋 logs do sistema — event-service · gateway
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCarregarLogs}
                  className="rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: "rgba(124,58,237,0.15)",
                    color: "var(--accent-light)",
                    border: "1px solid rgba(124,58,237,0.3)",
                  }}
                >
                  🔄 atualizar
                </button>
                <button
                  onClick={() => setShowLogs(false)}
                  className="rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  ✕ fechar
                </button>
              </div>
            </div>

            {/* Conteúdo dos logs */}
            <div className="p-5">
              {logs.length === 0 ? (
                <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--success)" }}>$</span> nenhum log disponível.
                </p>
              ) : (
                <div className="max-h-[28rem] overflow-auto">
                  <table className="w-full font-mono text-xs">
                    <thead className="sticky top-0" style={{ backgroundColor: "#0d0d16" }}>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Timestamp", "Nível", "Serviço", "Mensagem"].map((h) => (
                          <th
                            key={h}
                            className="py-2 px-3 text-left font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: "1px solid rgba(39,39,58,0.5)",
                            backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <td
                            className="whitespace-nowrap py-2 px-3"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {new Date(log.timestamp).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 px-3 font-bold uppercase">
                            <span
                              style={{
                                color:
                                  log.level === "error"
                                    ? "var(--error)"
                                    : log.level === "warn"
                                    ? "#f59e0b"
                                    : "var(--success)",
                              }}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td
                            className="whitespace-nowrap py-2 px-3"
                            style={{ color: "var(--accent-light)" }}
                          >
                            {log.service}
                          </td>
                          <td className="py-2 px-3" style={{ color: "var(--text-primary)" }}>
                            {log.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: criar evento */}
      {showModal && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-8 shadow-2xl animate-fade-in-up"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              backgroundImage:
                "linear-gradient(var(--bg-card), var(--bg-card)), linear-gradient(135deg, rgba(167,139,250,0.5), transparent 50%)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                }}
              >
                ✦
              </div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Criar Evento
              </h2>
            </div>
            <form onSubmit={handleCriarEvento} className="space-y-4">
              {[
                { label: "Título", key: "title", type: "text", required: true },
                { label: "Descrição", key: "description", type: "text", required: false },
                { label: "Local (venue)", key: "venue", type: "text", required: true },
                { label: "Data e Hora", key: "date", type: "datetime-local", required: true },
                { label: "Total de Ingressos", key: "total_tickets", type: "number", required: true },
                { label: "Preço (R$)", key: "price", type: "number", required: true },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    required={required}
                    value={String(form[key as keyof typeof form])}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none"
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
              ))}
              {formErro && (
                <p
                  className="text-sm rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: "rgba(248,113,113,0.1)",
                    color: "var(--error)",
                    border: "1px solid rgba(248,113,113,0.3)",
                  }}
                >
                  {formErro}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criando}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                    boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
                  }}
                >
                  {criando ? "Criando…" : "Criar Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
