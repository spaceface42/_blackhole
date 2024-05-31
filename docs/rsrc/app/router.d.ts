type RouteHandler = () => Promise<void>;
interface Route {
    path: string;
    handler: RouteHandler;
}
declare class Router {
    private routes;
    private mode;
    private root;
    constructor(mode?: 'history' | 'hash', root?: string);
    private listen;
    addRoute(path: string, handler: RouteHandler): Router;
    navigate(path: string): void;
    private handleRoute;
    private isSafeUrl;
    start(): void;
}
declare const contentDiv: HTMLElement;
declare const router: Router;
