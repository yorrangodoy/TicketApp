\# 🎫 Ticket System Distributed



Sistema distribuído de venda de ingressos online, desenvolvido como projeto A3 da disciplina de \*\*Sistemas Distribuídos e Mobile\*\* — UNISUL.



\## 📋 Sobre o Projeto



Sistema que permite a criação de eventos e venda de ingressos online, com arquitetura baseada em microsserviços, comunicação assíncrona, controle de concorrência e observabilidade.



\## 🏗️ Arquitetura

&#x20;               ┌─────────────┐

&#x20;               │   Cliente    │

&#x20;               │ (Postman)   │

&#x20;               └──────┬──────┘

&#x20;                      │

&#x20;               ┌──────▼──────┐

&#x20;               │ API Gateway │

&#x20;               │   (Kong)    │

&#x20;               └──────┬──────┘

&#x20;                      │

&#x20;               ┌──────▼──────┐

&#x20;               │Load Balancer│

&#x20;               │  (Nginx)    │

&#x20;               └──────┬──────┘

&#x20;                      │

&#x20;     ┌────────────────┼────────────────┐

&#x20;     │                │                │

┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐

│auth-service │ │event-service│ │order-service │

│  (Node.js)  │ │  (Node.js)  │ │  (Node.js)  │

└──────┬──────┘ └──────┬──────┘ └──────┬──────┘

│                │                │

│                │         ┌──────▼──────┐

│                │         │  payment-   │

│                │         │  service    │

│                │         │   (mock)    │

│                │         └──────┬──────┘

│                │                │

└────────┬───────┘         ┌──────▼──────┐

│                 │notification-│

┌──────▼──────┐          │  service    │

│  PostgreSQL │          │   (mock)    │

└─────────────┘          └──────┬──────┘

│

┌──────▼──────┐

│  RabbitMQ   │

│   (fila)    │

└─────────────┘



\## 🧩 Microsserviços



| Serviço | Responsabilidade |

|---------|-----------------|

| \*\*auth-service\*\* | Cadastro de usuários, login, autenticação JWT |

| \*\*event-service\*\* | CRUD de eventos (admin), listagem de eventos |

| \*\*order-service\*\* | Fluxo de compra, controle de concorrência, idempotência |

| \*\*payment-service\*\* | Simulação de gateway de pagamento (boleto, PIX, cartão) |

| \*\*notification-service\*\* | Simulação de envio de e-mail de confirmação |



\## 🛠️ Stack Tecnológica



| Camada | Tecnologia |

|--------|-----------|

| Linguagem | Node.js + TypeScript |

| API Gateway | Kong |

| Load Balancer | Nginx |

| Banco de Dados | PostgreSQL |

| Fila Assíncrona | RabbitMQ |

| Observabilidade | Winston (logs) + Prometheus + Grafana |

| Containerização | Docker + Docker Compose |



\## ⚙️ Requisitos Distribuídos



\- \*\*Controle de Concorrência:\*\* Previne overselling com lock otimista no banco

\- \*\*Resiliência:\*\* Retry com backoff exponencial + fallback em falhas de serviço

\- \*\*Idempotência:\*\* Chave de idempotência por requisição para evitar compras duplicadas

\- \*\*Comunicação Assíncrona:\*\* RabbitMQ para desacoplar pagamento e notificação



\## 🚀 Como Rodar



\### Pré-requisitos

\- Docker

\- Docker Compose



\### Executar

```bash

git clone https://github.com/yorrangodoy/ticket-system-distributed.git

cd ticket-system-distributed

docker-compose up --build

```



\## 📊 Observabilidade



\- \*\*Logs:\*\* Estruturados em JSON via Winston

\- \*\*Métricas:\*\* Prometheus coletando latência, erros e throughput

\- \*\*Dashboard:\*\* Grafana para visualização



\## 👥 Equipe



| Nome | Responsabilidade |

|------|-----------------|

| Yorran | Infraestrutura, Docker, API Gateway, Load Balancer, Observabilidade |

| Levi | auth-service, event-service |

| Leo | order-service, payment-service, notification-service |



\## 📅 Entregas



\- \*\*Entrega dos materiais:\*\* 08/06/2026

\- \*\*Apresentação:\*\* 15/06/2026

