import { defineConfig } from "cypress";

export default defineConfig({
  includeShadowDom: true,
  e2e: {
    baseUrl: 'http://localhost:8000/cypress/fixtures/'
  },
});
