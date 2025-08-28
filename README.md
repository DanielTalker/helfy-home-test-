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
- Docker & Docker Compose

---

## Setup & Run
Clone the repository and run:

```bash
docker compose up -d
```

Please Note: It may take ~30–60 seconds for all services (TiDB, Kafka, TiCDC) to become fully ready :)

This will:

- Start TiDB, Kafka, Zookeeper, Kafka UI  
- Start the backend (Node.js API)  
- Start the frontend  
- Run TiCDC and automatically create the changefeed  
- Launch the Kafka consumer

---
## Services:

- Backend: http://localhost:3001

- Frontend: http://localhost:8080

- Kafka UI: http://localhost:8081

---

## Default User

A default user is seeded automatically:

- Email: admin@example.com
- Password: Password123!

---

## CDC Test
To verify CDC is working, connect to TiDB and perform INSERT/UPDATE/DELETE on a test table.  
If the table `helfy.notes` does not exist yet, create it first:

```sql
USE helfy;
CREATE TABLE notes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

You should see structured JSON change events appear in the consumer logs if you perform
INSERT, UPDATE, or DELETE operations on this table:
```bash
docker logs -f helfy-cdc-consumer
```


## Notes

- All logs (user login + CDC events) are printed in structured JSON format using `log4js`.  
- TiDB CDC is configured to stream DB changes into Kafka.  
- The consumer processes Kafka messages and logs them to the console.
- - To inspect logs:  
  ```bash
  docker logs -f helfy-backend        # Auth activity logs
  docker logs -f helfy-cdc-consumer   # CDC change events
  ```

---
