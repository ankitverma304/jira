import cors from "cors";
import express from "express";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

function isAllowedOrigin(origin?: string) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  return env.CLIENT_URLS.some((allowedOrigin) => {
    const normalizedAllowedOrigin = normalizeOrigin(allowedOrigin);

    if (normalizedAllowedOrigin.includes("*")) {
      const pattern = new RegExp(
        `^${normalizedAllowedOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*")}$`
      );
      return pattern.test(normalizedOrigin);
    }

    return normalizedAllowedOrigin === normalizedOrigin;
  });
}

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use("/api", routes);
app.use(errorHandler);
