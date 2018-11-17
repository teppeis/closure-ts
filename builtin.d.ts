declare module goog {
    type globalEventTarget = EventTarget;
}

interface IArrayLike<VALUE> {
    length: number;
    [key: number]: VALUE;
}
