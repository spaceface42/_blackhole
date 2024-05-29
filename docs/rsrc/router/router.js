import Events from "../router/events.js";

const ROUTER_TYPES = {
    hash: "hash",
    history: "history"
  },
  defer = (x) => {
    setTimeout(() => x(), 10);
  },
  wA = window.addEventListener,
  tS = (s) => {
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

    if (!this.routeHash.includes("/")) throw TypeError("No home route found");

    if (this.useHash) {
      wA("hashchange", this.#hashChanged.bind(this));
      defer(() => this.#tryNav(document.location.hash.substring(1)));
    } else {
      let href = document.location.origin;

      if (this.#findRoute(document.location.pathname)) {
        href += document.location.pathname;
        if (href.endsWith("/")) href = href.substring(0, href.length - 1);
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
    this.events.trigger("route", {
      route: this.options.routes[path],
      path: path,
      url: url
    });
  }

  #findRoute(url) {
    var test =
      "/" +
      url.match(/([A-Za-z_0-9.]*)/gm, (match, token) => {
        return token;
      })[1];
    let r = this.routeHash.includes(test) ? test : null;

    return r;
  }

  #tryNav(href) {
    const url = new URL(
      this.useHash && href.startsWith("#") ? href.substr(1) : href,
      document.location.origin
    );
    if (url.protocol.startsWith("http")) {
      const routePath = this.#findRoute(url.pathname);
      if (routePath && this.options.routes[routePath]) {
        if (!this.useHash) {
          window.history.pushState(
            { path: routePath },
            routePath,
            url.origin + url.pathname
          );
        }
        this.#emitChange(routePath, url);
        return true;
      }
    }
  }

  #onNav(e) {
    // handle click in document
    const href = (e.path[0] ?? e.target)?.closest("[href]")?.href;
    if (href && this.#tryNav(href)) e.preventDefault();
  }

  /**
   * Makes the router navigate to the given route
   * @param {String} path
   */
  setRoute(path) {
    if (!this.#findRoute(path)) throw TypeError("Invalid route");

    let href = this.useHash ? "#" + path : document.location.origin + path;
    history.replaceState(null, null, href);
    this.#tryNav(href);
  }

  get useHash() {
    return this.options.type === ROUTER_TYPES.hash;
  }
}

export default Router;