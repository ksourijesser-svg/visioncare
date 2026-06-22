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
await page.waitForTimeout(7000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/landing-hero.png' })
console.log('DONE')

// Scroll to retina section (80% into 3D scene)
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3.5))
await page.waitForTimeout(2500)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/landing-retina.png' })
console.log('RETINA DONE')

// Scroll past the 3D scene into normal page content
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 5.5))
await page.waitForTimeout(1500)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/landing-below.png' })
console.log('SCROLL DONE')

if (errors.length) console.log('ERRORS:', errors.join('\n'))
await browser.close()
