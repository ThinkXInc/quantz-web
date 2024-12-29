class ProgramViewConnections {
    constructor({
        programView,
        $parentView,
        strokeColor = '#fff'
    }) {
        console.log('[ProgramViewConnections.constructor] Initializing with programView and $parentView:', {
            programView,
            $parentView
        });

        this.programView = programView;
        this.$parentView = $parentView;
        this.strokeColor = strokeColor;
        this.$svgLayer = null;

        this.initSVG();
        this.attachListeners();
    }

    /**
     * Create and insert the <svg> that will hold all arrow paths.
     */
    initSVG() {
        console.log('[ProgramViewConnections.initSVG] Creating the <svg> element for arrow paths.');

        // Create an <svg> element in the same scrolling container as steps
        this.$svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.$svgLayer.classList.add('ProgramView-ArrowsLayer');

        // Position absolutely or relatively so it covers the scroll area
        this.$svgLayer.style.position = 'absolute';
        this.$svgLayer.style.top = '0';
        this.$svgLayer.style.left = '0';
        this.$svgLayer.style.width = '100%';
        this.$svgLayer.style.height = '100%';
        this.$svgLayer.style.pointerEvents = 'none';
        
        // Append to the scroll container
        this.$parentView.appendChild(this.$svgLayer);

        console.log('[ProgramViewConnections.initSVG] <svg> appended to $parentView.');
    }

    /**
     * Set up scroll and resize listeners so we can re-draw arrows if positions change.
     */
    attachListeners() {
        console.log('[ProgramViewConnections.attachListeners] Setting up scroll and resize event listeners.');

        // Throttle or debounce as needed in real usage
        window.addEventListener('resize', () => {
            console.log('[ProgramViewConnections.attachListeners] Window resized; calling drawAllArrows().');
            this.drawAllArrows();
        });

        this.$parentView.addEventListener('scroll', () => {
            console.log('[ProgramViewConnections.attachListeners] Parent view scrolled; calling drawAllArrows().');
            this.drawAllArrows();
        });
    }

    /**
     * Main method to re-draw all arrows for the current set of steps.
     */
    drawAllArrows() {
        console.log('[ProgramViewConnections.drawAllArrows] Clearing existing arrow paths.');

        // Clear existing paths
        while (this.$svgLayer.firstChild) {
            this.$svgLayer.removeChild(this.$svgLayer.firstChild);
        }

        // If there's less than 2 steps, no arrows needed
        const stepsData = this.programView.stepsData;
        console.log('[ProgramViewConnections.drawAllArrows] stepsData length:', stepsData.length);
        if (stepsData.length < 2) {
            console.log('[ProgramViewConnections.drawAllArrows] Fewer than 2 steps; skipping arrow drawing.');
            return;
        }

        // Iterate over each adjacent pair of steps and create an arrow
        for (let i = 0; i < stepsData.length - 1; i++) {
            console.log(`[ProgramViewConnections.drawAllArrows] Creating arrow from step ${i} to step ${i + 1}.`);
            this.createArrow(i, i + 1);
        }
    }

    /**
     * Create one arrow (path) from step i to step j
     */
    createArrow(fromIndex, toIndex) {
        console.log(`[ProgramViewConnections.createArrow] Creating arrow from step ${fromIndex} to step ${toIndex}.`);

        // DOM elements for each step container
        const fromContainer = this.programView.stepsData[fromIndex].container;
        const toContainer = this.programView.stepsData[toIndex].container;

        // Compute bounding rects
        const fromRect = fromContainer.getBoundingClientRect();
        const toRect = toContainer.getBoundingClientRect();
        console.log('[ProgramViewConnections.createArrow] fromRect:', fromRect);
        console.log('[ProgramViewConnections.createArrow] toRect:', toRect);

        // Because we are inside a scroll container, you might need
        // the container's offset or scrollLeft:
        const parentViewRect = this.$parentView.getBoundingClientRect();
        const scrollLeft = this.$parentView.scrollLeft;
        const scrollTop = this.$parentView.scrollTop;

        console.log('[ProgramViewConnections.createArrow] parentViewRect:', parentViewRect);
        console.log('[ProgramViewConnections.createArrow] scrollLeft:', scrollLeft, ' scrollTop:', scrollTop);

        // Calculate positions relative to the SVG or container
        const fromX = (fromRect.right - parentViewRect.left) + scrollLeft;
        const fromY = (fromRect.top - parentViewRect.top) + (fromRect.height / 2) + scrollTop;
        const toX = (toRect.left - parentViewRect.left) + scrollLeft;
        const toY = (toRect.top - parentViewRect.top) + (toRect.height / 2) + scrollTop;

        console.log('[ProgramViewConnections.createArrow] fromX:', fromX, 'fromY:', fromY, 'toX:', toX, 'toY:', toY);

        // A simple cubic bezier path (S-curve)
        const midX = (fromX + toX) / 2;
        const pathD = `
            M ${fromX},${fromY}
            C ${midX},${fromY}
              ${midX},${toY}
              ${toX},${toY}
        `;

        // Create path element
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathD);
        pathEl.setAttribute('fill', 'none');
        pathEl.setAttribute('stroke', this.strokeColor);
        pathEl.setAttribute('stroke-width', '2');
        // Optionally add a tiny arrowhead or circle

        // If you want an animation of drawing:
        pathEl.style.strokeDasharray = '400';     // Or compute from path length
        pathEl.style.strokeDashoffset = '400';
        pathEl.style.animation = 'arrowDraw 1s forwards ease';

        this.$svgLayer.appendChild(pathEl);
        console.log('[ProgramViewConnections.createArrow] Arrow path appended to SVG layer.');
    }

    /**
     * Helper to call when steps are updated, so we can re-draw.
     */
    updateConnections() {
        console.log('[ProgramViewConnections.updateConnections] Steps updated; calling drawAllArrows().');
        this.drawAllArrows();
    }

    /**
     * (Optional) If you ever need to remove event listeners or clean up
     */
    destroy() {
        console.log('[ProgramViewConnections.destroy] Removing event listeners and cleaning up the SVG layer.');

        window.removeEventListener('resize', this.drawAllArrows);
        this.$parentView.removeEventListener('scroll', this.drawAllArrows);

        // Remove SVG if needed
        if (this.$svgLayer && this.$svgLayer.parentNode) {
            this.$svgLayer.parentNode.removeChild(this.$svgLayer);
            console.log('[ProgramViewConnections.destroy] SVG layer removed from the DOM.');
        }
    }
}
