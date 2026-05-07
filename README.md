# Ticket System Distributed

Sistema distribuído de venda de ingressos online desenvolvido como projeto acadêmico na disciplina de Sistemas Distribuídos e Mobile — UNISUL.

O sistema simula um cenário real de e-commerce de ingressos, aplicando padrões de arquitetura distribuída com foco em escalabilidade, resiliência, controle de concorrência e observabilidade.

---

## Arquitetura

Client (Postman/Insomnia)
│
▼
┌─────────┐
│  Kong    │  API Gateway — roteamento e controle de acesso
└────┬────┘
▼
┌─────────┐
│  Nginx   │  Load Balancer — distribuição de carga
└────┬────┘
│
┌────┼──────────────┐
▼    ▼              ▼
Auth  Event (x2)   Order (x2) ──▶ Payment (mock)
│    │              │
│    │              ▼
│    │         RabbitMQ ──▶ Notification (mock)
│    │
▼    ▼
PostgreSQL
│
┌────┼────┐
▼         ▼
Prometheus  Grafana


---

## Serviços

| Serviço | Porta | Responsabilidade |
|---------|-------|------------------|
| auth-service | 3000 | Cadastro, login e autenticação via JWT |
| event-service | 3000 | CRUD de eventos (perfil admin) |
| order-service | 3000 | Compra de ingressos com controle de concorrência e idempotência |
| payment-service | 3000 | Stub de gateway de pagamento (boleto, PIX, cartão) |
| notification-service | 3000 | Stub de envio de e-mail via consumo de fila |

---

## Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Backend | Node.js + Express + TypeScript | Ecossistema unificado, tipagem estática, produtividade |
| Banco de Dados | PostgreSQL 15 | ACID, suporte a lock otimista, confiabilidade |
| Fila | RabbitMQ | Comunicação assíncrona, desacoplamento entre serviços |
| API Gateway | Kong 3.6 | Roteamento por path, rate limiting, extensível |
| Load Balancer | Nginx | Distribuição round-robin entre instâncias |
| Logs | Winston | Logs estruturados em JSON |
| Métricas | Prometheus + Grafana | Coleta e visualização de latência, erros e throughput |
| Orquestração | Docker Compose | Ambiente reproduzível com um único comando |

---

## Requisitos Distribuídos

**Controle de Concorrência** — Lock otimista no banco para prevenir overselling mesmo sob carga simultânea.

**Resiliência** — Retry com backoff exponencial e fallback em falhas de comunicação entre serviços.

**Idempotência** — Chave única por requisição de compra, impedindo duplicidade em cenários de retry.

**Comunicação Assíncrona** — RabbitMQ desacopla o fluxo de pagamento e notificação do fluxo principal de compra.

---

## Como Executar

**Pré-requisitos:** Docker e Docker Compose instalados.

```bash
git clone https://github.com/yorrangodoy/ticket-system-distributed.git
cd ticket-system-distributed
cp .env.example .env
docker-compose up --build
```

| Recurso | URL |
|---------|-----|
| API (via Kong) | http://localhost:8000 |
| Kong Admin | http://localhost:8001 |
| RabbitMQ Dashboard | http://localhost:15672 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

---

## Estrutura do Repositório

ticket-system-distributed/
├── services/
│   ├── auth-service/
│   ├── event-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
├── infra/
│   ├── nginx/nginx.conf
│   └── prometheus/prometheus.yml
├── docs/
├── docker-compose.yml
├── .env.example
└── README.md

---

## Equipe

| Nome | Escopo |
|------|--------|
| Yorran | Infraestrutura, orquestração, API Gateway, Load Balancer, observabilidade |
| Levi | auth-service, event-service |
| Leo | order-service, payment-service, notification-service |

---

## Entregas

| Item | Data |
|------|------|
| Relatório + Repositório + Apresentação | 08/06/2026 |
| Apresentação presencial | 15/06/2026 |