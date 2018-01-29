import XScreenFit from '../x-screen/x-screen-fit.js';
import XSuccessMark from '../x-success-mark/x-success-mark.js';
export default class ScreenSuccess extends XScreenFit {
    html() {
        return `
            <x-success-mark></x-success-mark>
            <h2 content></h2>
        `
    }

    children() { return [XSuccessMark] }

    _onEntry() {
        return this.$successMark.animate();
    }
}