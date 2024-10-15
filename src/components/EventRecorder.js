import {getUniqueSelector} from '../utils/dom.js'
// eventRecorder.js
class EventRecorder {
    constructor(socket) {
      this.socket = socket;
    }
    recordClick(event) {
        // `iframe` 页面代码
        // 阻止事件的默认行为（例如链接的跳转）
        event.preventDefault();
        const uniqueSelector = getUniqueSelector(event.target);
        const eventData = {
            select:uniqueSelector,
            type: 'click',
            x: event.clientX ? event.clientX : 0,
            y: event.clientY ? event.clientY : 0,
            timestamp: Date.now()
        };
        this.sendEvent(eventData);
    }

    recordFocus(event) {
        const uniqueSelector = getUniqueSelector(event.target);
        const eventData = {
            select:uniqueSelector,
            type: 'focus',
            x: event.clientX ? event.clientX : 0,
            y: event.clientY ? event.clientY : 0,
            timestamp: Date.now()
        };
        this.sendEvent(eventData);
    }
    recordFocusOut(event) {
        const uniqueSelector = getUniqueSelector(event.target);
        const eventData = {
            select:uniqueSelector,
            type: 'focusout',
            x: event.clientX ? event.clientX : 0,
            y: event.clientY ? event.clientY : 0,
            timestamp: Date.now()
        };
        this.sendEvent(eventData);
    }
  
  
    recordInput(event) {
        const uniqueSelector = getUniqueSelector(event.target);
        const eventData = {
            select:uniqueSelector,
            type: 'input',
            value: event.target.value,
            id: event.target.id,
            timestamp: Date.now()
        };
        this.sendEvent(eventData);
    }


    recordMousemove(event) {
      const eventData = {
          type: 'mousemove',
          x: event.clientX,
          y: event.clientY
      };
      //ignore move temporarily
      // this.sendEvent(eventData);
    }
  
    sendEvent(eventData) {
      let toParentData = Object.assign({}, eventData, { fromIframe: true});
      window.parent.postMessage(toParentData, '*');
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'event', action: eventData}));
      } else {
        console.error('WebSocket is not open. Cannot send event.');
      }
    }
  }
  
  export default EventRecorder;
  