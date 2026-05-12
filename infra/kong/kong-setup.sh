#!/bin/sh
set -e

KONG_ADMIN="http://kong:8001"

echo ""
echo "================================================"
echo "   Kong Gateway — Configuração Inicial"
echo "================================================"
echo ""
echo "Aguardando Kong iniciar (5s)..."
sleep 5

# ==================== SERVIÇOS ====================

echo "Registrando serviços..."
echo ""

echo "  [1/4] auth-service → http://nginx:80/api/auth"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/auth-service" \
  --data 'name=auth-service' \
  --data 'url=http://nginx:80/api/auth'

echo "  [2/4] event-service → http://nginx:80/api/events"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/event-service" \
  --data 'name=event-service' \
  --data 'url=http://nginx:80/api/events'

echo "  [3/4] order-service → http://nginx:80/api/orders"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/order-service" \
  --data 'name=order-service' \
  --data 'url=http://nginx:80/api/orders'

echo "  [4/4] payment-service → http://nginx:80/api/payments"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/payment-service" \
  --data 'name=payment-service' \
  --data 'url=http://nginx:80/api/payments'

# ==================== ROTAS ====================

echo ""
echo "Registrando rotas..."
echo ""

echo "  [1/4] /api/auth → auth-service"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/auth-service/routes/auth-route" \
  --data 'name=auth-route' \
  --data 'paths[]=/api/auth' \
  --data 'strip_path=true'

echo "  [2/4] /api/events → event-service"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/event-service/routes/event-route" \
  --data 'name=event-route' \
  --data 'paths[]=/api/events' \
  --data 'strip_path=true'

echo "  [3/4] /api/orders → order-service"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/order-service/routes/order-route" \
  --data 'name=order-route' \
  --data 'paths[]=/api/orders' \
  --data 'strip_path=true'

echo "  [4/4] /api/payments → payment-service"
curl -s -o /dev/null -w "        status: %{http_code}\n" \
  -X PUT "$KONG_ADMIN/services/payment-service/routes/payment-route" \
  --data 'name=payment-route' \
  --data 'paths[]=/api/payments' \
  --data 'strip_path=true'

echo ""
echo "================================================"
echo "   Kong configurado com sucesso!"
echo "================================================"
echo ""
