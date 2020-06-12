describe('brewdis tests', () => {
  jest.setTimeout(35 * 1000);
  let page;

  beforeAll(async () => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({latitude: 34.0522, longitude: -118.2437}); // Los Angeles
  });

  beforeEach(async() => {
    page = await context.newPage();
    await page.goto('https://brewredis-spring-storefront.azuremicroservices.io/');
  });

  it('should have correct title', async () => {
    expect(await page.title()).toBe('Brewdis');
  });

  it('should be able to search', async () => {
    await page.fill('[placeholder=Search]', 'ipa');
    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForSelector('mat-card-title'),
    ]);
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('mat-card img');
      return images && images.length && [...images].map(e => e.complete).every(Boolean);
    });
    await page.waitForTimeout(500);
    await screenshot(page, 'search.png');
  });

  it('shows map', async () => {
    await Promise.all([
      page.click('text=Availability'),
      page.waitForSelector('img[src="assets/store-low.svg"]')
    ]);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, 'map.png');
  });
})

async function screenshot(page, path) {
  const browser = browserName == 'webkit' ? 
    'safari' : browserName == 'chromium' ? 
    'edge' : browserName;
  return page.screenshot({ path: `__tests__/artifacts/${browser}-${path}` });
}