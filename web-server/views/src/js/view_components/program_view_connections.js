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
        // Clear existing
        while (this.$svgLayer.firstChild) {
          this.$svgLayer.removeChild(this.$svgLayer.firstChild);
        }
    
        const stepsData = this.programView.stepsData;
        if (stepsData.length < 2) return;
    
        // Suppose we connect each consecutive pair:
        for (let i = 0; i < stepsData.length - 1; i++) {
          const fromView = stepsData[i].container;
          const toView   = stepsData[i+1].container;
          this.createArrow(fromView, toView);
        }
      }
    

    /**
     * Create one arrow (path) from step i to step j
     */
    createArrow(fromView, toView) {
        // getBoundingClientRect relative to background container
        const bgRect = this.$parentView.getBoundingClientRect();
    
        const fromRect = fromView.getBoundingClientRect();
        const toRect   = toView.getBoundingClientRect();
    
        // Right edge of fromView at vertical center
        const fromX = fromRect.right - bgRect.left;
        const fromY = (fromRect.top + fromRect.height/2) - bgRect.top;
    
        // Left edge of toView at vertical center
        const toX   = toRect.left - bgRect.left;
        const toY   = (toRect.top + toRect.height/2) - bgRect.top;
    
        // Then construct your path
        const elbowX = fromX + 50; // horizontal elbow offset
        const pathD = `
          M ${fromX},${fromY}
          L ${elbowX},${fromY}
          L ${elbowX},${toY}
          L ${toX},${toY}
        `;
    
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathD);
        pathEl.setAttribute('fill', 'none');
        pathEl.setAttribute('stroke', this.strokeColor);
        pathEl.setAttribute('stroke-width', '2');
        pathEl.setAttribute('marker-end', 'url(#arrowHead)'); // if you define a marker
    
        this.$svgLayer.appendChild(pathEl);
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
