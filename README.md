# Emergency Request & Dispatch Management System

A high-impact Emergency Request & Dispatch Management System built with Node.js, Express, Prisma ORM (PostgreSQL), Redis Sorted Sets (`ZADD`/`ZREVRANGE`), Redis Pub/Sub, WebSockets (Socket.io), and a dark-mode Emergency Command Center frontend in React & Leaflet.js.

---

## System Architecture

```
                                +---------------------------+
                                |  React Command Center SPA |
                                | (Leaflet, Drag-Drop, WS)  |
                                +-------------+-------------+
                                              |
                                   HTTP / WebSockets
                                              v
                                +-------------+-------------+
                                |  Node.js Express Server   |
                                |   (MVC Architecture)      |
                                +------+------+------+------+
                                       |      |      |
                    +------------------+      |      +------------------+
                    |                         v                         |
                    v                 +---------------+                 v
         +-------------------+        |  Prisma ORM   |        +------------------+
         |  AI Engine (NLP)  |        +-------+-------+        |  Redis Queue &   |
         |  Urgency Scoring  |                |                |  Pub/Sub Engine  |
         +-------------------+                v                +------------------+
                                      +---------------+
                                      | PostgreSQL DB |
                                      +---------------+
```

---

## 7 Required Core APIs

| # | HTTP Method | Endpoint | Description & Logic |
|---|-------------|----------|---------------------|
| **1** | `POST` | `/api/emergency/create` | Receives `(user_id, location {lat, lng}, description)`. AI classifies priority (1-5), saves to DB, adds to Redis queue (`ZADD`), and emits WS `NEW_INCIDENT`. |
| **2** | `GET` | `/api/emergency/pending` | Fetches top requests ordered by priority score directly from Redis priority queue (`ZREVRANGE`). |
| **3** | `POST` | `/api/emergency/assign` | Receives `(request_id, responder_id)`. Updates DB status to `ASSIGNED`, removes item from Redis queue (`ZREM`), and emits WS `DISPATCH_ASSIGNED`. |
| **4** | `PATCH` | `/api/emergency/status` | Receives `(request_id, status)`. Updates DB status, emits WS `STATUS_UPDATED`, and invalidates Redis active cache. |
| **5** | `GET` | `/api/emergency/active` | Fetches ongoing requests with a 30-second Redis caching layer (`SETEX`). |
| **6** | `POST` | `/api/emergency/notify-dispatch` | Receives `(request_id)`. Triggers Redis Pub/Sub (`PUBLISH`) event for external dispatch system listeners. |
| **7** | `POST` | `/api/ai/classify-priority` | Receives `(description)`. Analyzes NLP text and returns urgency score (1-5), risk factors JSON, and dispatch recommendation. |

---

## Quick Start (One Command Execution)

### Prerequisites
- Docker & Docker Compose installed

### Launch Command
```bash
docker-compose up --build
```

Access the Emergency Command Center Dashboard at **`http://localhost:3000`**  
Backend REST APIs & WebSockets available at **`http://localhost:5000`**

---

## Features
- **Interactive Command Center Map**: Live pin markers color-coded by AI priority (Red = Level 5 Critical, Orange = Level 4, Yellow = Level 3, Blue = Level 1-2).
- **One-Click Drag & Drop Dispatch**: Drag available responder units (Ambulance, Fire Engine, Police Unit, SWAT, Hazmat) onto active emergency pins to trigger API #3.
- **Live Event Stream & Sound Alerts**: Real-time Web Audio API synthesizer chime when high-priority emergencies hit the queue.
- **AI Priority Sandbox**: Real-time typing analyzer that previews AI urgency rating and risk keywords as operators type descriptions.
