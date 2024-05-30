// Regex constants
const PARAMS_REGEX = /[:*](\w+)/g;
const PARAM_VARIABLE = "([^/]+)";
const FOLLOWED_BY_SLASH = "(?:/$|$)";
class Router {
    constructor(root) {
        this.routes = [];
        this.root = root ? root : window.location.origin;
        this.go = this.go.bind(this);
    }
    init() {
        return new Promise((resolve, reject) => {
            this.redefineLinks();
            window.addEventListener("popstate", () => {
                this.onChange().then(resolve).catch(reject);
            });
            this.onChange().then(resolve).catch(reject);
        });
    }
    redefineLinks() {
        const links = Array.from(document.querySelectorAll("a[data-router]"));
        for (const link of links) {
            link.addEventListener("click", this.go);
        }
    }
    on(path, handler) {
        let params = path.match(PARAMS_REGEX);
        if (params) {
            params = params.map(param => param.replace(":", ""));
        }
        this.routes.push({
            path,
            handler,
            params: params || undefined
        });
        return this;
    }
    notFound(handler) {
        this._notFound = handler;
        return this;
    }
    navigate(path) {
        return new Promise((resolve, reject) => {
            const url = `${this.root}${path}`;
            try {
                window.history.pushState(null, '', url);
                this.onChange().then(resolve).catch(reject);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    replace(route) {
        const names = [];
        const regex = new RegExp(route.path.replace(PARAMS_REGEX, (_, name) => {
            names.push(name);
            return PARAM_VARIABLE;
        }) + FOLLOWED_BY_SLASH);
        return { regex, names };
    }
    getParams(match, names) {
        if (!names || names.length === 0 || !match)
            return null;
        const params = {};
        for (let index = 0; index < names.length; index++) {
            const paramValue = match[index + 1];
            if (paramValue !== undefined) {
                params[names[index]] = paramValue;
            }
        }
        return params;
    }
    findRoutes(path) {
        return this.routes
            .map(route => {
            const { regex, names } = this.replace(route);
            const match = path.replace(/^\/+/, "/").match(regex);
            const params = this.getParams(match, names);
            return match ? { match, route, params } : null;
        })
            .filter((m) => m !== null);
    }
    match(path) {
        return this.findRoutes(path)[0] || null;
    }
    onChange() {
        return new Promise((resolve) => {
            let url = window.location.pathname;
            const query = window.location.search;
            if (this.root) {
                url = url.replace(this.root, "");
            }
            const m = this.match(url);
            if (!m) {
                if (this._notFound)
                    this._notFound(query);
                resolve();
            }
            else {
                const { route, params } = m;
                route.handler(this.getQueryParams(query), params || undefined).then(() => resolve());
            }
        });
    }
    getQueryParams(query) {
        const params = new URLSearchParams(query);
        const queryParams = {};
        params.forEach((value, key) => {
            queryParams[key] = value;
        });
        return queryParams;
    }
    go(event) {
        event.preventDefault();
        const target = event.target;
        const link = target.closest('a');
        if (!link)
            return;
        const query = link.search;
        const pathname = link.pathname;
        const url = query
            ? `${this.root}${pathname}${query}`
            : `${this.root}${pathname}`;
        try {
            window.history.pushState(null, '', url);
            this.onChange();
        }
        catch (error) {
            console.error("Error navigating:", error);
        }
    }
}
export { Router };
//# sourceMappingURL=router.js.map