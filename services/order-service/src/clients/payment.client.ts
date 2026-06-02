import axios from 'axios';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000';

const client = axios.create({
  baseURL: PAYMENT_SERVICE_URL,
  timeout: 5000,
});

export interface PaymentResult {
  status: 'aprovado' | 'recusado';
  transaction_id?: string;
  motivo?: string;
}

export async function processPayment(
  orderId: number,
  valor: number,
  metodo: string,
): Promise<PaymentResult> {
  const response = await client.post<PaymentResult>('/payment/process', {
    order_id: orderId,
    valor,
    metodo,
  });
  return response.data;
}
