import WebReplayManager from '../web/index.js'
let start = new WebReplayManager({
     "target":"https://www.airdroid.cn/",
    "PlaySelect":"#replay",
    "WebSocketUrl":"ws://127.0.0.1:6061/",
    "rrwebReplayConfig":{}
})
start.start()

setInterval(()=>{
    console.log(start.getWebInteractionActions())
    console.log(start.getServerBrowserCookies())
    console.log(start.getServerBrowserConnections(["fetch","xhr","document"]))
},1000)