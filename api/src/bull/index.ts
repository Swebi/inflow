import { scanQueue } from "./queues";
import { initScanWorker, initEmailWorker } from "./workers";

export { serverAdapter } from "./board";

export const initBull = async () => {
  initScanWorker();
  initEmailWorker();

  await scanQueue.add(
    "scan-all-users",
    {},
    {
      repeat: { every: 10 * 60 * 1000 },
    }
  );

  console.log("[bull] workers started, scan repeating every 10 minutes");
};
