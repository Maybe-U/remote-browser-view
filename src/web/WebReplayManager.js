// @ts-nocheck
import {Replayer, EventType, IncrementalSource} from 'rrweb'
// MouseInteractions, ReplayerEvents,

// @ts-ignore
import iframeCapture from '../components/iframeCapture.js'

import WsManager from '../components/WsManager.js'

/**
 * @callback Callback
 */

/**
 * @typedef {Object} WebReplayManagerConfig
 * @property {string} target - The open url.
 * @property {string} PlaySelect - The identify element id.
 * @property {string} WebSocketUrl - The WebSocket url.
 * @property {rrwebReplayConfig} rrwebReplayConfig - the rrweb replay config.
 */

/**
 * @typedef  {Object} rrwebReplayConfig
 */



class WebReplayManager {
    /**
     * @property {string} target
     * @property {Callback} renderFinish - when render finish callback
     * @property {Callback} renderLoading - when render loading callback.
     * @property {Callback} actionCallback - user operation callback.
     * @property {Callback} requestCallback- browser request callback.
     * @property {Callback} onErrorCallback- browser request callback.
     */
    target = ''
    PlaySelect = ''
    WebReplayConnectUrl = ''
    WebIframeConnectUrl = ''
    rrwebReplayConfig = {}
    SpaceId = ''
    rrwebInstance = null

    renderFinish = () => {}
    renderLoading = () => {}
    actionCallback = (data) => {}
    requestCallback = (data) => {}
    onErrorCallback = (data) => {}

    /**
     * @type WsManager 
     **/
    wsManager  
    /**
     * 浏览器交互操作动作
     */
    webInteractionActions = []
    /**
     * 服务端浏览器请求资源
     */
    serverBrowserConnections = []

    /**
     * 服务端浏览器Cookies
     */

    serverBroserCookies = []

    /**
     * @type {Window}
     */
    iframeWindow

    postMsgEvent = () => {}

    /**
     * @param {WebReplayManagerConfig} config - The configuration object.
     */
    constructor(config) {
        this.SpaceId = CreateSpaceId()
        this.target = config.target;
        this.PlaySelect = config.PlaySelect;
        if (!config.WebSocketUrl ){
            console.warn('WebSocketUrl is required.');
            return
        }
        const url = new URL(config.WebSocketUrl);
        const protocol = url.protocol; // 'ws:'
        const hostname = url.hostname; // 'example.com'
        const port = url.port; // '8080'
        let queryStr = 'spaceId='+this.SpaceId+"&openUrl="+encodeURIComponent(this.target)
        let parseUrl = protocol + "//" + hostname
        if (port == '80' || port == '443' || port == ''){
            //不需要拼接端口
        }else{
            parseUrl = protocol + "//" + hostname + ":" + port
        }
        
        this.WebReplayConnectUrl = parseUrl +"/WebReplay?"+queryStr
        this.WebIframeConnectUrl = parseUrl +"/WebReplayInjectRecord?"+'spaceId='+this.SpaceId
        this.rrwebReplayConfig = config.rrwebReplayConfig;
        this.init()
    }
    init(){
        this.initRRWeb()
        this.initWebSocket()
        this.registerPostMsg() 
    }

    revicePostMsg(event){
        let that = this
        if (event.data.fromIframe){
            that.webInteractionActions.push(event.data)
            if (that.actionCallback){
                that.actionCallback(event.data)
            }
        }
    }
    registerPostMsg(){
        this.postMsgEvent = this.revicePostMsg.bind(this)
        window.addEventListener('message', this.postMsgEvent);
    }
    getWebInteractionActions(){
        return this.webInteractionActions
    }
    getServerBrowserCookies(){
        return this.serverBroserCookies
    }
    /**
   * 
   * @param {('fetch'|'xhr'|'script'|'image'|'document'|'stylesheet')[]} resourceType 
   * @returns 
   */
    getServerBrowserConnections(resourceType){
        if (resourceType){
            return this.serverBrowserConnections.filter((item)=>{
                return resourceType.includes(item.resourceType)
            })
        }
        return this.serverBrowserConnections
    }
    initWebSocket(){
        let wsManager = new WsManager({
            target:this.WebReplayConnectUrl,
            onmessage:(data)=>{
                let parse = JSON.parse(data) 
                //rrweb数据
                if (parse.type>=0 && parse.data){
                    if (parse.type == EventType.IncrementalSnapshot){
                        if (parse.data &&parse.data.text != "" && parse.data.source == IncrementalSource.Input){
                            //忽略这些input的数据，防止相互影响，等于空的时候忽略
                            return
                        }
                    }
                    this.rrwebInstance && this.rrwebInstance.addEvent(parse)
                }
                if (parse.type=="request"){
                    this.serverBrowserConnections.push(parse.data)
                    if (this.requestCallback){
                        this.requestCallback(parse.data)
                    }
                }
                if (parse.type=="cookie"){
                     let mergedUniqueArray = [...new Set([...this.serverBroserCookies, ...parse.data])];
                     this.serverBroserCookies = mergedUniqueArray
                }
                if (parse.type=="loading"){
                    if (this.renderLoading){
                        this.renderLoading()
                    }
                }
            }
        })
        this.wsManager = wsManager 
        this.wsManager.start() 
    }
    initRRWeb(){
        const element = document.querySelector(this.PlaySelect);
        let defaultRRwebConfig = {
            root:element,
            liveMode: true,
            mouseTail: false,
            UNSAFE_replayCanvas:true,
        }
        if (this.rrwebReplayConfig) {
            defaultRRwebConfig = Object.assign(defaultRRwebConfig, this.rrwebReplayConfig)
        }
        this.rrwebInstance = new Replayer([], defaultRRwebConfig);
        //监听回放完成事件
        this.rrwebInstance.on('finish',async () => {
            let iframeW = await  WriteJsCode(element,this.WebIframeConnectUrl)
            if (iframeW !==false){
                this.iframeWindow = iframeW
            }
            if (this.renderFinish){
                    this.renderFinish()
            }
        });      
    }
    start() {
        this.rrwebInstance.enableInteract();
        this.rrwebInstance.startLive()
    }
    stop() {
        window.removeEventListener('message',this.postMsgEvent);
        if (this.iframeWindow){
            let document = this.iframeWindow.document
            const events = ['click', 'keydown', 'mousemove', 'scroll', 'resize'];
            events.forEach(event => {
                document.removeEventListener(event, null);
            });
        }
        this.rrwebInstance.destroy();
        this.rrwebInstance = null;
        this.wsManager.close()
    }
}
function CreateSpaceId(){
    return  Math.random().toString(36).substr(2, 9);
}

async function WriteJsCode(containter,ConnetcUrl,onErrorCallback){
    const iframe = containter.querySelector('iframe');
    if (iframe){
      const scriptId = 'iframe-record-user-actions-script';
      const iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      let existingScript = iframeDoc.getElementById(scriptId);
      if (!existingScript  && iframeDoc.body && iframeDoc.body.innerHTML ) {
        iframe.contentWindow.iframeCapture = iframeCapture;
        const script = iframeDoc.createElement('script');
        script.id = scriptId;
        script.type = 'module';
        script.textContent = `
            console.log('load iframe iframeCapture');
            let url = '${ConnetcUrl}'
            let newCapture = new iframeCapture({
                wsUrl:url,
                document:document
            })
            newCapture.start()
        `
        iframeDoc.body.appendChild(script);
        return iframe.contentWindow
      }
    }
    return false
}

export default WebReplayManager