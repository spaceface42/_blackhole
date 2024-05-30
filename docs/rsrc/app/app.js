/**
 * init.ts
 *
 * Initialization script for the application.
 */
import PromiseDom from '../42/PromiseDom.js';
import FetchPartial from '../42/FetchPartial.js';
// Instantiate FetchPartial
const fetchPartial = new FetchPartial();
// Instantiate PromiseDom
const promiseDom = new PromiseDom();
/**
 * Main entry point for the application.
 * This function initializes the application once the DOM is fully loaded.
 */
function main() {
    /**
     * Fetch and update partial HTML content.
     */
    fetchPartial.fetchAll()
        .then(() => {
        console.log('FetchAll completed');
        initializeUX();
    })
        .catch(error => {
        console.error('Error during fetching partial / fetchAll:', error);
    });
    // Example usage of fetchOne
    // to use when using a js router for example
    /*
    const linkElement = document.querySelector('link[rel="manualhtml"]');
    if (linkElement && linkElement instanceof HTMLLinkElement) {
        fetchPartial.fetchOne(undefined, linkElement)
            .then(() => console.log('FetchOne completed'))
            .catch(error => console.error('Error during fetching partial / fetchOne:', error));
    }
    */
}
/**
 * Initializes the user experience (UX) elements.
 * This function sets up the necessary UX components and interactions.
 */
function initializeUX() {
    console.log('Initializing UX components');
    // Add your UX setup code here
    const appElement = document.getElementById('app');
    if (appElement) {
        appElement.innerHTML = '<h1>Welcome to the Application</h1>';
    }
    // Additional UX setup logic can go here
}
// Use PromiseDom to wait for the DOM ready state before running the main function
promiseDom.ready.then(() => {
    console.info('DOM is ready. Starting application initialization.');
    main();
}).catch(error => {
    console.error('Error during DOM readiness check:', error);
});
//# sourceMappingURL=app.js.map