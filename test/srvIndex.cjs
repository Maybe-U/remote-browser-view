let server = require("remote-browser-view/dist/node/index.cjs")

let start = new server.ServerBrowser(
    {
        "listenAddr":"0.0.0.0",
        "port":6060,
        "headless":true
    }
)
start.start()


