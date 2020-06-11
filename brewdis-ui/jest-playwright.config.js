module.exports = {
  launchBrowserApp: {
    headless: true
  },
  browsers: ['chromium', 'firefox', 'webkit'],
  server: {
    command: 'npm run start',
    launchTimeout: 30000,
    port: 4200
  }
}