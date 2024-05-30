import PromiseDom from '../router/events.js';


// Router class
class Router extends Events {
    routes: Map<string, Function>;
    
    constructor() {
      super({});
      this.routes = new Map();
    }
  
    addRoute(path: string, handler: Function) {
      if (this.isValidRoute(path)) {
        this.routes.set(path, handler);
      } else {
        console.warn(`Invalid route: ${path}`);
      }
    }
  
    navigate(path: string): Promise<void> {
      return new Promise((resolve, reject) => {
        if (this.routes.has(path)) {
          this.routes.get(path)()
            .then(() => {
              this.trigger('routeChange', { path });
              resolve();
            })
            .catch(reject);
        } else {
          reject(`Route not found: ${path}`);
        }
      });
    }
  
    isValidRoute(path: string): boolean {
      return !path.includes('../');
    }
  }
  
  // History class
  class History extends Events {
    constructor() {
      super({});
      window.onpopstate = (event) => {
        if (event.state && event.state.path) {
          this.trigger('navigate', { path: event.state.path });
        }
      };
    }
  
    pushState(path: string): Promise<void> {
      return new Promise((resolve) => {
        history.pushState({ path }, '', path);
        this.trigger('navigate', { path });
        resolve();
      });
    }
  }
  
  // Hash class
  class Hash extends Events {
    constructor() {
      super({});
      window.addEventListener('hashchange', () => {
        const path = location.hash.slice(1);
        this.trigger('navigate', { path });
      });
    }
  
    setHash(path: string): Promise<void> {
      return new Promise((resolve) => {
        location.hash = path;
        this.trigger('navigate', { path });
        resolve();
      });
    }
  }
  
  
  