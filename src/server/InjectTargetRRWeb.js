 // 连接到 WebSocket 服务器
 //@ts-nocheck
 const socket = new WebSocket('ws://localhost:'+InjectGlobalVar.listenPort+'/serverBrowser?spaceId='+InjectGlobalVar.spaceId);

 let stopFn = undefined;
 socket.onopen = () => {
   console.log('Connected to WebSocket server');
   // 开始记录用户操作
   // @ts-ignore
   stopFn = rrweb.record({
     inlineStylesheet:true,
     inlineImages:true,
     maskInputOptions:{
       password:false
     },
     emit(event) {
             //将事件发送到服务器
             socket.send(JSON.stringify(event));
         },
       hooks: {
         mutation: (mutationData) => {
         },
         mousemove: (mouseMoveData) => {
         },
         scroll: (scrollData) => {
         },
         viewportResize: (resizeData) => {
         },
         // You can add other hooks similarly
       }
      
   });
 };

 socket.onerror = (error) => {
   console.log('WebSocket error: ', error);
 };

 socket.onclose = () => {
   if (stopFn){
     stopFn()
   }
   socket.close()  
   console.log('WebSocket connection closed');
 };
