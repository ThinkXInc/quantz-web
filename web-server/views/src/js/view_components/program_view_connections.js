class ProgramViewConnections {
    constructor({
        programView,
        $parentView,
        strokeColor = '#fafafa',
        lineStrokeWidth = 1,         // 3) line thickness
        arrowHeadSize = 12,          // 2) arrow head size
        cornerRadius = 8             // 1) small radius at 90° bends
    }) {
        console.log('[ProgramViewConnections.constructor] Initializing with programView and $parentView:', {
            programView,
            $parentView
        });

        this.programView     = programView;
        this.$parentView     = $parentView;
        this.strokeColor     = strokeColor;
        this.lineStrokeWidth = lineStrokeWidth;
        this.arrowHeadSize   = arrowHeadSize;
        this.cornerRadius    = cornerRadius;

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

        // Position absolutely so it covers the scroll area
        this.$svgLayer.style.position = 'absolute';
        this.$svgLayer.style.top = '0';
        this.$svgLayer.style.left = '0';
        this.$svgLayer.style.width = '100%';
        this.$svgLayer.style.height = '100%';
        this.$svgLayer.style.pointerEvents = 'none';

        // Append to the scroll container
        this.$parentView.appendChild(this.$svgLayer);

        // --- 2) Define <marker> using your arrow SVG path, so we can do `marker-end="url(#arrowHead)"` ---
        const defsEl = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const markerEl = document.createElementNS('http://www.w3.org/2000/svg', 'marker');

        // Configure the marker so that:
        //   - It uses userSpaceOnUse so that it can be scaled with markerWidth/markerHeight.
        //   - It references the provided arrow path scaled into a 0..60 x 0..60 viewBox.
        //   - We place the tip of the arrow at the path's rightmost point (x=60) by using refX=60.
        //   - The vertical center is refY=30.
        markerEl.setAttribute('id', 'arrowHead');
        markerEl.setAttribute('viewBox', '0 0 60 60');
        markerEl.setAttribute('refX', '60');           // tip of the arrow at x=60
        markerEl.setAttribute('refY', '30');           // vertically centered at y=30
        markerEl.setAttribute('markerUnits', 'userSpaceOnUse');
        markerEl.setAttribute('markerWidth', this.arrowHeadSize);   // scale depends on arrowHeadSize
        markerEl.setAttribute('markerHeight', this.arrowHeadSize);  
        markerEl.setAttribute('orient', 'auto');       // auto-rotate to match path direction

        // Create the path inside the marker
        const arrowPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPathEl.setAttribute('d', 
            'M58.8,29.8c-0.1-1.2-1.7-1.9-1.7-1.9S8.9,8.1,6.7,7.1C4.4,6.1,3.8,6,2.7,6.6S2.5,9.1,2.5,9.1l9.2,15.7 '
          + 'c0.1,0.2,2.3,4.6,0.6,9.3L2.5,50.9c0,0-0.9,2,0.2,2.6c1.1,0.6,1.7,0.5,3.9-0.5c2.3-1,50.4-20.8,50.4-20.8s1.7-0.7,1.7-1.9 '
          + 'C58.8,30,58.8,29.9,58.8,29.8z'
        );
        // Fill color matches strokeColor
        arrowPathEl.setAttribute('fill', this.strokeColor);

        markerEl.appendChild(arrowPathEl);
        defsEl.appendChild(markerEl);
        this.$svgLayer.appendChild(defsEl);

        console.log('[ProgramViewConnections.initSVG] <svg> appended to $parentView, marker defined.');
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

        // We need to re-append the marker <defs> because removing all children
        // also removes our marker definition.
        this.initSVG();

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
        const bgRect   = this.$parentView.getBoundingClientRect();
        const fromRect = fromView.getBoundingClientRect();
        const toRect   = toView.getBoundingClientRect();
    
        // Right edge of fromView at vertical center
        const fromX = fromRect.right - bgRect.left;
        const fromY = (fromRect.top + fromRect.height / 2) - bgRect.top;
    
        // Left edge of toView at vertical center
        const toX = toRect.left - bgRect.left;
        const toY = (toRect.top + toRect.height / 2) - bgRect.top;
    
        // Decide how far we want to extend horizontally for the "elbow".
        // You might keep this fixed or make it adapt to the distance between fromX and toX.
        const elbowX = fromX + 50;
    
        // Determine vertical direction:
        // +1 if toY is below fromY, -1 if toY is above fromY.
        const verticalDir = (toY >= fromY) ? 1 : -1;
    
        // The total vertical distance we need to travel
        const deltaY = toY - fromY;
        const absDeltaY = Math.abs(deltaY);
    
        // We'll adjust the corner radius if the fromY and toY are very close.
        // Specifically, if absDeltaY < 2*r, reduce r so we don't arc back on ourselves.
        let r = this.cornerRadius;
        if (absDeltaY < 2 * r) {
            r = absDeltaY / 2;
        }
    
        // Construct the path using a Quadratic arc for each 90° corner.
        // We move horizontally from fromX to elbowX - r, then arc around the corner
        // to go vertical, then arc again to go horizontal toward toX.
        //
        // The sign of the arc on the vertical pieces depends on whether we go up or down.
    
        const pathD = `
            M ${fromX},${fromY}
            H ${elbowX - r}
            Q ${elbowX},${fromY}, ${elbowX},${fromY + verticalDir * r}
            V ${toY - verticalDir * r}
            Q ${elbowX},${toY}, ${elbowX + r},${toY}
            H ${toX}
        `;
    
        // Create the path element
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', pathD);
        pathEl.setAttribute('fill', 'none');
        pathEl.setAttribute('stroke', this.strokeColor);
        pathEl.setAttribute('stroke-width', this.lineStrokeWidth);
        pathEl.setAttribute('marker-end', 'url(#arrowHead)');
    
        // Append path to SVG
        this.$svgLayer.appendChild(pathEl);
    
        // Optionally draw small circles at the start/end
        const circleRadius = this.lineStrokeWidth * 1.5;
    
        // Start circle
        const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startCircle.setAttribute('cx', fromX);
        startCircle.setAttribute('cy', fromY);
        startCircle.setAttribute('r', circleRadius);
        startCircle.setAttribute('fill', this.strokeColor);
        this.$svgLayer.appendChild(startCircle);
    
        // End circle
        const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        endCircle.setAttribute('cx', toX);
        endCircle.setAttribute('cy', toY);
        endCircle.setAttribute('r', circleRadius);
        endCircle.setAttribute('fill', this.strokeColor);
        this.$svgLayer.appendChild(endCircle);
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
