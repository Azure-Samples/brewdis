const { categories, products, availability } = require('./responses');

describe('brewdis tests', () => {
  jest.setTimeout(40 * 1000);
  let page;

  beforeAll(async () => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({latitude: 49.283072, longitude: -123.14214399999997}); // Vancouver
    await mock(context, /products/, products);
    await mock(context, /categories/, categories);
    await mock(context, /availability/, availability);
  });

  beforeEach(async() => {
    page = await context.newPage();
    await page.goto('http://localhost:4200/');
  });

  it('should have correct title', async () => {
    expect(await page.title()).toContain('Brewdis');
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
    await page.waitForTimeout(1500);
    await screenshot(page, 'search.png');
  });

  it('shows map', async () => {
    await Promise.all([
      page.click('text=Availability'),
      page.waitForSelector('img[src="assets/store-high.svg"]')
    ]);
    await page.waitForTimeout(1500);
    await screenshot(page, 'map.png');
  });
})

async function screenshot(page, path) {
  const browser = browserName == 'webkit' ? 
    'safari' : browserName == 'chromium' ? 
    'edge' : browserName;
  return page.screenshot({ path: `__tests__/artifacts/${browser}-${path}` });
}

async function mock(context, filter, body) {
  return context.route(filter, (route, request) => {
    route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify(body)
    });
  });
}