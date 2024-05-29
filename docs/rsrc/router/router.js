import Events from "../router/events.js";

const ROUTER_TYPES = {
  hash: "hash",
  history: "history"
};

const defer = (x) => {
  setTimeout(() => x(), 10);
};

const wA = window.addEventListener;

const tS = (s) => {
  return s.replace(/^\/+|\/+$/gm, "");
};

/**
 * SPA Router - replacement for Framework Routers (history and hash).
 */
class Router {
  constructor(options = {}) {
    this.events = new Events(this);
    this.options = { type: ROUTER_TYPES.history, ...options };
  }

  /**
   * Start listening for route changes.
   * @returns {Router} reference to itself.
   */
  listen() {
    this.routeHash = Object.keys(this.options.routes);

    if (!this.routeHash.includes("/")) throw new TypeError("No home route found");

    if (this.useHash) {
      wA("hashchange", this.#hashChanged.bind(this));
      defer(() => this.#tryNav(document.location.hash.substring(1)));
    } else {
      let href = document.location.origin;

      if (this.#findRoute(document.location.pathname)) {
        href += document.location.pathname;
        if (href.endsWith("/")) href = href.slice(0, -1);
      }
      document.addEventListener("click", this.#onNav.bind(this));
      wA("popstate", this.#onPop.bind(this));

      defer(() => this.#tryNav(href));
    }
    return this;
  }

  #hashChanged() {
    this.#tryNav(document.location.hash.substr(1));
  }

  #onPop(e) {
    this.#emitChange(e.state.path, e.target.location.href);
  }

  #emitChange(path, url) {
    const route = this.#findRoute(path);
    this.events.trigger("route", {
      route: this.options.routes[route.pattern],
      params: route.params,
      path: path,
      url: url
    });
  }

  #findRoute(url) {
    for (const pattern of this.routeHash) {
      const paramNames = [];
      const regex = new RegExp(
        "^" +
          pattern.replace(/:[^\s/]+/g, (match) => {
            paramNames.push(match.substring(1));
            return "([\\w-]+)";
          }) +
          "$"
      );
      const match = url.match(regex);
      if (match) {
        const params = match.slice(1).reduce((acc, value, index) => {
          acc[paramNames[index]] = value;
          return acc;
        }, {});
        return { pattern, params };
      }
    }
    return null;
  }

  #tryNav(href) {
    const url = new URL(
      this.useHash && href.startsWith("#") ? href.substr(1) : href,
      document.location.origin
    );
    if (url.protocol.startsWith("http")) {
      const route = this.#findRoute(url.pathname);
      if (route && this.options.routes[route.pattern]) {
        if (!this.useHash) {
          window.history.pushState(
            { path: url.pathname },
            route.pattern,
            url.origin + url.pathname
          );
        }
        this.#emitChange(url.pathname, url);
        return true;
      }
    }
    return false;
  }

  #onNav(e) {
    const href = (e.path[0] ?? e.target)?.closest("[href]")?.href;
    if (href && this.#tryNav(href)) e.preventDefault();
  }

  /**
   * Makes the router navigate to the given route
   * @param {String} path
   */
  setRoute(path) {
    const route = this.#findRoute(path);
    if (!route) throw new TypeError("Invalid route");

    let href = this.useHash ? `#${path}` : `${document.location.origin}${path}`;
    history.replaceState(null, null, href);
    this.#tryNav(href);
  }

  get useHash() {
    return this.options.type === ROUTER_TYPES.hash;
  }
}

export default Router;
