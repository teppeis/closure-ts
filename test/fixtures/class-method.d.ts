declare module goog.dom {

    /**
     * @param {Document} document
     * @constructor
     */
    class DomHelper {
        constructor(document: Document);
        
        /**
         * @param {string} str
         * @return {number}
         */
        foo(str: string): number;
    }
}
