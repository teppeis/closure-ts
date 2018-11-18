declare module 'goog:goog.ui.Control' {
  import goog_ui_Component from 'goog:goog.ui.Component';
  import goog_Disposable from 'goog:goog.Disposable';

  /**
   */
  class goog_ui_Control<T> extends goog_ui_Component, goog_Disposable {
    constructor();

    /**
     * @type {string}
     */
    prop1: string;

    /**
     */
    hello(message: string): void;
  }

  export default goog_ui_Control;
}