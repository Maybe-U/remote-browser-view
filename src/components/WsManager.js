import  * as strTool  from '../utils/strTool' 
/**
 * @typedef {Object} Config
 * @property {string} target - The open url.
 */

class WsManager {
    target = ''
    constructor(config){
        this.target = config.target
        this.socket = undefined
        this.onmessage = undefined
        if (config.onmessage){
            this.onmessage = config.onmessage
        }
    }
    init(){
        if (!this.onmessage){
            this.onmessage = this.reviced
        }
        this.socket = new WebSocket(this.target)
        if (!this.socket){
            console.warn('WebSocket connection failed.');
            return
        }
        // WebSocket 连接打开时
        this.socket.onopen = () => {
            console.log('WebSocket connection opened.',this.target);
        };
            // WebSocket 连接关闭时
        this.socket.onclose = () => {
            console.log('WebSocket connection closed.',this.target);
        };
  
        // 错误处理
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error,this.target);
        };
        this.socket.onmessage = (event) => {
            let that = this
            let data = event.data
            if (data instanceof Blob) {
                const reader = new FileReader();

                reader.onload = function(event) {
                    let result = event.target.result;
                    that.onmessage(result)
                };
                reader.readAsText(data);
            }else {
                this.onmessage(data)
            }

        }
    }
    start(){
        this.init()
    }
    reviced(data){
        console.log(data)
    }

    send(data){
        if (strTool.isJSONObject(data)) {
            data = JSON.stringify(data)
        }else if (strTool.isJSONString(data)){
            data = data
        }else{
            console.warn('send data failed, data format error.');
            return
        }
        if (!this.socket){
            console.warn('send data failed, WebSocket connection failed.');
            return
        }
        // @ts-ignore
        this.socket.send(data)
    }
    close(){
        if (this.socket){
            this.socket.close()
        }
    }
}

export default WsManager