/**
 * FetchPartial v08
 *
 * FetchPartial class provides methods to fetch and process partial HTML content.
 */
declare class FetchPartial {
    constructor();
    /**
     * Fetches a single partial HTML content and updates the provided element with the response.
     * @param url The URL of the partial HTML content.
     * @param element The element to update with the fetched content.
     */
    fetchOne(url?: string, element?: Element): Promise<void>;
    /**
     * Fetches all partial HTML content matching the provided selector and updates each element with the response.
     * @param selector The CSS selector to query for partial HTML content elements.
     */
    fetchAll(selector?: string): Promise<void>;
    /**
     * Makes a fetch request to the provided URL and returns the response text.
     * @param url The URL to fetch.
     * @returns A promise that resolves with the response text.
     */
    makeRequest(url: string): Promise<string>;
    /**
     * Processes the fetched response and updates the provided element with the response HTML.
     * @param response The response HTML.
     * @param element The element to update with the response HTML.
     */
    processRequest(response: string, element: Element): Promise<void>;
    /**
     * Fetches partial HTML content from the provided URL and updates the provided element with the response.
     * @param url The URL of the partial HTML content.
     * @param element The element to update with the fetched content.
     */
    fetch(url: string, element: Element): Promise<void>;
}
export default FetchPartial;
