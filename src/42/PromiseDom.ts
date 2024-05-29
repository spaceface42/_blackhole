/**
 * PromiseDom v07
 * 
 * PromiseDom class provides a promise that resolves when the DOM is ready.
 */
type DocumentReadyState = 'loading' | 'interactive' | 'complete';

class PromiseDom {
    ready: Promise<void>;

    /**
     * Initializes PromiseDom instance.
     * @param document The document object to use. Default is window.document.
     */
    constructor(private document: Document = window.document) {
        console.info('_42 / PromiseDom');
        this.ready = new Promise<void>((resolve) => {
            const state: DocumentReadyState = this.document.readyState as DocumentReadyState;
            if (state === 'interactive' || state === 'complete') {
                resolve();
            } else {
                const onDOMContentLoaded = () => {
                    resolve();
                    this.document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);
                };
                this.document.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);
            }
        // }).catch(error => {
        //     console.error('Error initializing PromiseDom:', error);
        });
    }
}

export default PromiseDom;
