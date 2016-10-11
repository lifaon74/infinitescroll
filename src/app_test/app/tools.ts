// var AsyncManager = {};
// AsyncManager.registered = {};
//
// AsyncManager.Event = function(name, listener) {
//
// };
//
// AsyncManager.register = function(name, async) {
//   if(AsyncManager.registered[name]) {
//     AsyncManager.unregister(name);
//   }
//
//   AsyncManager.registered = async;
// };
//
// AsyncManager.unregister = function(name) {
//   if(async instanceof AsyncManager.Event) {
//
//   }
// };

export let makeEventTarget = function(object:any) {

  object.$on = function(type:string, listener:any) {
    var self = this;
    switch(type) {
      case '$mousewheel':
        var mousewheelListener = function(event:any) {
          event.delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
          return listener(event);
        };

        var offMousewheel     = this.$on('mousewheel', mousewheelListener);
        var offDOMMouseScroll = this.$on('DOMMouseScroll', mousewheelListener);

        return function() {
          offMousewheel();
          offDOMMouseScroll();
        };
      default:
        this.addEventListener(type, listener, false);
        return function() {
          self.removeEventListener(type, listener, false);
        };
    }


  };

  object.on = function(type:string, listener:any, useCapture:boolean) {
    if(typeof useCapture !== 'boolean') {
      useCapture = false;
    }

    this.addEventListener(type, listener, useCapture);
    return listener;
  };

  object.off = function(type:string, listener:any, useCapture:boolean) {
    if(typeof useCapture !== 'boolean') {
      useCapture = false;
    }

    this.removeEventListener(type, listener, useCapture);
  };

  object.emit = function(event:any|string) {
    if(typeof event === 'string') {
      event = new Event(event);
    }
    return this.dispatchEvent(event);
  };

  return object;
};

export let makeDraggable = function(element:Element | any, options:any) {
  let dragObj:any = { drag: null };

  options.onDragStart = options.onDragStart || (() => {});
  options.onDragMove = options.onDragMove || (() => {});
  options.onDragEnd = options.onDragEnd || (() => {});

  let bindAction = function(element: any, action: any) {
    action.events.forEach((eventName: string) => {
      element.addEventListener(eventName, action.callback, false);
    });
  };

  let unbindAction = function(element: any, action: any) {
    action.events.forEach((eventName: string) => {
      element.removeEventListener(eventName, action.callback);
    });
  };

  let refreshDrag = function(event: any) {
    dragObj.drag.event = event;
    dragObj.drag.deltaX = dragObj.drag.event.clientX - dragObj.drag.startPosition.x;
    dragObj.drag.deltaY = dragObj.drag.event.clientY - dragObj.drag.startPosition.y;
  };

  let actions = {
    down: {
      events: ['mousedown', 'touchstart'],
      callback: (event: any) => {
        if(event.type === 'touchstart') {
          event.clientX = event.touches[0].clientX;
          event.clientY = event.touches[0].clientY;
        }

        dragObj.drag = {
          event: event,
          startPosition: {
            x: event.clientX,
            y: event.clientY
          },
          deltaX: 0,
          deltaY: 0
        };

        let result = options.onDragStart(dragObj.drag);
        if(result === false) {
          dragObj.drag = null;
        } else {
          bindAction(window, actions.move);
          bindAction(window, actions.up);
        }
      }
    },
    move: {
      events: ['mousemove', 'touchmove'],
      callback: (event:any) => {
        if(event.type === 'touchmove') {
          event.clientX = event.touches[0].clientX;
          event.clientY = event.touches[0].clientY;
        }

        if(dragObj.drag) {
          refreshDrag(event);
          options.onDragMove(dragObj.drag);
        }
      }
    },
    up: {
      events: ['mouseup', 'touchend'],
      callback: (event:any) => {
        if(dragObj.drag) {
          if(event.type !== 'touchend') {
            refreshDrag(event);
          }

          options.onDragEnd(dragObj.drag);

          unbindAction(window, actions.move);
          unbindAction(window, actions.up);

          dragObj.drag = null;
        }
      }
    }
  };

  bindAction(element, actions.down);

  return () => {
    unbindAction(element, actions.down);
  };
};




