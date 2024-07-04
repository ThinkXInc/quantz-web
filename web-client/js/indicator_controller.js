(function(ns) {
    ns.IndicatorController = class {
        constructor({buttonId, indicatorElement}) {
            this.buttonId = buttonId;
            this.indicatorElement = indicatorElement;
            this.defaultLength = ns.configs[buttonId].dialLength;
            this.defaultThickness = ns.configs[buttonId].dialThickness;
            this.defaultColor = ns.configs[buttonId].dialColorUp;
            this.dials = this.indicatorElement.querySelectorAll(`.${ns.configs[buttonId].prefix}dial`);
            this.styleSheet = this.createDynamicStyleSheet();
            this.ruleIndices = new Map();
            this.animationIdCounter = 0;  // Initialize a counter for unique animation IDs
        }

        createDynamicStyleSheet() {
            const style = document.createElement('style');
            document.head.appendChild(style);
            console.log("[Indicator controller] Stylesheet created:", style.sheet);
            return style.sheet;
        }

        update({index, length, thickness, color, duration, delay, curve, reverse = true, debugMode = false}) {
            if(debugMode) {console.log(`[IndicatorController update] Updating dial at index ${index}`);}
            const dial = this.dials[index];
            if (dial) {
                if (debugMode) {console.log(`[IndicatorController update] Found dial at index ${index}, starting update process.`);}
                // Capture current styles
                const currentColor = getComputedStyle(dial).backgroundColor;
                const currentWidth = getComputedStyle(dial).width;
                const currentHeight = getComputedStyle(dial).height;

                if (debugMode) {console.log(`[IndicatorController update] Current styles - Color: ${currentColor}, Width: ${currentWidth}, Height: ${currentHeight}`);}

                dial.style.animation = '';

                // Generate a unique name for each animation to avoid conflicts
                const animationName = `quantz-indicator-update-${index}-${Date.now()}-${this.animationIdCounter++}`;
                //const animationName = `quantz-indicator-update-${index}-${Date.now()}-${Math.random()}`;


                // Force reflow/repaint to ensure the animation cancellation is processed
                void dial.offsetWidth;

                // Prepare dynamic keyframes based on provided parameters
                const keyframesFrom = {
                    backgroundColor: currentColor,
                    width: currentWidth,
                    height: currentHeight
                };
                const keyframesTo = {
                    backgroundColor: color || currentColor,
                    width: length ? `${length}px` : currentWidth,
                    height: thickness ? thickness : currentHeight
                };

                // Create dynamic keyframes string
                const keyframes = `@keyframes ${animationName} {
                    from { background-color: ${keyframesFrom.backgroundColor}; width: ${keyframesFrom.width}; height: ${keyframesFrom.height}; }
                    to { background-color: ${keyframesTo.backgroundColor}; width: ${keyframesTo.width}; height: ${keyframesTo.height}; }
                }`;

                const ruleIndex = this.styleSheet.insertRule(keyframes, this.styleSheet.cssRules.length);
                this.ruleIndices.set(index, ruleIndex);

                if (debugMode) {console.log(`[IndicatorController update] Inserted keyframe rule at index ${ruleIndex}.`);}

                // Set up new CSS animation
                dial.style.animationName = animationName;
                dial.style.animationDuration = `${duration}s`;
                dial.style.animationTimingFunction = curve;
                dial.style.animationDelay = `${delay}s`;
                dial.style.animationDirection = reverse ? 'alternate' : 'normal';
                dial.style.animationIterationCount = '1';
                dial.style.animationFillMode = 'forwards';

                if (debugMode) {console.log(`[IndicatorController update] Animation settings applied to dial at index ${index}.`);}
            }  else {
                if (debugMode) {console.error(`[IndicatorController update] No dial found at index ${index}. Update aborted.`);}
            }
        }

        resetStyles() {
            // Iterate over all stored indices and remove corresponding rules
            this.ruleIndices.forEach((ruleIndex, index) => {
                if (ruleIndex < this.styleSheet.cssRules.length) {
                    try {
                        this.styleSheet.deleteRule(ruleIndex);
                        console.log(`Deleted rule for dial ${index} at index ${ruleIndex}`);
                    } catch (error) {
                        console.error(`Error deleting rule at index ${ruleIndex}:`, error);
                    }
                }            
            });
            // Clear the index map after cleanup
            this.ruleIndices.clear();
            console.log("All custom styles reset.");
        }

        updateAll({length, thickness, color, duration = ns.configs[this.buttonId].animationDuration, delay = ns.configs[this.buttonId].animationDelay, curve = ns.configs[this.buttonId].animationCurve, reverse = true}) {
            const updates = ns.DialUpdateHelper.generateUpdatesForAll(length, thickness, color, this.dials.length);
            updates.forEach(update => {
                const {index, length, thickness, color } = update; 
                this.update({
                    index: index,
                    length: length,
                    thickness: thickness,
                    color: color,
                    duration: duration,
                    delay: delay,
                    curve: curve,
                    reverse: reverse
                });
            })
            //this.updateDialColor(allColorsUpdate, duration, delay, curve);
        }

        updateAllColor(color, duration = ns.configs[this.buttonId].animationDuration, delay = ns.configs[this.buttonId].animationDelay, curve = ns.configs[this.buttonId].animationCurve, reverse = true) {
            this.updateAll({
                color: color,
                duration: duration,
                delay: delay,
                curve: curve,
                reverse: reverse
            });
        }

        updateAllLength(length, duration = ns.configs[this.buttonId].animationDuration, delay = ns.configs[this.buttonId].animationDelay, curve = ns.configs[this.buttonId].animationCurve, reverse = true) {
            this.updateAll({
                thickness: thickness,
                duration: duration,
                delay: delay,
                curve: curve,
                reverse: reverse
            });
        }

        updateAllThickness(thickness, duration = ns.configs[this.buttonId].animationDuration, delay = ns.configs[this.buttonId].animationDelay, curve = ns.configs[this.buttonId].animationCurve, reverse = true) {
            this.updateAll({
                thickness: thickness,
                duration: duration,
                delay: delay,
                curve: curve,
                reverse: reverse
            });
        }

        resetLength() {
            this.dials.forEach(dial => {
                dial.style.width = `${this.defaultLength}px`;
            });
        }

        resetColor() {
            this.dials.forEach(dial => {
                dial.style.backgroundColor = this.defaultColor;
            });
        }

        resetThickness() {
            this.dials.forEach(dial => {
                dial.style.height = `${this.defaultThickness}px`;
            });
        }

        // animation preset

        connectedAnimation() {
            console.log('[Indicator controller] start connected animation')
            //this.updateAllColor(ns.configs[this.buttonId].dialColorConnected, 1, 0, ns.configs[this.buttonId].animationCurve, false)
            this.updateAll({
                thickness: ns.configs[this.buttonId].dialThicknessConnected,
                color: ns.configs[this.buttonId].dialColorConnected,
                duration: 1,
                delay: 0,
                curve: ns.configs[this.buttonId].animationCurve,
                reverse: false
            });
        }

        listeningAnimation() {
            console.log('[Indicator controller] start listening animation')
            this.updateAll({
                color: ns.configs[this.buttonId].dialColorListening,
                duration: 1,
                delay: 0,
                curve: ns.configs[this.buttonId].animationCurve,
                reverse: false
            });
        }

        replyStartAnimation() {
            console.log('[Indicator controller] start reply start animation')
            this.updateAll({
                color: ns.configs[this.buttonId].dialColorReplyStart,
                duration: 0.5,
                delay: 0,
                curve: ns.configs[this.buttonId].animationCurve,
                reverse: false
            });
        }

        speakingAnimation(spectrum) {
            console.log('[Indicator controller] start speaking animation with spectrum size:', spectrum.length)
            let i = 0;
            spectrum.forEach(spec => {
                if (i < ns.configs[this.buttonId].N) {
                    const length = spectrum[i]/3; // TODO: need adjust
                    const thickness = ns.configs[this.buttonId].dialThicknessSpeaking;
                    const duration = 0.2;
                    const color = ns.configs[this.buttonId].dialColorSpeaking;
                    this.update({
                        index: i, 
                        length: length, 
                        thickness: thickness, 
                        color: color, 
                        duration: duration, 
                        delay: 0, 
                        curve: ns.configs[this.buttonId].animationCurve,
                        reverse: true});
                    i++;
                }
            })
        }

        resetToConnectedAnimation() {
            console.log('[Indicator controller] reset all animation')
            this.resetStyles();
            this.updateAll({
                length: this.defaultLength,
                thickness: ns.configs[this.buttonId].dialThicknessConnected,
                color: ns.configs[this.buttonId].dialColorConnected,
                duration: 1,
                delay: 0,
                curve: ns.configs[this.buttonId].animationCurve,
                reverse: false
            });
        }

        resetToStandby() {
            console.log('[Indicator controller] reset all animation and standby')
            this.resetStyles();
            this.updateAll({
                length: this.defaultLength,
                thickness: ns.configs[this.buttonId].dialThickness,
                color: ns.configs[this.buttonId].dialColorUp,
                duration: 1,
                delay: 0,
                curve: ns.configs[this.buttonId].animationCurve,
                reverse: false
            });
        }

        endTurnAnimation() {
            console.log('[Indicator controller] start end turn animation')
            //this.updateAllLength(ns.configs[this.buttonId].dialLength, 1, 0, ns.configs[this.buttonId].animationCurve, false);
            this.updateAll({
                length: this.defaultLength,  // Assuming 'defaultLength' should be set similarly to the resetToConnectedAnimation method
                thickness: ns.configs[this.buttonId].dialThicknessConnected,
                color: ns.configs[this.buttonId].dialColorConnected,
                duration: 1,
                delay: 0,
                curve: ns.configs[this.buttonId].animationCurve,
                reverse: false
            });
        }

        sequentialColorUpdate(interval, colors) {
            const totalDials = ns.configs[this.buttonId].N;
            const updateInterval = interval;
            let currentDial = 0;
        
            // Generate color updates for all dials (assuming you want different colors for each for demonstration)
            // You can modify the color generation logic as per your requirement
            //const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000']; // Sample colors
            const targetColors = colors; //['#31e1e5','#2F7A7C']
            const colorUpdates = [];
        
            for (let i = 0; i < totalDials; i++) {
                const color = targetColors[i % targetColors.length];
                colorUpdates.push(ns.DialUpdateHelper.generateColorUpdate(i, color));
            }
        
            // Function to update each dial's color sequentially
            const updateDialColorSequentially = () => {
                if (currentDial < totalDials) {
                    this.updateDialColor([colorUpdates[currentDial]]);
                    currentDial++;
                    setTimeout(updateDialColorSequentially, updateInterval);
                } else {
                    // Reset all colors 2 seconds after the last color change
                    //setTimeout(() => this.resetColor(), 2000);
                }
            };
        
            // Start updating colors sequentially
            updateDialColorSequentially();
        }
    }

    ns.DialUpdateHelper = class {
        static generateColorUpdate(index, color) {
            return { index, color };
        }

        static generateLengthUpdate(index, length) {
            return { index, length };
        }

        static generateThicknessUpdate(index, thickness) {
            return { index, thickness };
        }

        static generateUpdatesForAll(length, thickness, color, numberOfDials) {
            const updates = [];
            for (let i = 0; i < numberOfDials; i++) {
                updates.push({ index: i, length: length, thickness: thickness, color: color });
            }
            return updates;
        }

        static generateAllColorUpdate(color, totalDials) {
            const updates = [];
            for (let i = 0; i < totalDials; i++) {
                updates.push({ index: i, color });
            }
            return updates;
        }

        static generateAllLengthUpdate(length, totalDials) {
            const updates = [];
            for (let i = 0; i < totalDials; i++) {
                updates.push({ index: i, length });
            }
            return updates;
        }

        static generateAllThicknessUpdate(thickness, totalDials) {
            const updates = [];
            for (let i = 0; i < totalDials; i++) {
                updates.push({ index: i, thickness });
            }
            return updates;
        }
    }
})(Quantz); 