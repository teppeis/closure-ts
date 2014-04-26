declare module goog.dom {

    /**
     * @constructor
     */
    export class Foo {
        constructor();
        
        /**
         * @type {*}
         */
        foo1: any;
        
        /**
         * @type {*}
         */
        foo2: any;
        
        /**
         * @type {*}
         */
        foo3: any;
        
        /**
         * @type {*}
         */
        foo4: any;
    }

    /**
     * @constructor
     * @extends {goog.dom.Foo}
     */
    export class Bar extends goog.dom.Foo {
        constructor();
        
        /**
         * @type {string}
         * @override
         */
        foo2: string;
        
        /**
         * Description.
         * @override
         */
        foo4: any;
    }
}
