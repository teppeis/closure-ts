declare module goog {
    type globalEventTarget = EventTarget;
}

interface IArrayLike<VALUE> {
    length: number;
    [key: number]: VALUE;
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLIsIndexElement
interface HTMLIsIndexElement extends HTMLElement {
    from: HTMLFormElement;
    prompt: string;
}
