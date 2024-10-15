const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const EventReplayer = require('./EventReplayer.cjs') 

function Run(){
    (async () => {
        // 读取 JSON 文件
        const filePath = path.resolve(__dirname, 'actions.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const actions = JSON.parse(fileContent);
    
        // 启动浏览器
        const browser = await chromium.launch({ 
            headless: false,
            devtools: false,  // 启用开发者工具
           });
        const page = await browser.newPage();
    
        // 导航到目标页面
        await page.goto('https://www.airdroid.cn/');
        
        let player = new EventReplayer()
        // 执行 JSON 文件中的动作
        for (const action of actions) {
            player.replay(page,action)
            await page.waitForTimeout(500);
        }
    
        await browser.close();
    })();
}
Run()

