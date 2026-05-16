import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    PORT: z.string().default("4000"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(8),
    CLIENT_URL: z.string().min(1)
});
const parsed = envSchema.parse(process.env);
export const env = {
    ...parsed,
    CLIENT_URLS: parsed.CLIENT_URL.split(",")
        .map((value) => value.trim())
        .filter(Boolean)
};
