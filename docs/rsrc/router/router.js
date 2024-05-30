// Router class
class Router extends Events {
    constructor() {
        super({});
        this.routes = new Map();
    }
    addRoute(path, handler) {
        if (this.isValidRoute(path)) {
            this.routes.set(path, handler);
        }
        else {
            console.warn(`Invalid route: ${path}`);
        }
    }
    navigate(path) {
        return new Promise((resolve, reject) => {
            if (this.routes.has(path)) {
                this.routes.get(path)()
                    .then(() => {
                    this.trigger('routeChange', { path });
                    resolve();
                })
                    .catch(reject);
            }
            else {
                reject(`Route not found: ${path}`);
            }
        });
    }
    isValidRoute(path) {
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
    pushState(path) {
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
    setHash(path) {
        return new Promise((resolve) => {
            location.hash = path;
            this.trigger('navigate', { path });
            resolve();
        });
    }
}
export {};
//# sourceMappingURL=router.js.map