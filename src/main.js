import '/src/style.css'
import '@fontsource-variable/inter'
import roasts from '/src/roasts.json'
import { spring } from 'animejs/easings'
import { stagger } from 'animejs/utils'
import { animate } from 'animejs/animation'
import Alpine from 'alpinejs'
window.Alpine = Alpine

const random = arr => arr[Math.floor(Math.random() * arr.length)];

// Global store for AI mode toggle
Alpine.store('G', {
    isAiMode: false,
    aiLoaded: false,
    aiLoading: false,
    askConfirmation: false,
    seedText: '',
});

Alpine.data('anime', () => ({
    easeType: spring({ bounce: -0.5, duration: 368 }),

    appear(el, from) {
        if (from === undefined || from === 'top') {
            animate(el, {
                y: ['-100vh', 0],
                duration: 1250,
                delay: stagger(65, { from: 'center' }),
                ease: this.easeType ,
            });
        }
        else if (from === 'bottom') {
            animate(el, {
                y: ['100vh', 0],
                duration: 1250,
                delay: stagger(65, { from: 'center' }),
                ease: this.easeType,
            });
        }
        else if (from === 'left') {
            animate(el, {
                x: ['-100vw', 0],
                duration: 1250,
                delay: stagger(65, { from: 'center' }),
                ease: this.easeType,
            });
        }
        else if (from === 'right') {
            animate(el, {
                x: ['100vw', 0],
                duration: 1250,
                delay: stagger(65, { from: 'center' }),
                ease: this.easeType,
            });
        }
    },
}));

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
    roastAny(el) {
        const pick = Math.random();
        if (pick < 0.4) { this.sCount++; this.show(random(this.samsungRoasts)); }
        else if (pick < 0.8) { this.tCount++; this.show(random(this.tvmRoasts)); }
        else { this.sCount++; this.tCount++; this.show(random(this.combos)); }
        this.pop(el);
    },
    roastSamsung(el) { this.sCount++; this.show(random(this.samsungRoasts)); this.pop(el); },
    roastTvm(el) { this.tCount++; this.show(random(this.tvmRoasts)); this.pop(el); },
    async copyRoast(el) {
        try {
            const copyText = 'If I have to say anything about Neeraj, it would be...' + this.displayText;
            await navigator.clipboard.writeText(copyText);
            const old = this.displayText;
            this.show('Copied. Now go paste it in the group chat.');
            this.pop(el)
            setTimeout(() => this.show(old), 1200);
        } catch (e) {
            alert('Copy not supported here. Select and copy manually!');
        }
    },
    typing(e) {
        this.$el.focus();
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
    pop(el) {
        if (!el) return;
        animate(el, {
            transform: ['scale(1)', 'scale(1.2)', 'scale(1)'],
            duration: 160,
            easing: 'inOutSine',
        });
    }

}));

// ============ VANILLA JS AI ROASTER (bypasses Alpine completely) ============
window.AIRoaster = {
    model: null,
    char2idx: null,
    idx2char: null,
    temperature: 0.7,
    length: 100,
    loaded: false,
    loading: false,
    
    setStatus(msg) {
        const el = document.getElementById('ai-status');
        if (el) el.textContent = msg;
    },
    
    setDisplay(msg) {
        const el = document.getElementById('display');
        if (el) el.textContent = msg;
    },
    
    async load() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        Alpine.store('G').aiLoading = true;
        
        try {
            this.setStatus('Loading TensorFlow.js...');
            
            // Load TF.js from CDN exactly like the working inline script
            if (!window.tf) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load TensorFlow'));
                    document.head.appendChild(script);
                });
            }
            
            this.setStatus('Loading character mappings...');
            const charsReq = await fetch('/roast_char_rnn/chars.json');
            this.char2idx = await charsReq.json();
            this.idx2char = {};
            Object.keys(this.char2idx).forEach(k => this.idx2char[this.char2idx[k]] = k);
            
            this.setStatus('Loading AI model...');
            this.model = await tf.loadLayersModel('/roast_char_rnn/manifest.json');
            
            // Warmup (exactly like inline script)
            this.model.predict(tf.zeros([1, 1]));
            
            this.setStatus(' AI Ready! Lets Generate some roasts. Increase temperature for more creativity and chaos.');
            this.loaded = true;
            Alpine.store('G').aiLoaded = true;
            
            // Enable the button
            const btn = document.getElementById('btnAiRoast');
            if (btn) btn.disabled = false;
            
        } catch (err) {
            console.error('AI Load Error:', err);
            this.setStatus('❌ Error: ' + err.message);
        } finally {
            this.loading = false;
            Alpine.store('G').aiLoading = false;
        }
    },
    
    async generate() {
        if (!this.model) {
            this.setDisplay('Still loading AI...');
            return;
        }
        
        const seedText = Alpine.store('G').seedText || 'Neeraj is ';
        this.setDisplay(seedText);
        
        this.model.resetStates();
        
        let input = [];
        for (let char of seedText) {
            if (char in this.char2idx) input = [this.char2idx[char]];
        }
        
        let generatedText = seedText;
        let currentInput = input.length > 0 ? input : [this.char2idx[' ']];
        
        for (let i = 0; i < this.length; i++) {
            const inputTensor = tf.tensor(currentInput, [1, 1]);
            const preds = this.model.predict(inputTensor);
            const logits = preds.squeeze();
            
            const nextIndex = tf.tidy(() => {
                const scaled = logits.div(this.temperature);
                return tf.multinomial(scaled, 1).dataSync()[0];
            });
            
            const nextChar = this.idx2char[nextIndex] || '';
            generatedText += nextChar;
            currentInput = [nextIndex];
            
            this.setDisplay(generatedText);
            
            inputTensor.dispose();
            preds.dispose();
            logits.dispose();
            
            if (nextChar === '\n') break;
            await new Promise(r => setTimeout(r, 10));
        }
    }
};

// Remove Alpine machineRoaster component - using vanilla JS instead
Alpine.start()

