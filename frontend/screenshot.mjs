import { chromium } from 'playwright'

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
page.on('console', m => { if (m.type()==='error') console.log('ERR:', m.text().slice(0,120)) })

await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(6000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/s1-hero.png' })
console.log('hero')

await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
await page.waitForTimeout(2500)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/s2-explode.png' })
console.log('explode')

await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3))
await page.waitForTimeout(2500)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/s3-inside.png' })
console.log('inside')

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(2000)
await page.screenshot({ path: 'C:/Users/jasserk/Desktop/s4-bottom.png' })
console.log('bottom')

await browser.close()
