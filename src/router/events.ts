// Simple Vanilla JS Event System in TypeScript

class Emitter {
    private obj: any;
    private eventTarget: DocumentFragment;
  
    constructor(obj: any) {
      this.obj = obj;
      this.eventTarget = document.createDocumentFragment();
      ["addEventListener", "dispatchEvent", "removeEventListener"].forEach(
        this.delegate,
        this
      );
    }
  
    private delegate(method: string) {
      (this.obj as any)[method] = (this.eventTarget as any)[method].bind(this.eventTarget);
    }
  }
  
  class Events {
    private host: any;
  
    constructor(host: any) {
      this.host = host;
      new Emitter(host); // add simple event system
      host.on = (eventName: string, func: EventListenerOrEventListenerObject) => {
        host.addEventListener(eventName, func);
        return host;
      };
    }
  
    trigger(event: string | Event, detail?: any, ev?: Event) {
      if (typeof event === "object" && event instanceof Event) {
        return this.host.dispatchEvent(event);
      }
  
      if (!ev) ev = new Event(event, { bubbles: false, cancelable: true });
  
      ev.detail = { ...(detail || {}), host: this.host };
  
      return this.host.dispatchEvent(ev);
    }
  }
  
  export default Events;
  