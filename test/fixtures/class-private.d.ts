declare module goog.dom {

    /**
     * @param {Document} document
     * @constructor
     * @private
     */
    export interface DomHelper {
        
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
