declare module goog.dom {

    /**
     * @param {Document} document
     * @constructor
     */
    export class DomHelper {
        constructor(document: Document);
        
        /**
         * @param {string} str
         * @return {number}
         */
        static foo(str: string): number;
    }
}
