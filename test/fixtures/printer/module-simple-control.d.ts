declare module "goog:goog.ui.Control" {
  import goog_ui_Component from "goog:goog.ui.Component";
  import goog_disposable_IDisposable from "goog:goog.disposable.IDisposable";
  /**
   */
  class goog_ui_Control<T> extends goog_ui_Component {
    constructor(disposable: goog_disposable_IDisposable);
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
