import axios from 'axios';

const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://event-service:3000';

const client = axios.create({
  baseURL: EVENT_SERVICE_URL,
  timeout: 5000,
});

export interface EventData {
  id: number;
  title: string;
  // PostgreSQL retorna NUMERIC como string — convertemos no ponto de uso
  price: string;
  available_tickets: number;
}

export async function getEvent(eventId: number): Promise<EventData> {
  const response = await client.get<{ event: EventData }>(`/events/${eventId}`);
  return response.data.event;
}

// quantity positivo = reservar; quantity negativo = devolver ao estoque (compensação)
export async function reserveTickets(eventId: number, quantity: number): Promise<void> {
  await client.patch(`/events/${eventId}/reserve`, { quantity });
}
