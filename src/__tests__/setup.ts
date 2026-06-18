import { beforeAll, afterAll } from "vitest";

(process.env as Record<string, string>).DATABASE_URL = "postgres://postgres:postgres@localhost:5432/allesteden_test?sslmode=disable";
(process.env as Record<string, string>).REDIS_URL = "redis://localhost:6379";

beforeAll(() => {
});

afterAll(() => {
});
