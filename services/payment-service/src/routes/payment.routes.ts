import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../../shared/logger';

const router = Router();

interface ProcessPaymentBody {
  order_id: string;
  valor: number;
  metodo: 'boleto' | 'pix' | 'cartao';
}

router.post('/process', async (req: Request, res: Response): Promise<void> => {
  const { order_id, valor, metodo } = req.body as ProcessPaymentBody;

  if (!order_id || valor === undefined || !metodo) {
    res.status(400).json({ erro: 'Campos obrigatórios: order_id, valor, metodo' });
    return;
  }

  if (!['boleto', 'pix', 'cartao'].includes(metodo)) {
    res.status(400).json({ erro: 'Método de pagamento inválido. Use: boleto, pix ou cartao' });
    return;
  }

  // Simula tempo de processamento do gateway
  await new Promise((resolve) => setTimeout(resolve, 500));

  const aprovado = Math.random() < 0.8;

  if (aprovado) {
    const transaction_id = uuidv4();

    logger.info('Pagamento aprovado', {
      order_id,
      valor,
      metodo,
      transaction_id,
      status: 'aprovado',
    });

    res.status(200).json({ status: 'aprovado', transaction_id });
  } else {
    logger.info('Pagamento recusado', {
      order_id,
      valor,
      metodo,
      motivo: 'saldo insuficiente',
      status: 'recusado',
    });

    res.status(200).json({ status: 'recusado', motivo: 'saldo insuficiente' });
  }
});

export default router;
