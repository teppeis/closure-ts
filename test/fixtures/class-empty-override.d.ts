declare module goog.dom {

    /**
     * @constructor
     */
    class Foo {
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
    class Bar extends goog.dom.Foo {
        constructor();
        
        /**
         * @type {string}
         * @override
         */
        foo2: string;
    }
}
