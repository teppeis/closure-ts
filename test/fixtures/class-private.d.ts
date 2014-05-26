declare module goog.dom {

    /**
     * @param {Document} document
     * @constructor
     * @private
     */
    interface DomHelper {
        
        /**
         * @type {string}
         */
        foo: string;
        
        /**
         * @param {string} str
         * @return {number}
         */
        bar(str: string): number;
    }
}
