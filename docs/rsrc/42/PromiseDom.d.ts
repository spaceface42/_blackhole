declare class PromiseDom {
    private document;
    ready: Promise<void>;
    /**
     * Initializes PromiseDom instance.
     * @param document The document object to use. Default is window.document.
     */
    constructor(document?: Document);
}
export default PromiseDom;
