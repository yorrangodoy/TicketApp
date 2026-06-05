"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEvents, getToken, removeToken, type Evento } from "../lib/api";

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
        <span className="text-xl font-bold tracking-tight" style={{ color: "var(--accent-light)" }}>
          🎟 TicketApp
        </span>
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
      </header>

      <main className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Eventos disponíveis
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
          Escolha um evento e garanta seu ingresso
        </p>

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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
