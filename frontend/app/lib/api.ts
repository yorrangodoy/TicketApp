/* Módulo de acesso à API REST do backend */

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:80";

/* Lê o token JWT salvo no localStorage */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/* Salva o token JWT no localStorage */
export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

/* Remove o token JWT do localStorage */
export function removeToken(): void {
  localStorage.removeItem("token");
}

/* Tipos de resposta da API */
export interface LoginResponse {
  token: string;
}

export interface RegisterResponse {
  message?: string;
}

export interface Evento {
  id: string | number;
  title: string;
  date: string;
  location: string;
  price: number;
  available_tickets: number;
}

export interface OrderResponse {
  transaction_id?: string;
  status?: string;
  message?: string;
}

/* Autentica o usuário e retorna o token JWT */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${baseURL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Credenciais inválidas");
  }

  return res.json();
}

/* Cadastra um novo usuário */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const res = await fetch(`${baseURL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Erro ao criar conta");
  }

  return res.json();
}

/* Busca a lista de eventos disponíveis */
export async function getEvents(): Promise<Evento[]> {
  const token = getToken();

  const res = await fetch(`${baseURL}/api/events`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error("Erro ao carregar eventos");
  }

  const data = await res.json();
  return data.events;
}

/* Realiza a compra de ingresso para um evento */
export async function buyTicket(
  eventId: string | number,
  paymentMethod: string
): Promise<OrderResponse> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const body = {
    event_id: Number(eventId),
    quantity: 1,
    metodo_pagamento: paymentMethod,
  };

  console.log("[buyTicket] headers:", headers);
  console.log("[buyTicket] body:", body);

  const res = await fetch(`${baseURL}/api/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  /* 402 Payment Required → pagamento recusado, não lança erro */
  if (res.status === 402) {
    return { status: "refused" };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Erro ao processar compra");
  }

  return res.json();
}
