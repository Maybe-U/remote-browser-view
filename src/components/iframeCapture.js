import EventRecorder from './EventRecorder.js';

/**
 * @typedef {Object} Config
 * @property {string} wsUrl - wsSocketUrl.
 * @property {string} document - iframe document
 */
class iframeCapture {
    constructor(config) {
        this.wsUrl = config.wsUrl
        this.document = config.document
    }
    start(){
        if (typeof window["socket"] !== 'undefined'){
            return
        }
        const socket = new WebSocket(this.wsUrl); // 替换为你的 WebSocket 服务器地址

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        }
        // 实例化事件记录器，并将 WebSocket 传递给它
        const recorder = new EventRecorder(socket);
        //点击事件通过playwright触发
         this.document.addEventListener('click', (event) => recorder.recordClick(event),true);
         this.document.addEventListener('input', (event) => recorder.recordInput(event),true);
         this.document.addEventListener('focus', (event) => recorder.recordFocus(event),true);
         this.document.addEventListener('mousemove', (event) => recorder.recordMousemove(event),true);
    
    }
}
export default iframeCapture


