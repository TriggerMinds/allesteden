import pino from "pino";

export function createJobLogger(jobId?: string, queueName?: string) {
  return pino({
    name: "allesteden-worker",
    level: process.env.LOG_LEVEL ?? "info",
    formatters: {
      bindings(bindings) {
        return {
          ...bindings,
          jobId,
          queue: queueName,
        };
      },
    },
    transport:
      process.env.NODE_ENV === "development"
        ? { target: "pino-pretty" }
        : undefined,
  });
}
