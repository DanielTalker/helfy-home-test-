# Helfy SRE Home Test

## Overview
This project demonstrates:
1. A TiDB cluster with Change Data Capture (CDC) to Kafka
2. A Node.js backend service with authentication and structured logging
3. A simple frontend for login testing
4. A Kafka consumer in Node.js that processes real-time DB changes
5. Full Dockerized environment — run everything with a single command

---

## Prerequisites
- Docker
- Docker Compose

---

## Setup & Run
Clone the repository and run:

```bash
docker compose up -d
```


This will:

- Start TiDB, Kafka, Zookeeper, Kafka UI  
- Start the backend (Node.js API)  
- Start the frontend  
- Run TiCDC and automatically create the changefeed  
- Launch the Kafka consumer

---

## Default User

A default user is seeded automatically:

- **Username:** `test@helfy.com`  
- **Password:** `password`

You can log in using the basic HTML form at [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
.
├── backend/               # Express.js backend
├── consumer/              # Kafka consumer
├── frontend/              # Basic HTML login page
├── docker-compose.yml     # Full environment
├── init/                  # SQL schema + default data
└── cdc.toml               # TiCDC configuration
```

---

## 🧾 Notes

- All logs (user login + CDC events) are printed in structured JSON format using `log4js`.  
- TiDB CDC is configured to stream DB changes into Kafka.  
- The consumer processes Kafka messages and logs them to the console.

---
