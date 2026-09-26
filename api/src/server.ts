import express from "express";
import dotenv from "dotenv";
import { authRouter } from "./routers/auth.router";
import { emailRouter } from "./routers/email.router";
import { googleRouter } from "./routers/google.router";
import { calendarRouter } from "./routers/calendar.router";
import { tasksRouter } from "./routers/tasks.router";
import { actionsRouter } from "./routers/actions.router";
import { agentRouter } from "./routers/agent.router";
import { telegramRouter } from "./routers/telegram.router";
import { errorHandler } from "./middlewares/errorHandler";
import { ensureCheckpointerSetup } from "./agents/email/checkpointer";
import { initBull, serverAdapter } from "./bull";
import { bot } from "./services/telegram.service";

import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/email", emailRouter);
app.use("/api/google", googleRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/actions", actionsRouter);
app.use("/api/agent", agentRouter);
app.use("/api/telegram", telegramRouter);
app.use("/admin/queues", serverAdapter.getRouter());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

ensureCheckpointerSetup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    initBull();
    if (bot) {
      bot.launch();
      console.log("Telegram bot is polling for updates");
    }
  })
  .catch((err) => {
    console.error("Failed to set up LangGraph checkpointer", err);
    process.exit(1);
  });
