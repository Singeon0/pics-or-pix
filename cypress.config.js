const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    chromeWebSecurity: false,
    video: true,
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
  // Configure various viewports
  viewportConfigs: [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'laptop' },
    { width: 1920, height: 1080, name: 'desktop' }
  ]
});