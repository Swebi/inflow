import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Inflow",
    description:
      "Spot actionable emails in Gmail and turn them into calendar events or tasks — you stay in the loop.",
    permissions: ["tabs", "activeTab", "sidePanel", "storage", "scripting"],
    host_permissions: ["*://mail.google.com/*"],
    action: {
      default_title: "Open Inflow",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
  webExt: {
    chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
  },
});
