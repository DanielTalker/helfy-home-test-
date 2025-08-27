import { Kafka } from "kafkajs";
import log4js from "log4js";

log4js.configure({
  appenders: { out: { type: "stdout", layout: { type: "pattern", pattern: "%m" } } },
  categories: { default: { appenders: ["out"], level: "info" } }
});
const logger = log4js.getLogger();

const brokers = (process.env.KAFKA_BROKERS || "helfy-kafka:9092").split(",");
const topic = process.env.KAFKA_TOPIC || "helfy.cdc";
const groupId = process.env.KAFKA_GROUP || "helfy-consumer";

const kafka = new Kafka({ brokers });
const consumer = kafka.consumer({ groupId });

(async () => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  logger.info(JSON.stringify({ ts: new Date().toISOString(), action: "consumer_started", topic }));

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      const raw = message.value.toString("utf8").trim();
      if (!raw) return;

      try {
        const evt = JSON.parse(raw);

        // skip Heartbeats
        if (evt.type === "TIDB_WATERMARK") return;

        // Structured log 
        const logEvent = {
          ts: new Date().toISOString(),
          action: "db_change",
          database: evt.database,
          table: evt.table,
          type: evt.type,       // INSERT / UPDATE / DELETE / DDL
          data: evt.data || null,
          old: evt.old || null
        };

        logger.info(JSON.stringify(logEvent));
      } catch (e) {
        logger.error(JSON.stringify({
          ts: new Date().toISOString(),
          action: "cdc_parse_error",
          error: e.message,
          sample: raw.slice(0, 80)
        }));
      }
    }
  });
})();
