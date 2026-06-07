# TicketApp

Sistema distribuído de venda de ingressos online desenvolvido como projeto acadêmico na disciplina de **Sistemas Distribuídos e Mobile — UNISUL**.

O sistema simula um cenário real de e-commerce de ingressos, aplicando padrões de arquitetura distribuída com foco em escalabilidade, resiliência, controle de concorrência e comunicação assíncrona via mensageria.

---

## Demonstração em Produção

| Recurso | URL |
|---------|-----|
| Frontend | https://ticketappa3.vercel.app |
| Auth Service | https://auth-service-production-9dbc.up.railway.app |
| Event Service | https://ticket-system-distributed-production.up.railway.app |
| Gateway (Order + Payment + Notification) | https://gateway-production-da34.up.railway.app |

---

## Arquitetura Local (Docker Compose)

```
Cliente (Postman / Navegador)
        │
        ▼ :8000
┌─────────────┐
│    Kong     │  API Gateway — roteamento por path (/api/auth, /api/events, /api/orders)
└──────┬──────┘
       │ :80
┌──────▼──────┐
│    Nginx    │  Load Balancer — round-robin entre réplicas
└──────┬──────┘
       │
  ┌────┴──────────────────┐
  ▼                       ▼
auth-service         event-service (x2)
  │                  order-service (x2) ──► payment-service
  │                       │
  ▼                       ▼ AMQP assíncrono
PostgreSQL            RabbitMQ ──► notification-service
```

## Arquitetura de Produção (Railway + Vercel)

```
Cliente (Navegador / Postman)
        │
        ▼
┌───────────────────┐
│  Vercel (CDN)     │  Next.js 14 + Tailwind CSS
└────────┬──────────┘
    ┌────┴──────────────────────────┐
    │                               │
    ▼                               ▼
auth-service                    gateway
(Railway)                      (Railway)
                          ┌────────────────┐
                          │ order-service  │
                          │ payment-service│ ──► RabbitMQ
                          │ notification   │         │
                          └───────┬────────┘         ▼
                                  │         notification-service
                                  ▼
                            event-service
                            (Railway)
                                  │
                                  ▼
                             PostgreSQL
                             (Railway)
```

> O gateway consolida order, payment e notification num único container por restrição de infraestrutura do plano gratuito do Railway, preservando a separação lógica de responsabilidades e a comunicação assíncrona real via RabbitMQ.

---

## Perfis de Usuário

| Perfil | Operações |
|--------|-----------|
| **Administrador** | Criar eventos, alterar quantidade de ingressos, alterar preço, remover eventos, listar usuários |
| **Usuário Final** | Cadastro, login, listar eventos, comprar ingressos (boleto, PIX, cartão) |

---

## Serviços

| Serviço | Responsabilidade |
|---------|-----------------|
| **auth-service** | Cadastro, login, JWT com role (user/admin), rota /admin/users |
| **event-service** | CRUD de eventos (admin), controle de estoque com SELECT FOR UPDATE |
| **order-service** | Compra com idempotência, retry, SAGA de compensação |
| **payment-service** | Mock de gateway (boleto, PIX, cartão) — 80% aprovação |
| **notification-service** | Consumidor RabbitMQ, simula envio de e-mail |
| **gateway** | Container consolidado: order + payment + notification (Railway) |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Banco de dados | PostgreSQL 15 |
| Mensageria | RabbitMQ |
| API Gateway | Kong 3.6 (DB-less, declarativo) |
| Load Balancer | Nginx (round-robin) |
| Logs | Winston (JSON estruturado) |
| Métricas | Prometheus Client (endpoint /metrics) |
| Observabilidade | Grafana (dashboard provisionado) |
| Deploy backend | Railway |
| Deploy frontend | Vercel |
| Orquestração local | Docker Compose |

---

## Requisitos Distribuídos

**Controle de Concorrência** — SELECT FOR UPDATE no PostgreSQL durante reserva de ingressos. Garante que compras simultâneas não causem overselling.

**Idempotência** — Header `Idempotency-Key` obrigatório em POST /orders. Retries não geram pedidos duplicados.

**Resiliência** — Retry com backoff exponencial (500ms → 1s → 2s, 3 tentativas) na chamada ao payment-service.

**Padrão SAGA** — Compensação automática de estoque se o pagamento falhar após a reserva.

**Comunicação Assíncrona** — RabbitMQ desacopla notificação do fluxo principal. Falha no RabbitMQ não cancela pedidos confirmados.

---

## Como Executar Localmente

**Pré-requisitos:** Docker e Docker Compose instalados.

```bash
git clone https://github.com/yorrangodoy/TicketApp.git
cd TicketApp
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

```
TicketApp/
├── services/
│   ├── auth-service/          # Autenticação JWT + perfis user/admin
│   ├── event-service/         # Gestão de eventos e estoque
│   ├── order-service/         # Fluxo de compra
│   ├── payment-service/       # Mock de pagamento
│   ├── notification-service/  # Consumidor RabbitMQ
│   ├── gateway/               # Container consolidado (Railway)
│   └── shared/
│       ├── logger/            # Winston
│       ├── metrics/           # Prometheus client
│       └── middleware/        # authMiddleware + adminMiddleware
├── frontend/                  # Next.js 14 + Tailwind
├── infra/
│   ├── kong/                  # Kong declarativo (DB-less)
│   ├── nginx/                 # Load balancer round-robin
│   ├── prometheus/            # Coleta de métricas
│   ├── grafana/               # Dashboard provisionado
│   └── rabbitmq/              # Configuração do broker
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Equipe

| Nome | RA | Escopo |
|------|----|--------|
| Yorran Luzzi de Godoy | 10723112338 | Infraestrutura, deploy, gateway, frontend, CI/CD |
| Levi Pfleger dos Santos | 1072310761 | auth-service, event-service |
| Leonardo Augusto Welter Goulart | 10723111291 | order-service, payment-service, notification-service |

---

## Entregas

| Item | Data |
|------|------|
| Relatório + Repositório | 08/06/2026 |
| Apresentação presencial | 15/06/2026 |
