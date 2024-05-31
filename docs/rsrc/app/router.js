"use strict";
var _a, _b, _c, _d;
class Router {
    constructor(mode = 'history', root = '/') {
        this.routes = [];
        this.mode = mode;
        this.root = root;
        this.listen();
    }
    listen() {
        if (this.mode === 'history') {
            window.addEventListener('popstate', () => {
                this.handleRoute(location.pathname);
            });
        }
        else {
            window.addEventListener('hashchange', () => {
                this.handleRoute(location.hash.slice(1));
            });
        }
    }
    addRoute(path, handler) {
        this.routes.push({ path, handler });
        return this;
    }
    navigate(path) {
        if (!this.isSafeUrl(path)) {
            console.error('Unsafe URL, navigation aborted');
            return;
        }
        if (this.mode === 'history') {
            history.pushState(null, '', path);
            this.handleRoute(path);
        }
        else {
            location.hash = path;
        }
    }
    async handleRoute(path) {
        const route = this.routes.find(route => route.path === path);
        if (route) {
            try {
                await route.handler();
            }
            catch (error) {
                console.error(`Error while handling route: ${error}`);
            }
        }
        else {
            console.error(`Route not found: ${path}`);
        }
    }
    isSafeUrl(url) {
        const pattern = /^(\/|#\/)[\w\-\/]*$/;
        return pattern.test(url);
    }
    start() {
        const path = this.mode === 'history' ? location.pathname : location.hash.slice(1);
        this.handleRoute(path);
    }
}
// Usage Example:
const contentDiv = document.getElementById('content');
const router = new Router('history');
router
    .addRoute('/', async () => {
    contentDiv.innerHTML = '<h1>Home</h1><p>Welcome to the home page!</p>';
})
    .addRoute('/about', async () => {
    contentDiv.innerHTML = '<h1>About</h1><p>This is the about page.</p>';
})
    .addRoute('/contact', async () => {
    contentDiv.innerHTML = '<h1>Contact</h1><p>Loading contact information...</p>';
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate async operation
    contentDiv.innerHTML += '<p>Contact info loaded.</p>';
})
    .addRoute('/data', async () => {
    contentDiv.innerHTML = '<h1>Data</h1><p>Loading data...</p>';
    const data = await fetchData();
    contentDiv.innerHTML += `<p>Data: ${data}</p>`;
});
async function fetchData() {
    return new Promise(resolve => {
        setTimeout(() => resolve('Fetched data from server'), 2000);
    });
}
// Start the router
router.start();
// Navigate programmatically
(_a = document.getElementById('home-link')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => router.navigate('/'));
(_b = document.getElementById('about-link')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => router.navigate('/about'));
(_c = document.getElementById('contact-link')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => router.navigate('/contact'));
(_d = document.getElementById('data-link')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => router.navigate('/data'));
//# sourceMappingURL=router.js.map