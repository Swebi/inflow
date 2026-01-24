import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ["tabs", "activeTab", "sidePanel"],
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
