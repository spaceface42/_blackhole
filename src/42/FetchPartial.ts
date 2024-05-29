/**
 * FetchPartial v08
 * 
 * FetchPartial class provides methods to fetch and process partial HTML content.
 */
class FetchPartial {
    constructor() {
        console.info('FetchPartial initialized');
    }

    /**
     * Fetches a single partial HTML content and updates the provided element with the response.
     * @param url The URL of the partial HTML content.
     * @param element The element to update with the fetched content.
     */
    async fetchOne(url?: string, element?: Element): Promise<void> {
        if (!element) {
            console.error('No element provided for fetchOne');
            return;
        }

        try {
            if (!url) {
                url = element.getAttribute('href') || undefined;
            }
            if (!url) {
                console.error('No URL provided for fetchOne');
                return;
            }
            await this.fetch(url, element);
        } catch (error) {
            console.error(`Error fetching partial from ${url}:`, error);
        }
    }

    /**
     * Fetches all partial HTML content matching the provided selector and updates each element with the response.
     * @param selector The CSS selector to query for partial HTML content elements.
     */
    async fetchAll(selector: string = 'link[rel="html"]'): Promise<void> {
        try {
            const partials: NodeListOf<Element> = document.querySelectorAll(selector);

            await Promise.allSettled(Array.from(partials).map(partial => {
                const url = partial.getAttribute('href');
                if (!url) {
                    console.error('No URL provided for fetchAll on element:', partial);
                    return Promise.resolve();
                }
                return this.fetch(url, partial);
            }));
        } catch (error) {
            console.error('Error fetching all partials:', error);
        }
    }

    /**
     * Makes a fetch request to the provided URL and returns the response text.
     * @param url The URL to fetch.
     * @returns A promise that resolves with the response text.
     */
    async makeRequest(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch partial from ${url}`);
            }
            return response.text();
        } catch (error) {
            console.error(`Error making request to ${url}:`, error);
            throw error;
        }
    }

    /**
     * Processes the fetched response and updates the provided element with the response HTML.
     * @param response The response HTML.
     * @param element The element to update with the response HTML.
     */
    async processRequest(response: string, element: Element): Promise<void> {
        try {
            const template = document.createElement('template');
            template.innerHTML = response.trim();
            const htmlPartial = template.content.cloneNode(true) as DocumentFragment;
            if (htmlPartial) {
                element.replaceWith(htmlPartial);
            } else {
                console.error('Fetched content is empty');
            }
        } catch (error) {
            console.error('Error processing response:', error);
            throw error;
        }
    }

    /**
     * Fetches partial HTML content from the provided URL and updates the provided element with the response.
     * @param url The URL of the partial HTML content.
     * @param element The element to update with the fetched content.
     */
    async fetch(url: string, element: Element): Promise<void> {
        try {
            const response = await this.makeRequest(url);
            await this.processRequest(response, element);
        } catch (error) {
            console.error(`Error fetching partial from ${url}:`, error);
        }
    }
}

export default FetchPartial;
