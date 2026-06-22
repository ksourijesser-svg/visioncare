import { chromium } from 'playwright'

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
})
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(e.message))
await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 })
const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))
console.log('WebGL2 available:', webgl)
await page.waitForTimeout(4000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/landing-hero.png' })
console.log('DONE')

// Scroll halfway and screenshot
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
await page.waitForTimeout(2000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/landing-scroll.png' })
console.log('SCROLL DONE')

if (errors.length) console.log('ERRORS:', errors.join('\n'))
await browser.close()
