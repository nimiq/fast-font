import XElement from '/library/x-element/x-element.js';
import QrScanner from '/library/qr-scanner/qr-scanner.min.js';
import XPages from '../x-pages/x-pages.js';

export default class XAddressScanner extends XElement {
    html() {
        return `
            <x-pages selected="scanner">
                <div page="intro">
                    <h1 x-grow>Scan Address</h1>
                    <button enable-camera-button>Enable Camera</button>
                    <a secondary use-fallback-button>Continue without Camera</a>
                </div>
                <div page="scanner">
                    <video muted autoplay playsinline width="600" height="600"></video>
                    <div qr-overlay></div>
                    <x-header>
                        <a icon-paste></a>
                        <input fallback-input type="text" placeholder="Enter Address" spellcheck="false" autocomplete="off">
                        <label icon-upload><input type="file"></label>
                    </x-header>   
                </div>
                <div page="fallback">
                    <h1>Enter Address</h1>
                    <div x-grow class="center relative">
                        <div class="relative">
                            <a icon-paste></a>
                            <input fallback-input type="text" placeholder="Enter Address" spellcheck="false" autocomplete="off">
                        </div>
                        <div error-message></div>
                    </div>
                    <a secondary enable-camera-button>Use the scanner</a>
                    <label>
                        <a secondary>Scan from image</a>
                        <input type="file">
                    </label>
                </div>
            </x-pages>`;
    }

    children() {
        return [XPages];
    }

    onCreate() {
        this._checkCameraStatus();
        const $video = this.$('video');
        this._validate = () => true;
        this._scanner = new QrScanner($video, result => this._validate(result) && this.fire('x-decoded', result));

        this.$qrOverlay = this.$('[qr-overlay]');
        this._positionOverlay();
        window.addEventListener('resize', () => this._positionOverlay());

        Array.prototype.forEach.call(this.$$('[enable-camera-button]'), button =>
            button.addEventListener('click', () => this._startScanner()));
        this.$('[use-fallback-button]').addEventListener('click', () => this._useFallback());

        Array.prototype.forEach.call(this.$$('input[type="file"]'),
            fileInput => fileInput.addEventListener('change', event => this._onFileSelected(event)));
        this._fallbackInputs = this.$$('[fallback-input]');
        Array.prototype.forEach.call(this._fallbackInputs,
            textInput => textInput.addEventListener('change', event => this._onTextInput(event)));

        this.$errorMessage = this.$('[error-message]');
    }

    set active(active) {
        if (active) {
            if (localStorage[XAddressScanner.KEY_USE_CAMERA] !== 'yes') {
                return;
            }
            this._startScanner();
        } else {
            this._scanner.stop();
            Array.prototype.forEach.call(this._fallbackInputs, textInput => {
                textInput.value = '';
                textInput.removeAttribute('invalid');
            });
        }
    }

    set validator(validator) {
        this._validate = validator;
    }

    setGrayscaleWeights(red, green, blue) {
        this._scanner.setGrayscaleWeights(red, green, blue);
    }

    _checkCameraStatus() {
        const useCamera = localStorage[XAddressScanner.KEY_USE_CAMERA];
        if (useCamera === undefined || useCamera === null) {
            this.$pages.select('intro', false);
        } else if (useCamera === 'yes') {
            this.$pages.select('scanner', false);
        } else {
            this.$pages.select('fallback', false);
        }
    }

    _startScanner() {
        this._positionOverlay();
        this.$pages.select('scanner');
        this._scanner.start().then(() => {
            // successfully started
            localStorage[XAddressScanner.KEY_USE_CAMERA] = 'yes';
        }).catch(() => {
            localStorage[XAddressScanner.KEY_USE_CAMERA] = 'no';
            this.$pages.select('fallback');
            this._showErrorMessage('Failed to start the camera. Make sure you gave Nimiq access to your camera in ' +
                'the browser settings.');
        });
    }

    _useFallback() {
        localStorage[XAddressScanner.KEY_USE_CAMERA] = 'no';
        this.$pages.select('fallback');
    }

    _onTextInput(event) {
        const input = event.target;
        if (this._validate(input.value)) {
            input.removeAttribute('invalid');
            this.fire('x-decoded', input.value);
        } else {
            input.setAttribute('invalid', '');
        }
    }

    _onFileSelected(event) {
        const fileInput = event.target;
        const fileInputIcon = fileInput.parentNode;
        const file = fileInput.files[0];
        fileInput.value = null; // reset the file selector
        if (!file) {
            return;
        }
        // Note that this call doesn't use the same qr worker as the webcam scanning and thus doesn't interfere with it.
        QrScanner.scanImage(file)
            .then(result =>
                this._validate(result)? this.fire('x-decoded', result) : this._onFileScanFailed(fileInputIcon))
            .catch(() => this._onFileScanFailed(fileInputIcon));
    }

    _onFileScanFailed(fileInputIcon) {
        if (this.$pages.selected === 'scanner') {
            fileInputIcon.classList.add('scan-failed');
            setTimeout(() => fileInputIcon.classList.remove('scan-failed'), 4000);
        } else {
            this._showErrorMessage('File scan failed.');
        }
    }

    _showErrorMessage(message) {
        this.$errorMessage.textContent = message;
        this.$errorMessage.classList.add('show-error');
        setTimeout(() => this.$errorMessage.classList.remove('show-error'), 6000);
    }

    _positionOverlay() {
        const scannerHeight = this.$el.offsetHeight;
        const scannerWidth = this.$el.offsetWidth;
        const smallerDimension = Math.min(scannerHeight, scannerWidth);
        const overlaySize = Math.ceil(2 / 3 * smallerDimension);
        /* not always the accurate size of the sourceRect for QR
        detection (e.g. if video is landscape and screen portrait) but looks nicer in the UI */
        this.$qrOverlay.style.width = overlaySize + 'px';
        this.$qrOverlay.style.height = overlaySize + 'px';
        this.$qrOverlay.style.top = ((scannerHeight - overlaySize) / 2) + 'px';
        this.$qrOverlay.style.left = ((scannerWidth - overlaySize) / 2) + 'px';
    }
}
XAddressScanner.KEY_USE_CAMERA = 'x-address-scanner-use-camera';

// TODO button animations
// TODO intro background responsive image sizing
// TODO page transition animations
// TODO input size on fallback page
// Todo: Refactor address input into x-address input?
// Todo: x-address-input should not be invalid while typing a correct address
