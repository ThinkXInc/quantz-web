class SignalMonitor {
    constructor({
        defaultLang = 'en',
        plotAllTimeLine = true,
        humanFundamentalFrequenciesRange = { min: 50, max: 500 }, // Default range adjusted
        humanDecibelsRange = { min: -55, max: 0 },
        assistantDecibelsRange = { min: -55, max: 0 },
    }) {
        this.lang = defaultLang;

        console.log(`[SignalMonitor] Initializing with defaultLang: ${defaultLang}`);

        // Visualizer elements
        this.$dom = null;
        this.canvas = null;
        this.ctx = null;

        // Colors and styles
        this.humanFundamentalFrequenciesColor = 'rgba(149, 0, 101, 0.5)'; // Purple
        this.humanDecibelsColor = 'rgba(255, 216, 25, 0.5)'; // Yellow
        this.assistantDecibelsColor = 'rgba(9, 190, 239, 0.5)'; // Blue

        // Data ranges for normalization
        this.humanDecibelsRange = humanDecibelsRange;
        this.assistantDecibelsRange = assistantDecibelsRange;
        this.humanFundamentalFrequenciesRange = humanFundamentalFrequenciesRange;

        // Summarization group size
        this.groupSize = 3; // Default group size for averaging

        // New property to control plotting all data
        this.plotAllTimeLine = plotAllTimeLine; // Default is false

        // Data arrays (initialize empty)
        this.humanDecibels = [];
        this.humanFundamentalFrequencies = [];
        this.assistantDecibels = [];

        // Bind the resize handler to this instance
        this.handleResize = this.handleResize.bind(this);

        console.log('[SignalMonitor] Initialized successfully.');
    }

    mount($dom) {
        console.log('[SignalMonitor] Mounting visualizer.');
        this.$dom = $dom;

        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Append canvas to $dom
        this.$dom.appendChild(this.canvas);
        console.log('[SignalMonitor] Canvas appended to DOM.');

        // Set initial canvas size
        this.updateCanvasSize();

        // Add event listener for window resize
        window.addEventListener('resize', this.handleResize);
    }

    updateCanvasSize() {
        // Get parent element's size
        const parentWidth = this.$dom.clientWidth;
        const parentHeight = this.$dom.clientHeight;

        // Update canvas dimensions
        this.canvas.width = parentWidth;
        this.canvas.height = parentHeight;

        // Update internal width and height
        this.width = parentWidth;
        this.height = parentHeight;

        console.log(`[SignalMonitor] Canvas size updated to width: ${this.width}, height: ${this.height}`);
    }

    handleResize() {
        // Update canvas size
        this.updateCanvasSize();

        // Redraw the canvas content
        this.update(this.humanDecibels, this.humanFundamentalFrequencies, this.assistantDecibels);
    }

    update(humanDecibels, humanFundamentalFrequencies, assistantDecibels) {
        // Update data arrays
        this.humanDecibels = humanDecibels;
        this.humanFundamentalFrequencies = humanFundamentalFrequencies;
        this.assistantDecibels = assistantDecibels;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Decide which data arrays to use based on plotAllTimeLine
        let humanDecibelsData, humanFundamentalFrequenciesData, assistantDecibelsData;
        if (this.plotAllTimeLine) {
            // Use all data
            humanDecibelsData = this.humanDecibels;
            humanFundamentalFrequenciesData = this.humanFundamentalFrequencies;
            assistantDecibelsData = this.assistantDecibels;
        } else {
            // Limit data arrays to last N points
            const maxDataPoints = this.width; // One data point per pixel
            humanDecibelsData = this.humanDecibels.slice(-maxDataPoints);
            humanFundamentalFrequenciesData = this.humanFundamentalFrequencies.slice(-maxDataPoints);
            assistantDecibelsData = this.assistantDecibels.slice(-maxDataPoints);
        }

        // Adjust group size dynamically if plotAllTimeLine is true
        let groupSize = this.groupSize;
        if (this.plotAllTimeLine && humanDecibelsData.length > this.width) {
            groupSize = Math.ceil((humanDecibelsData.length / this.width) * this.groupSize);
        }

        // Summarize data points by averaging
        const summarizedHumanDecibels = this.summarizeData(humanDecibelsData, groupSize);
        const summarizedHumanFundamentalFrequencies = this.summarizeData(humanFundamentalFrequenciesData, groupSize);
        const summarizedAssistantDecibels = this.summarizeData(assistantDecibelsData, groupSize);

        // Plot data using the drawSmoothCurve method
        this.plotData(summarizedHumanDecibels, this.humanDecibelsColor, this.humanDecibelsRange);
        this.plotData(summarizedHumanFundamentalFrequencies, this.humanFundamentalFrequenciesColor, this.humanFundamentalFrequenciesRange, true); // Indicate that this data is frequency
        this.plotData(summarizedAssistantDecibels, this.assistantDecibelsColor, this.assistantDecibelsRange);
    }

    summarizeData(dataArray, groupSize) {
        const summarizedData = [];
        for (let i = 0; i < dataArray.length; i += groupSize) {
            const group = dataArray.slice(i, i + groupSize);
            const sum = group.reduce((acc, val) => acc + val, 0);
            const avg = sum / group.length;
            summarizedData.push(avg);
        }
        return summarizedData;
    }

    plotData(dataArray, color, range, isFrequency = false) {
        // Normalize data
        let normalizedData;
        if (isFrequency) {
            // Apply Mel scale to frequencies
            normalizedData = this.normalizeFrequencyData(dataArray);
        } else {
            normalizedData = this.normalizeData(dataArray, range.min, range.max);
        }

        // Prepare points for drawing
        const points = [];
        const dataLength = normalizedData.length;

        // Calculate xStep based on plotAllTimeLine flag
        const xStep = this.width / (dataLength - 1 || 1); // Prevent division by zero

        for (let i = 0; i < dataLength; i++) {
            const x = i * xStep;
            const y = this.height - normalizedData[i] * this.height;
            points.push({ x, y });
        }

        // Draw smooth curve with filled area
        this.drawSmoothCurve(this.ctx, points, color);
    }

    drawSmoothCurve(ctx, points, color) {
        if (points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y); // Move to the first point

        for (let i = 1; i < points.length - 1; i++) {
            let current = points[i],
                next = points[i + 1],
                midPoint = this.midpoint(current, next);
            ctx.quadraticCurveTo(current.x, current.y, midPoint.x, midPoint.y);
        }

        // Draw the last curve to the last point
        ctx.quadraticCurveTo(
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].x,
            points[points.length - 1].y
        );

        // Close the path by drawing a line to the bottom of the canvas
        ctx.lineTo(points[points.length - 1].x, ctx.canvas.height); // Go down to the bottom
        ctx.lineTo(points[0].x, ctx.canvas.height); // Go back to the start
        ctx.closePath(); // Close the path

        // Fill the path
        ctx.fillStyle = color.replace('0.5', '0.2'); // Adjust opacity for fill
        ctx.fill();

        // Stroke the path with the line color
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    midpoint(point1, point2) {
        return {
            x: (point1.x + point2.x) / 2,
            y: (point1.y + point2.y) / 2,
        };
    }

    normalizeData(dataArray, min, max) {
        // Normalize data to range [0, 1] based on provided min and max
        const range = max - min || 1;

        return dataArray.map(value => (value - min) / range);
    }

    normalizeFrequencyData(frequencyArray) {
        // Clip frequencies to the specified range
        const minFreq = this.humanFundamentalFrequenciesRange.min;
        const maxFreq = this.humanFundamentalFrequenciesRange.max;

        const clippedFrequencies = frequencyArray.map(freq =>
            Math.min(Math.max(freq, minFreq), maxFreq)
        );

        // Convert frequencies to Mel scale
        const melValues = clippedFrequencies.map(freq => {
            return 2595 * Math.log10(1 + freq / 700);
        });

        // Find min and max Mel values
        const minMel = 2595 * Math.log10(1 + minFreq / 700);
        const maxMel = 2595 * Math.log10(1 + maxFreq / 700);

        const melRange = maxMel - minMel || 1;

        // Normalize Mel values to range [0, 1]
        const normalizedData = melValues.map(melValue => (melValue - minMel) / melRange);

        return normalizedData;
    }

    // Call this method when you no longer need the SignalMonitor
    destroy() {
        // Remove event listener for window resize
        window.removeEventListener('resize', this.handleResize);

        // Clean up DOM elements
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        console.log('[SignalMonitor] Destroyed.');
    }
}
