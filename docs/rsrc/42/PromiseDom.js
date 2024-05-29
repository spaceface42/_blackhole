class PromiseDom {
    /**
     * Initializes PromiseDom instance.
     * @param document The document object to use. Default is window.document.
     */
    constructor(document = window.document) {
        this.document = document;
        console.info('_42 / PromiseDom');
        this.ready = new Promise((resolve) => {
            const state = this.document.readyState;
            if (state === 'interactive' || state === 'complete') {
                resolve();
            }
            else {
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
//# sourceMappingURL=PromiseDom.js.map