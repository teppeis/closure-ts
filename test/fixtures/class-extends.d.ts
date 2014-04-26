declare module goog.dom {

    /**
     * @constructor
     */
    export class Foo {
        constructor();
    }

    /**
     * @constructor
     * @extends {goog.dom.Foo}
     */
    export class Bar extends goog.dom.Foo {
        constructor();
    }
}
