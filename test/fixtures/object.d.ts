declare module goog.functions {

    /**
     * @param {T} item
     * @return {Object.<T>}
     * @template T
     */
    function toObject<T>(item: T): Object;
}
