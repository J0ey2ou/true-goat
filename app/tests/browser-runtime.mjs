// No user-specific runtime paths are committed. A local bundled installation
// may be selected explicitly through GOAT_PLAYWRIGHT_MODULE.
export const { chromium } = await import(process.env.GOAT_PLAYWRIGHT_MODULE || 'playwright');
export const browserOptions = {
  headless:true,
  ...(process.env.GOAT_BROWSER_EXECUTABLE || process.env.GOAT_TEST_BROWSER
    ? {executablePath:process.env.GOAT_BROWSER_EXECUTABLE || process.env.GOAT_TEST_BROWSER}
    : process.platform === 'win32' ? {channel:'msedge'} : {})
};
