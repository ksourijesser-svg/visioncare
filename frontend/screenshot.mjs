import { chromium } from 'playwright'

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
})
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(4000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/landing-hero.png' })
console.log('DONE')

// Scroll halfway and screenshot
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
await page.waitForTimeout(2000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/landing-scroll.png' })
console.log('SCROLL DONE')

await browser.close()
