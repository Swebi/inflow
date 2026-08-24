import cron from "node-cron";
import { handleScanAllUsers } from "../services/agent.service";

export const startEmailScanJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      await handleScanAllUsers();
    } catch (error) {
      console.error("Scheduled email scan failed", error);
    }
  });
};
