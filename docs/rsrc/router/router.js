interface Route {
  path: string;
  handler: () => void;
}

interface RouterOptions {
  mode: 'hash' | 'history';
  root?: string;
}

export class Router {
  private routes: Route[];
  private mode: 'hash' | 'history';
  private root: string;

  constructor(options: RouterOptions) {
    this.routes = [];
    this.mode = options.mode || 'hash';
    this.root = options.root || '/';
  }

  addRoute(path: string, handler: () => void): void {
    this.routes.push({ path, handler });
  }

  removeRoute(path: string): void {
    this.routes = this.routes.filter(route => route.path !== path);
  }

  clearRoutes(): void {
    this.routes = [];
  }

  private navigateHash(): void {
    const path = window.location.hash.slice(1) || '/';
    this.navigate(path);
  }

  private navigateHistory(): void {
    const path = window.location.pathname.slice(this.root.length) || '/';
    this.navigate(path);
  }

  private navigate(path: string): void {
    const route = this.routes.find(route => route.path === path);

    if (route) {
      route.handler();
    } else {
      // Handle 404
      console.log('Route not found:', path);
    }
  }

  listen(): void {
    if (this.mode === 'hash') {
      window.addEventListener('hashchange', this.navigateHash.bind(this));
      window.addEventListener('load', this.navigateHash.bind(this));
    } else {
      window.addEventListener('popstate', this.navigateHistory.bind(this));
      window.addEventListener('load', this.navigateHistory.bind(this));
    }
  }

  navigateTo(path: string): void {
    if (this.mode === 'hash') {
      window.location.hash = path;
    } else {
      window.history.pushState(null, '', this.root + path);
      this.navigate(path);
    }
  }
}
