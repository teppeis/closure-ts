declare module goog.functions {

    /**
     * @param {T} item
     * @return {Object.<T>}
     * @template T
     */
    function toObject<T>(item: T): {[index: string]: T};

    /**
     * @return {Object<number, boolean>}
     */
    function numboolean(): {[index: number]: boolean};

    /**
     * @return {Object<Date, boolean>}
     */
    function dateShouldBeConvertedToString(): {[index: string]: boolean};
}
