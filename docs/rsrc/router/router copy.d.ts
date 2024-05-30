declare class Router {
    private routes;
    private root;
    private _notFound;
    constructor(root?: string);
    /**
     * Initialize the router
     */
    init(): void;
    /**
     * Collect links and
     * add event listeners
     */
    private redefineLinks;
    /**
     * When that route is called
     * @param path string
     * @param handler function
     */
    on(path: string, handler: (query: string, params?: Record<string, string>) => void): this;
    /**
     * Set not found handler
     * @param handler function
     */
    notFound(handler: (query: string) => void): this;
    /**
     * Navigate to path
     * @param path string
     */
    navigate(path: string): void;
    /**
     * Replace parameters regex
     * @param route Route
     */
    private replace;
    /**
     * Get the parameters from the URL
     * @param match any
     * @param names Array<string>
     */
    private getParams;
    /**
     * Check if a value is defined
     * @param value any
     */
    private isDefined;
    /**
     * Find the matching routes
     * @param path string
     */
    private findRoutes;
    /**
     * Get the match URL
     * @param path string
     */
    private match;
    /**
     * On route change
     */
    private onChange;
    /**
     * Go to URL
     * @param event any
     */
    private go;
}
export { Router };
