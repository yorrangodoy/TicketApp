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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 shadow-lg"
        style={{
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight" style={{ color: "var(--accent-light)" }}>
            🎟 TicketApp
          </span>
          {isAdmin && (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              Admin
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
                backgroundColor: 'rgba(37,99,235,0.15)',
                color: 'var(--accent-light)',
                border: '1px solid rgba(37,99,235,0.3)',
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
      </header>

      <main className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Eventos disponíveis
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
          Escolha um evento e garanta seu ingresso
        </p>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="mb-6 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            + Criar Evento
          </button>
        )}

        {/* Estado: carregando */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-56 animate-pulse"
                style={{ backgroundColor: "var(--bg-card)" }}
              />
            ))}
          </div>
        )}

        {/* Estado: erro */}
        {!loading && erro && (
          <div
            className="rounded-xl px-6 py-5 text-sm"
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
          <p className="text-center mt-20 text-lg" style={{ color: "var(--text-muted)" }}>
            Nenhum evento disponível no momento.
          </p>
        )}

        {/* Grid de cards */}
        {!loading && !erro && eventos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Título */}
                <h2 className="text-lg font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {evento.title}
                </h2>

                {/* Detalhes */}
                <div className="flex flex-col gap-1 text-sm flex-1" style={{ color: "var(--text-muted)" }}>
                  <span>📅 {formatarData(evento.date)}</span>
                  <span>📍 {evento.location}</span>
                </div>

                {/* Rodapé do card */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold" style={{ color: "var(--accent-light)" }}>
                      {formatarPreco(evento.price)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {evento.available_tickets} ingresso{evento.available_tickets !== 1 ? "s" : ""} disponível{evento.available_tickets !== 1 ? "is" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletar(Number(evento.id))}
                        disabled={deleting === Number(evento.id)}
                        className="rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-50"
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
                      className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
                      style={{
                        backgroundColor:
                          evento.available_tickets > 0 ? "var(--accent)" : "var(--border)",
                        color:
                          evento.available_tickets > 0 ? "#fff" : "var(--text-muted)",
                        pointerEvents: evento.available_tickets > 0 ? "auto" : "none",
                      }}
                    >
                      {evento.available_tickets > 0 ? "Comprar" : "Esgotado"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Painel de Logs do Sistema */}
        {showLogs && isAdmin && (
          <div className="mt-8 rounded-2xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                📋 Logs do Sistema
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCarregarLogs}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  🔄 Atualizar
                </button>
                <button
                  onClick={() => setShowLogs(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum log disponível.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Timestamp','Nível','Serviço','Mensagem'].map(h => (
                        <th key={h} className="text-left py-2 px-3 font-semibold"
                          style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i}
                        style={{ borderBottom: '1px solid var(--border)',
                          backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td className="py-2 px-3 font-mono" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 font-bold uppercase text-xs">
                          <span style={{
                            color: log.level === 'error' ? 'var(--error)'
                                 : log.level === 'warn'  ? '#f59e0b'
                                 : 'var(--accent-light)',
                          }}>{log.level}</span>
                        </td>
                        <td className="py-2 px-3 font-mono" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {log.service}
                        </td>
                        <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: criar evento */}
      {showModal && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-8 shadow-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Criar Evento
            </h2>
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
                    className="block text-sm font-medium mb-1"
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
                  className="flex-1 rounded-lg py-3 text-sm font-semibold"
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
                  className="flex-1 rounded-lg py-3 text-sm font-semibold disabled:opacity-60"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
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
