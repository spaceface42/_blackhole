// Regex constants
const PARAMS_REGEX = /[:*](\w+)/g;
const PARAM_VARIABLE = "([^/]+)";
const FOLLOWED_BY_SLASH = "(?:/$|$)";

interface Route {
    path: string;
    handler: (query: Record<string, string>, params?: Record<string, string>) => Promise<void>;
    params?: string[];
}

class Router {
    private routes: Route[];
    private root: string;
    private _notFound: (query: string) => void;

    constructor(root?: string) {
        this.routes = [];
        this.root = root ? root : window.location.origin;
        this.go = this.go.bind(this);
    }

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.redefineLinks();
            window.addEventListener("popstate", () => {
                this.onChange().then(resolve).catch(reject);
            });
            this.onChange().then(resolve).catch(reject);
        });
    }

    private redefineLinks(): void {
        const links = Array.from(document.querySelectorAll("a[data-router]"));
        for (const link of links) {
            link.addEventListener("click", this.go);
        }
    }

    on(path: string, handler: (query: Record<string, string>, params?: Record<string, string>) => Promise<void>): this {
        let params = path.match(PARAMS_REGEX) as RegExpMatchArray | null;
        if (params) {
            params = params.map(param => param.replace(":", "")) as RegExpMatchArray;
        }
        this.routes.push({
            path,
            handler,
            params: params || undefined
        });
        return this;
    }

    notFound(handler: (query: string) => void): this {
        this._notFound = handler;
        return this;
    }

    navigate(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = `${this.root}${path}`;
            try {
                window.history.pushState(null, '', url);
                this.onChange().then(resolve).catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    private replace(route: Route): { regex: RegExp, names: string[] } {
        const names: string[] = [];
        const regex = new RegExp(route.path.replace(PARAMS_REGEX, (_, name) => {
            names.push(name);
            return PARAM_VARIABLE;
        }) + FOLLOWED_BY_SLASH);
        return { regex, names };
    }

    private getParams(match: RegExpMatchArray | null, names: string[]): Record<string, string> | null {
        if (!names || names.length === 0 || !match) return null;
        const params: Record<string, string> = {};
        for (let index = 0; index < names.length; index++) {
            const paramValue = match[index + 1];
            if (paramValue !== undefined) {
                params[names[index]] = paramValue;
            }
        }
        return params;
    }
    
    
    

    private findRoutes(path: string): Array<{ match: RegExpMatchArray, route: Route, params: Record<string, string> | null }> {
        return this.routes
            .map(route => {
                const { regex, names } = this.replace(route);
                const match = path.replace(/^\/+/, "/").match(regex);
                const params = this.getParams(match, names);
                return match ? { match, route, params } : null;
            })
            .filter((m): m is { match: RegExpMatchArray, route: Route, params: Record<string, string> | null } => m !== null);
    }

    private match(path: string): { match: RegExpMatchArray, route: Route, params: Record<string, string> | null } | null {
        return this.findRoutes(path)[0] || null;
    }

    private onChange(): Promise<void> {
        return new Promise((resolve) => {
            let url = window.location.pathname;
            const query = window.location.search;
            if (this.root) {
                url = url.replace(this.root, "");
            }
            const m = this.match(url);
            if (!m) {
                if (this._notFound) this._notFound(query);
                resolve();
            } else {
                const { route, params } = m;
                route.handler(this.getQueryParams(query), params || undefined).then(() => resolve());
            }
        });
    }

    private getQueryParams(query: string): Record<string, string> {
        const params = new URLSearchParams(query);
        const queryParams: Record<string, string> = {};
        params.forEach((value, key) => {
            queryParams[key] = value;
        });
        return queryParams;
    }

    private go(event: MouseEvent): void {
        event.preventDefault();
        const target = event.target as HTMLElement;
        const link = target.closest('a');
        if (!link) return;
        const query = link.search;
        const pathname = link.pathname;
        const url = query
            ? `${this.root}${pathname}${query}`
            : `${this.root}${pathname}`;
        try {
            window.history.pushState(null, '', url);
            this.onChange();
        } catch (error) {
            console.error("Error navigating:", error);
        }
    }
}

export { Router };
