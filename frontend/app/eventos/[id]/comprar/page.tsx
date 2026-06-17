"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, buyTicket, getEvents, type Evento, type OrderResponse } from "../../../lib/api";

type MetodoPagamento = "pix" | "boleto" | "cartao";

const metodos: { value: MetodoPagamento; label: string; icone: string }[] = [
  { value: "pix", label: "PIX", icone: "⚡" },
  { value: "boleto", label: "Boleto Bancário", icone: "📄" },
  { value: "cartao", label: "Cartão de Crédito", icone: "💳" },
];

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

export default function ComprarPage() {
  const router = useRouter();
  /* useParams() é o hook correto para Client Components com rota dinâmica */
  const params = useParams<{ id: string }>();
  const eventoId = params.id;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loadingEvento, setLoadingEvento] = useState(true);
  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");

  const [comprando, setComprando] = useState(false);
  const [resultado, setResultado] = useState<OrderResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    /* Busca a lista e filtra o evento pelo id da URL */
    getEvents()
      .then((lista) => {
        const encontrado = lista.find((e) => String(e.id) === eventoId);
        setEvento(encontrado ?? null);
      })
      .catch(() => setEvento(null))
      .finally(() => setLoadingEvento(false));
  }, [eventoId, router]);

  async function handleComprar() {
    if (!evento) return;
    setErro(null);
    setResultado(null);
    setComprando(true);

    try {
      const res = await buyTicket(evento.id, metodo);
      setResultado(res);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setComprando(false);
    }
  }

  /* ─── Estados de carregamento / erro de busca ─── */
  if (loadingEvento) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
          Carregando evento…
        </p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--bg-base)" }}>
        <p className="text-lg" style={{ color: "var(--error)" }}>
          Evento não encontrado.
        </p>
        <Link
          href="/eventos"
          className="text-sm underline"
          style={{ color: "var(--accent-light)" }}
        >
          Voltar aos eventos
        </Link>
      </div>
    );
  }

  const compraFinalizada = resultado !== null;

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
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="TicketApp" width={28} height={28} style={{ objectFit: "contain" }} />
          <span className="text-xl font-bold tracking-tight" style={{ color: "var(--accent-light)" }}>
            TicketApp
          </span>
        </div>
        <Link
          href="/eventos"
          className="text-sm transition hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          ← Voltar aos eventos
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div
          className="w-full max-w-lg rounded-2xl p-8 shadow-2xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Detalhes do evento */}
          <div className="mb-8">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3"
              style={{ backgroundColor: "rgba(124,58,237,0.2)", color: "var(--accent-light)" }}
            >
              Confirmação de compra
            </span>
            <h1 className="text-2xl font-bold leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
              {evento.title}
            </h1>
            <div className="flex flex-col gap-1 text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              <span>📅 {formatarData(evento.date)}</span>
              <span>📍 {evento.venue}</span>
              <span>🎫 {evento.available_tickets} ingresso{evento.available_tickets !== 1 ? "s" : ""} restante{evento.available_tickets !== 1 ? "s" : ""}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--accent-light)" }}>
              {formatarPreco(evento.price)}
            </p>
          </div>

          {/* Resultado da compra */}
          {compraFinalizada && (
            <div>
              {resultado?.status === "refused" ? (
                /* Pagamento recusado */
                <div
                  className="rounded-xl px-5 py-5 mb-6"
                  style={{
                    backgroundColor: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.3)",
                  }}
                >
                  <p className="text-base font-semibold" style={{ color: "var(--error)" }}>
                    ❌ Pagamento recusado
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    Tente novamente com outro método de pagamento.
                  </p>
                  <button
                    onClick={() => setResultado(null)}
                    className="mt-4 rounded-lg px-4 py-2 text-sm font-medium transition"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                /* Compra confirmada */
                <div
                  className="rounded-2xl px-6 py-8 text-center flex flex-col items-center gap-4"
                  style={{
                    backgroundColor: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.25)",
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: "rgba(52,211,153,0.15)" }}
                  >
                    ✅
                  </div>
                  <div>
                    <p className="text-xl font-bold mb-1" style={{ color: "var(--success)" }}>
                      Ingresso garantido!
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Sua compra foi confirmada com sucesso.
                    </p>
                  </div>
                  {resultado?.transaction_id && (
                    <div
                      className="w-full rounded-xl px-4 py-3 text-left"
                      style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                        ID da transação
                      </p>
                      <code
                        className="font-mono text-xs break-all"
                        style={{ color: "var(--accent-light)" }}
                      >
                        {resultado.transaction_id}
                      </code>
                    </div>
                  )}
                  <Link
                    href="/eventos"
                    className="w-full rounded-xl py-3 text-sm font-semibold text-center transition-all duration-200"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    Ver outros eventos
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Formulário de pagamento — oculto após compra confirmada */}
          {!compraFinalizada && (
            <>
              <div className="mb-6">
                <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                  Método de pagamento
                </p>
                <div className="flex flex-col gap-3">
                  {metodos.map((m) => {
                    const selecionado = metodo === m.value;
                    return (
                      <label
                        key={m.value}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all duration-150"
                        style={{
                          backgroundColor: selecionado ? "rgba(124,58,237,0.15)" : "var(--bg-input)",
                          border: `1px solid ${selecionado ? "var(--accent)" : "var(--border)"}`,
                        }}
                      >
                        <input
                          type="radio"
                          name="metodo"
                          value={m.value}
                          checked={selecionado}
                          onChange={() => setMetodo(m.value)}
                          className="sr-only"
                        />
                        <span className="text-lg">{m.icone}</span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: selecionado ? "var(--accent-light)" : "var(--text-primary)" }}
                        >
                          {m.label}
                        </span>
                        {selecionado && (
                          <span className="ml-auto text-xs font-bold" style={{ color: "var(--accent-light)" }}>
                            ✓
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Erro da requisição de compra */}
              {erro && (
                <p
                  className="rounded-lg px-4 py-3 text-sm mb-4"
                  style={{
                    backgroundColor: "rgba(248,113,113,0.1)",
                    color: "var(--error)",
                    border: "1px solid rgba(248,113,113,0.3)",
                  }}
                >
                  {erro}
                </p>
              )}

              {/* Botão confirmar */}
              <button
                onClick={handleComprar}
                disabled={comprando}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                onMouseEnter={(e) => {
                  if (!comprando) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!comprando) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
                }}
              >
                {comprando ? "Processando…" : `Confirmar compra · ${formatarPreco(evento.price)}`}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
