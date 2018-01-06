class XMnemonicValidate extends XElement {

    children() {
        return [XSlider];
    }

    onCreate() {
        this.$slides = Array.prototype.map.call(this.$xSlider.slides, slide => {
            slide = new XMnemonicValidateSlide(slide);
            slide.addEventListener('x-mnemonic-validate-slide', (e) => this._onSlideEvent(e.detail));
            return slide;
        });
    }

    set privateKey(privateKey) {
        this.mnemonic = MnemonicPhrase.keyToMnemonic(privateKey);
    }

    set mnemonic(mnemonic) {
        this._mnemonic = mnemonic.split(/\s+/g);
        this.init();
    }

    init() {
        this._activeSlide = 0;
        this._generateIndices();
        this._setSlideContent(this._activeSlide);
        this._showActiveSlide();
    }

    resetSlide() {
        this._generateIndex(this._activeSlide);
        this._setSlideContent(this._activeSlide);
    }

    _next() {
        this._setSlideContent(++this._activeSlide);
        this._showActiveSlide();
    }

    _onSlideEvent(valid) {
        if(!valid) setTimeout(() => this.resetSlide(), 820);
        else if(this._activeSlide === 2) this.fire('validated');
        else setTimeout(() => this._next(), 500);
    }

    _generateIndices() {
        this.requiredWords = Array(3);
        [0, 1, 2].forEach(index => this._generateIndex(index));
    }

    _generateIndex(slideIndex){
        this.requiredWords[slideIndex] = Math.floor(Math.random() * 8) + slideIndex * 8;
    }

    _setSlideContent(slideIndex) {
        this.$slides[slideIndex].set(
            this._generateWords(this.requiredWords[slideIndex]), // wordlist
            this.requiredWords[slideIndex] + 1, // targetIndex
            this._mnemonic[this.requiredWords[slideIndex]] // targetWord
        );
    }

    _generateWords(wordIndex) {
        let words = {};

        words[this._mnemonic[wordIndex]] = wordIndex;

        // Select 8 unique words from the mnemonic phrase
        while (Object.keys(words).length < 8) {
            const index = Math.floor(Math.random() * 24);
            words[this._mnemonic[index]] = index;
        }

        return Object.keys(words).sort();
    }

    _showActiveSlide() {
        this.$xSlider.slideTo(this._activeSlide);
    }
}



class XMnemonicValidateSlide extends XElement {

    onCreate() {
        this.$buttons = this.$$('button');
        this.$targetIndex = this.$('x-target-index');
        this.addEventListener('click', e => this._onClick(e));
    }

    set(wordlist, targetIndex, targetWord) {
        this.$buttons.forEach(button => button.classList.remove('correct'));
        this.wordlist = wordlist;
        this.targetIndex = targetIndex;
        this.targetWord = targetWord;
    }

    set wordlist(wordlist) {
        wordlist.forEach((word, index) => this.$buttons[index].textContent = word);
        this.$buttons.forEach(button => button.removeAttribute('disabled'));
    }

    set targetIndex(index) {
        this.$targetIndex.textContent = index;
    }

    _onClick(e) {
        if (e.target.localName !== 'button') return;
        this._onButtonPressed(e.target);
    }

    _onButtonPressed($button) {
        this.$buttons.forEach(button => button.setAttribute('disabled', 'disabled'));

        if (this.targetWord !== $button.textContent) {
            this._shake($button);
            this.fire('x-mnemonic-validate-slide', false);
            return;
        }

        this._correct($button);
        this.fire('x-mnemonic-validate-slide', true);
    }

    _shake($el) {
        $el.classList.add('shake');
        setTimeout(() => $el.classList.remove('shake'), 820);
    }

    _correct($el) {
        $el.classList.add('correct');
    }
    html() {
        return `
            <p>Please select the following word from your phrase:</p>
            <x-target-index></x-target-index>
            <x-wordlist>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
            </x-wordlist>
        `
    }
}