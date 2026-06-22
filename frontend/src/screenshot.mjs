import { chromium } from 'playwright'

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
page.on('console', m => m.type()==='error' && console.log('ERR:', m.text().slice(0,100)))

await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(6000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/eye1-closed.png' })
console.log('1 hero')

await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2))
await page.waitForTimeout(2500)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/eye2-open.png' })
console.log('2 open')

await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.8))
await page.waitForTimeout(2500)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/eye3-zoom.png' })
console.log('3 zoom')

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.85))
await page.waitForTimeout(2000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/eye4-close.png' })
console.log('4 close')

await browser.close()
