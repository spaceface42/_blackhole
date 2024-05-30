declare class Router {
    private routes;
    private root;
    private _notFound;
    constructor(root?: string);
    init(): Promise<void>;
    private redefineLinks;
    on(path: string, handler: (query: Record<string, string>, params?: Record<string, string>) => Promise<void>): this;
    notFound(handler: (query: string) => void): this;
    navigate(path: string): Promise<void>;
    private replace;
    private getParams;
    private findRoutes;
    private match;
    private onChange;
    private getQueryParams;
    private go;
}
export { Router };
