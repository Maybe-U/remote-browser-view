import WebReplayManager from 'remote-browser-view/dist/browser'

window.onload = function() {

    const button = document.getElementById('play');
    const printAction = document.getElementById('printAction');
    // 为按钮添加点击事件监听器
    button?.addEventListener('click', function() {

        let start = new WebReplayManager({
            "target":"https://www.airdroid.cn/",
            "PlaySelect":"#replay",
            "WebSocketUrl":"ws://127.0.0.1:6060/",
            "rrwebReplayConfig":{}
        })
       start.start()

       printAction?.addEventListener('click',function() {
           console.log("userAction:",start.getWebInteractionActions())
           console.log("Cookies:",start.getServerBrowserCookies())
           console.log("Connections:",start.getServerBrowserConnections(["fetch","xhr","document"]))
       })

       console.log("start")

    });


}


