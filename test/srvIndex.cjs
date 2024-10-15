let actions = require("./test.action.json")
let server = require("../srv/index.cjs")
let start = new server.ServerBrowser(
    {
        "listenAddr":"0.0.0.0",
        "port":6060,
        "headless":false
    }
)
start.start()


let headers = start.replayActions(actions,"http://www.baidu.com")
headers.then(res => {
    console.log(res)
})
