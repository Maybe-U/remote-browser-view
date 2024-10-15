// server.js
const WebSocket = require('ws');
const path = require('path');
const url = require('url');
const {URL} = require('url');
const { chromium } = require('playwright');
const { v4: uuidv4 } = require('uuid');
const querystring = require('querystring');
const EventReplayer = require('./EventReplayer.cjs') 

const clients = new Map();
const SpaceClientInfos = new Map();
const SpacePageMap = new Map();


let replayObj = new EventReplayer()
async function CreatePage(spaceId,openUrl,ws,listenPort,headless) {
    try {
      // Launch Playwright browser
      const browser = await chromium.launch({ 
          headless: headless,
          // devtools: true,  // 启用开发者工具
          args: ['--ignore-certificate-errors'],  // 忽略证书错误

       });
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,  
      });
      const page = await context.newPage();
  
      // 监听并处理新标签页请求
      page.on('popup', async (popup) => {
            // 获取新标签页的URL
            const url = popup.url();
            // 让当前页面导航到新标签页的URL
            await page.goto(url);
            await page.waitForLoadState('networkidle')
            // 关闭新标签页
            await popup.close();
        });

      // 监听所有请求
      page.on('request', async request => {
        try {
            const url = request.url();
            const method = request.method();
            const resourceType = request.resourceType();
            const headers = await request.allHeaders(); // Get request headers
            ws.send(JSON.stringify({"type":"request",data:{
              "url":url,
              "method":method,
              "resourceType":resourceType ,
              headers: headers 
            }}));

          } catch (error) {
            console.log(error)
          }
      });
      
      // 监听所有框架的导航事件
      page.on('framenavigated', async frame => {
        console.log(`Navigated to: ${frame.url()}`);
        try {
          if (!frame.parentFrame()) { // 确保是主框架
            ws.send(JSON.stringify({"type":"loading",data:{}}));
            await frame.waitForLoadState('domcontentloaded')
            // 加载 rrweb 的脚本
            await page.addScriptTag({ path: path.join(__dirname, 'rrweb.min.js') });
            const globalVar = { 
              spaceId: spaceId,
              listenPort:listenPort
            };
            await page.evaluate((globalVar) => {
              console.log("inject globalVar")
              // @ts-ignore
              window.InjectGlobalVar = globalVar;
            }, globalVar);
            // await page.addScriptTag({ path: path.join(__dirname, 'EventReplayer.js') });
            await page.addScriptTag({ path: path.join(__dirname, 'InjectTargetRRWeb.js') });

            const cookies = await context.cookies();
            ws.send(JSON.stringify({"type":"cookie",data:cookies}));
          }
        } catch (error) {
          console.log(error)
        }
      });
      await page.goto(openUrl);
      SpacePageMap.set(spaceId, page)
      await page.waitForLoadState('networkidle')
      return browser
    }  catch (error) {
      console.log(error)
    }

}

const ClientType = {
  WebReplay:1, //浏览器重放端。
  WebReplayInjectRecord:2, //浏览器重放端注入JS记录端
  ServerBrowserInjectRecord:3, //服务端注入rrweb三方页面端 ，注意跳转的时候会注入多次,负责回放服务器页面和客户端动作
}

/**
 * @typedef {import('playwright-core').LaunchOptions} LaunchOptions
 */

/**
 * @typedef {Object} ServerBrowserConfig
 * @property {string} listenAddr - listen address and port.
 * @property {Number} port - listen port.
 * @property {boolean} [headless] - playwright headless.
 * @property {LaunchOptions['proxy']} [playwrightProxy] - playwrightProxy 
 */
class ServerBrowser {
  listenAddr = ''
  port = 0
  headless = false

  playwrightProxy
  /**
   * @param {ServerBrowserConfig} config - The configuration object.
   */
  constructor(config) {
    if (!config.listenAddr) {
      console.warn('listenAddr is required.');
      return;
    }
    if (!config.port) {
      console.warn('port is required.');
      return;
    }
    if (Object.hasOwn(config, 'headless')) {
      this.headless = config.headless
    }
    if (Object.hasOwn(config, 'playwrightProxy')) {
      this.playwrightProxy = config.playwrightProxy
    }else{
      this.playwrightProxy = undefined
    }
    this.listenAddr = config.listenAddr
    this.port = config.port
  }
  
  async replayActions(actions,target) {
    try {
       // 启动浏览器
       const browser = await chromium.launch({ 
        headless: this.headless,
        devtools: false,  // 启用开发者工具
        proxy: this.playwrightProxy 
      });
      const page = await browser.newPage();

      page.on('popup', async (popup) => {
          // 获取新标签页的URL
          const url = popup.url();
          // 让当前页面导航到新标签页的URL
          await page.goto(url);
          await page.waitForLoadState('networkidle')
          // 关闭新标签页
          await popup.close();
      });

      let requests = []
      page.on('request', async request => {
        try {
            const url = request.url();
            const method = request.method();
            const resourceType = request.resourceType();
            const headers = await request.allHeaders(); // Get request headers
            requests.push({url,method,resourceType,headers})
          } catch (error) {
            console.log(error)
          }
      });

      // 导航到目标页面
      await page.goto(target);
      //等待没有网络请求了 在执行动作
      await page.waitForLoadState('load');
      await page.waitForLoadState('networkidle');
      
      let player = new EventReplayer()
      // 执行 JSON 文件中的动作
      for (const action of actions) {
        await player.replay(page,action)
        await page.waitForTimeout(500);
        await page.waitForLoadState('load');
      }
      console.log("action play done waitForURL")
      //等5秒在关闭
      await sleep(15000)
      // 关闭浏览器
      await browser.close();
    
      return requests
    } catch (error) {
      console.log(error)
    }
  }

  start() {
    // 创建 WebSocket 服务器
    const wss = new WebSocket.Server({host: this.listenAddr, port: this.port  });
    wss.on('connection', (ws,request) => {
    // 生成唯一 ID
    const uniqueId = uuidv4();
    // 解析请求的 URL
    const requestParse = url.parse(request.url);
        
    // 获取并解析查询参数
    // @ts-ignore
    const params = querystring.parse(decodeURIComponent(requestParse.query));

      const spaceId = params.spaceId;
      const openUrl = params.openUrl;
      if (!spaceId) {
        console.log('spaceId is null')
        ws.close(1000, 'Closing normally');
        return
      }

      let SpaceClient = {
        "ws":ws,
        "spaceId": spaceId,
        "type": -1,
        "data": undefined
      }
      clients.set(uniqueId,SpaceClient)
      let spaceClients = SpaceClientInfos.get(spaceId)
      if (!spaceClients) {
        spaceClients = {
          [ClientType.WebReplay]:false,
          [ClientType.WebReplayInjectRecord]:false,
          [ClientType.ServerBrowserInjectRecord]:false
        }
      }
      //初始链接创建浏览器
      if (requestParse.pathname === '/WebReplay') {
          SpaceClient.type = ClientType.WebReplay
          spaceClients[ClientType.WebReplay] = SpaceClient
          const browswer =  CreatePage(spaceId,openUrl,ws,this.port,this.headless)
          // @ts-ignore
          SpaceClient.data = browswer
      }
      
      //服务端浏览器链接
      if (requestParse.pathname === '/serverBrowser') {
          SpaceClient.type = ClientType.ServerBrowserInjectRecord
          spaceClients[ClientType.ServerBrowserInjectRecord] = SpaceClient
      }
      //前端iframe注入代码
      if (requestParse.pathname === '/WebReplayInjectRecord') {
          SpaceClient.type = ClientType.WebReplayInjectRecord
          spaceClients[ClientType.WebReplayInjectRecord] = SpaceClient
      }

      SpaceClientInfos.set(spaceId, spaceClients)

      ws.on('message', (message) => {
        try {
          let client = clients.get(uniqueId)
          let clientType = client.type
          let spaceId = client.spaceId
          if (clientType == ClientType.ServerBrowserInjectRecord){
              let getSpaceClientInfos = SpaceClientInfos.get(spaceId)
              let WebReplayClient = getSpaceClientInfos[ClientType.WebReplay]
              if (WebReplayClient){
                WebReplayClient.ws.send(message)
              }
            } 
          if (clientType == ClientType.WebReplayInjectRecord){
            let getSpaceClientInfos = SpaceClientInfos.get(spaceId)
            let ServerBrowserInjectRecordClient = getSpaceClientInfos[ClientType.ServerBrowserInjectRecord].ws
            
            // @ts-ignore
            let data =JSON.parse(message)
            if (data.type == "event"){
              let Page = SpacePageMap.get(spaceId) 
              let action = data.action 
              replayObj.replay(Page,action)
            }
            ServerBrowserInjectRecordClient.send(message)
          }
        } catch (error) {
          console.log(error)
        }
      });

      ws.on('close', async (ws) => {
        let client = clients.get(uniqueId)
        let clientType = client.type

        if (clientType == ClientType.WebReplay){
          let browser = client.data
          let spaceId = client.spaceId
          SpacePageMap.delete(spaceId)
          if (browser) {
            browser.then((b)=>{
              console.log("browser close")
              b.close()
            })

          }
          SpaceClientInfos.delete(spaceId)
        }
        clients.delete(uniqueId)
        console.log("client closed")
      });
      console.log('New client connected');
    });
    console.log('Server listening on '+this.listenAddr+':'+this.port);

  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports.ServerBrowser = ServerBrowser
  

