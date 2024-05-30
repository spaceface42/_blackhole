// Regex constants
const PARAMS_REGEX = /[:*](\w+)/g;
const REPLACE_VARIABLE_REGEXP = "([^/]+)";
const FOLLOWED_BY_SLASH = "(?:/$|$)";
class Router {
    constructor(root) {
        this.routes = [];
        this.root = root ? root : window.location.origin;
        this.go = this.go.bind(this);
    }
    /**
     * Initialize the router
     */
    init() {
        this.redefineLinks();
        window.addEventListener("popstate", () => this.onChange());
        this.onChange();
    }
    /**
     * Collect links and
     * add event listeners
     */
    redefineLinks() {
        const links = Array.from(document.querySelectorAll("a[data-router]"));
        for (const link of links) {
            link.addEventListener("click", this.go);
        }
    }
    /**
     * When that route is called
     * @param path string
     * @param handler function
     */
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
    /**
     * Set not found handler
     * @param handler function
     */
    notFound(handler) {
        this._notFound = handler;
        return this;
    }
    /**
     * Navigate to path
     * @param path string
     */
    navigate(path) {
        const url = `${this.root}${path}`;
        window.history.pushState(null, '', url);
        this.onChange();
    }
    /**
     * Replace parameters regex
     * @param route Route
     */
    replace(route) {
        const names = [];
        const regex = new RegExp(route.path.replace(PARAMS_REGEX, (_, name) => {
            names.push(name);
            return REPLACE_VARIABLE_REGEXP;
        }) + FOLLOWED_BY_SLASH);
        return { regex, names };
    }
    /**
     * Get the parameters from the URL
     * @param match any
     * @param names Array<string>
     */
    getParams(match, names) {
        if (!names || names.length === 0 || !match)
            return null;
        return match.slice(1, names.length + 1)
            .reduce((params, value, index) => {
            var _a;
            if (params === null)
                params = {};
            params[(_a = names[index]) !== null && _a !== void 0 ? _a : ""] = value; // Use optional chaining to safely access names[index]
            return params;
        }, {});
    }
    /**
     * Check if a value is defined
     * @param value any
     */
    isDefined(value) {
        return typeof value !== 'undefined';
    }
    /**
     * Find the matching routes
     * @param path string
     */
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
    /**
     * Get the match URL
     * @param path string
     */
    // private match(path: string): { match: RegExpMatchArray, route: Route, params: Record<string, string> | null } | null {
    match(path) {
        return this.findRoutes(path)[0] || null;
    }
    /**
     * On route change
     */
    onChange() {
        let url = window.location.pathname;
        const query = window.location.search;
        if (this.root) {
            url = url.replace(this.root, "");
        }
        const m = this.match(url);
        if (!m) {
            if (this._notFound)
                this._notFound(query);
            return;
        }
        const { route, params } = m;
        return route.handler(query, params || undefined);
    }
    /**
     * Go to URL
     * @param event any
     */
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
        window.history.pushState(null, '', url);
        this.onChange();
    }
}
export { Router };
//# sourceMappingURL=router%20copy.js.map