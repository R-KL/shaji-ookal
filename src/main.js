import '/src/style.css'
import '@fontsource-variable/inter'
import roasts from '/src/roasts.json'
import Alpine from 'alpinejs'
window.Alpine = Alpine


const random = arr => arr[Math.floor(Math.random() * arr.length)];
Alpine.data('ookal', () => ({
    samsungRoasts: roasts.samsung,
    tvmRoasts: roasts.tvm,
    combos: roasts.combos,
    sCount: 0,
    tCount: 0,
    displayText: 'Click a button and let the roast begin.',
    typed: '',
    init() {
        this.roastAny();
    },
    show(text) {
        this.displayText = text;
    },
    roastAny() {
        const pick = Math.random();
        if (pick < 0.4) { this.sCount++; this.show(random(this.samsungRoasts)); }
        else if (pick < 0.8) { this.tCount++; this.show(random(this.tvmRoasts)); }
        else { this.sCount++; this.tCount++; this.show(random(this.combos)); }
        this.pop();
    },
    roastSamsung() { this.sCount++; this.show(random(this.samsungRoasts)); this.pop(); },
    roastTvm() { this.tCount++; this.show(random(this.tvmRoasts)); this.pop(); },
    async copyRoast() {
        try {
            const copyText = 'Neeraj is Someone that can be defined as: ' + this.displayText;
            await navigator.clipboard.writeText(copyText);
            const old = this.displayText;
            this.show('Copied. Now go paste it in the group chat.');
            setTimeout(() => this.show(old), 1200);
        } catch (e) {
            alert('Copy not supported here. Select and copy manually!');
        }
    },
    typing(e) {
        if (e.key.toLowerCase() === 'r' && (this.typed.length === 0 || this.typed.length > 10)) {
            this.roastAny();
            this.typed = '';
            return;
        };
        const k = e.key.length === 1 ? e.key.toLowerCase() : '';
        if (k) {
            this.typed = (this.typed + k).slice(-20);
            if (this.typed.includes('samsung')) {
                this.roastSamsung();
                this.typed = '';
            };
            if (this.typed.includes('trivandrum')) {
                this.roastTvm();
                this.typed = '';
            };
        }
    },
    pop() {
        this.$refs.display.animate([
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(1.02)', filter: 'brightness(1.08)' },
            { transform: 'scale(1)', filter: 'brightness(1)' }
        ], { duration: 160, easing: 'ease-out' });
    }

}));
Alpine.start()

