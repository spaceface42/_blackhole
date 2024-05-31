type RouteHandler = () => Promise<void>;

interface Route {
    path: string;
    handler: RouteHandler;
}

class Router {
    private routes: Route[] = [];
    private mode: 'history' | 'hash';
    private root: string;

    constructor(mode: 'history' | 'hash' = 'history', root: string = '/') {
        this.mode = mode;
        this.root = root;
        this.listen();
    }

    private listen() {
        if (this.mode === 'history') {
            window.addEventListener('popstate', () => {
                this.handleRoute(location.pathname);
            });
        } else {
            window.addEventListener('hashchange', () => {
                this.handleRoute(location.hash.slice(1));
            });
        }
    }

    public addRoute(path: string, handler: RouteHandler): Router {
        this.routes.push({ path, handler });
        return this;
    }

    public navigate(path: string) {
        if (!this.isSafeUrl(path)) {
            console.error('Unsafe URL, navigation aborted');
            return;
        }
        if (this.mode === 'history') {
            history.pushState(null, '', path);
            this.handleRoute(path);
        } else {
            location.hash = path;
        }
    }

    private async handleRoute(path: string) {
        const route = this.routes.find(route => route.path === path);
        if (route) {
            try {
                await route.handler();
            } catch (error) {
                console.error(`Error while handling route: ${error}`);
            }
        } else {
            console.error(`Route not found: ${path}`);
        }
    }

    private isSafeUrl(url: string): boolean {
        const pattern = /^(\/|#\/)[\w\-\/]*$/;
        return pattern.test(url);
    }

    public start() {
        const path = this.mode === 'history' ? location.pathname : location.hash.slice(1);
        this.handleRoute(path);
    }
}


// Usage Example:

const contentDiv = document.getElementById('content') as HTMLElement;

const router = new Router('history');

router
    .addRoute('/', async () => {
        contentDiv.innerHTML = '<h1>Home</h1><p>Welcome to the home page!</p>';
    })
    .addRoute('/about', async () => {
        contentDiv.innerHTML = '<h1>About</h1><p>This is the about page.</p>';
    })
    .addRoute('/contact', async () => {
        contentDiv.innerHTML = '<h1>Contact</h1><p>Get in touch with us through the contact page.</p>';
    });

// Start the router
router.start();

// Navigate programmatically
document.getElementById('home-link')?.addEventListener('click', () => router.navigate('/'));
document.getElementById('about-link')?.addEventListener('click', () => router.navigate('/about'));
document.getElementById('contact-link')?.addEventListener('click', () => router.navigate('/contact'));
