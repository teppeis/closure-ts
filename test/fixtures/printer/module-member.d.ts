declare module "goog:goog.functions" {
  /**
   */
  function goog_functions(): string;
  namespace goog_functions {
    /**
     */
    function fn(message: string): void;
    /**
     */
    var v: Date;
    /**
     */
    class MyClass {
      constructor();
    }
    /**
     */
    type Typedef = RegExp;
  }
  export default goog_functions;
}
