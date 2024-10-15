/**
 * @typedef {import('playwright').Page} Page
 */

const ELEMENT_WAIT_TIMEOUT = 90000
class EventReplayer {
    constructor() {

    }
    /**
     * 
     * @param {Page} page 
     * @param {Object} action 
     * @returns 
     */
    async replay(page,action) {
      try {
        const selector = action.select;
        if (page && action.type == "click"){
          const element = await page.locator(selector); 
          let count = await element.count()
          if (count > 0) {
              if (count == 1){
                await element.click({
                    timeout: ELEMENT_WAIT_TIMEOUT
                }); // 触发点击事件
              }
              if (count > 1){ //多个时候出发第一个，保证兼容性
                await element.nth(0).click({
                  timeout: ELEMENT_WAIT_TIMEOUT
              });
              }
          }else{
              page.mouse.click(action.x, action.y);
          }
        }
        if (page && action.type == "mousemove"){
            page.mouse.move(action.x, action.y);
        }
        if (page && action.type == "mousemove"){
            page.mouse.move(action.x, action.y);
        }
        if (action.type === 'input') {
            const element = await page.locator(selector); 
            const value = action.value;
            await element.fill(value);
        }
      } catch (error) {
        console.log(error)
      }
    }
  }

module.exports = EventReplayer

  