
let server = require("../dist/node/index.cjs")
let actions = require("./test.action.json")

let replayAction = server.ReplayActions

let requests = replayAction(actions,"https://www.airdroid.cn/",false)
requests.then(res => {
    console.log(res)
})
