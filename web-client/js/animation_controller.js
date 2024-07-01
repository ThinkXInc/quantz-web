(function(ns) {
    ns.AnimationType = {
        fadeOut: 'fade-out',
        fadeIn: 'fade-in',
        rotateOut: 'rotate-out',
        rotateIn: 'rotate-in',
        flipOut: 'flip-out',
        flipIn: 'flip-in',
    };

    ns.AnimationController = class {
        constructor() {
            this.debug = false;
            if (!ns.AnimationController.stylesInserted) {
                this.insertAnimationStyles();
                ns.AnimationController.stylesInserted = true;
            }
        }

        insertAnimationStyles() {
            const styleSheet = document.createElement("style");
            styleSheet.type = "text/css";
            styleSheet.innerText = `
                @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes rotate-out { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes rotate-in { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                @keyframes flip-out { from { transform: rotateY(0deg); } to { transform: rotateY(90deg); } }
                @keyframes flip-in { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0deg); opacity: 1; } }

                .fade-out { animation: fade-out 1s cubic-bezier(.65,0,.34,1) forwards; }
                .fade-in { animation: fade-in 1s cubic-bezier(.65,0,.34,1) forwards; }
                .rotate-out { animation: rotate-out 1s cubic-bezier(.65,0,.34,1) forwards; }
                .rotate-in { animation: rotate-in 1s cubic-bezier(.65,0,.34,1) forwards; }
                .flip-out { animation: flip-out 1s cubic-bezier(.65,0,.34,1) forwards; }
                .flip-in { animation: flip-in 1s cubic-bezier(.65,0,.34,1) forwards; }
            `;
            document.head.appendChild(styleSheet);
        }

        clearAnimationClasses(element) {
            const animationClasses = Object.values(ns.AnimationType);
            if (this.debug) { console.log(`Clearing animation classes: ${animationClasses.join(', ')} from element.`); }
            element.classList.remove(...animationClasses);
            if (this.debug) { console.log('Animation classes cleared.'); }
        }

        animate(element, animationType, delay, duration, preAnimationFunc = () => {}, callback = () => {}) {
            if (this.debug) { console.log(`Starting animation: ${animationType} with delay: ${delay}s and duration: ${duration}s.`); };
            this.clearAnimationClasses(element);
            setTimeout(() => {
                if (preAnimationFunc) preAnimationFunc(); // Execute any pre-animation setup
                element.classList.add(animationType);
                element.style.animationDuration = `${duration}s`;
                if (this.debug) { console.log(`Animation class ${animationType} added with duration ${duration}s.`); };
            
                element.addEventListener('animationend', (event) => {
                    if (event.animationName === animationType) {
                        if (this.debug) { console.log(`${animationType} animation completed on element.`); };
                        callback(); // Execute callback after animation completes
                    } else {
                        if (this.debug) { console.log(`Animation ended but didn't match the expected type: ${event.animationName} vs ${animationType}`); };
                    }
                }, { once: true });
            }, delay * 1000);
            if (this.debug) { console.log(`Animation setup complete. Waiting for delay to start animation.`); };
        }
    }

    ns.AnimationController.stylesInserted = false;
})(Quantz); 