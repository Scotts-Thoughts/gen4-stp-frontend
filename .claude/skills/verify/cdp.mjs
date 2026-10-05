// usage: node cdp.mjs eval "<expr>" | node cdp.mjs shot out.png
const [,, cmd, arg] = process.argv
const targets = await (await fetch('http://127.0.0.1:9333/json')).json()
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await new Promise(r => ws.onopen = r)
let id = 0
const send = (method, params = {}) => new Promise(res => {
  const my = ++id
  const h = (e) => { const m = JSON.parse(e.data); if (m.id === my) { ws.removeEventListener('message', h); res(m.result) } }
  ws.addEventListener('message', h)
  ws.send(JSON.stringify({ id: my, method, params }))
})
if (cmd === 'eval') {
  const r = await send('Runtime.evaluate', { expression: arg, returnByValue: true, awaitPromise: true })
  console.log(typeof r.result.value === 'string' ? r.result.value : JSON.stringify(r.result.value ?? r))
} else if (cmd === 'shot') {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  ;(await import('fs')).writeFileSync(arg, Buffer.from(r.data, 'base64'))
  console.log('saved', arg)
}
ws.close()
