declare module goog.array {

    /**
     * Export private @typedef as interface.
     * @private
     * @typedef {Array|NodeList|{length: number}}
     */
    type ArrayLike = Array<any>|NodeList|{length: number};
}
