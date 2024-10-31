(function(ns) {
    ns.SignalMonitor = class {
        constructor({ buttonId, interactionController, defaultLang = 'en' }) {
            this.buttonId = buttonId;
            this.lang = defaultLang;

            console.log(`[SignalMonitor] Initializing with buttonId: ${buttonId}, defaultLang: ${defaultLang}`);

            this.interactionController = interactionController;

            if (!this.interactionController) {
                console.error(`[SignalMonitor] InteractionController for buttonId ${buttonId} not found.`);
                return;
            }

            if (!(this.interactionController instanceof ns.InteractionController)) {
                console.error(`[SignalMonitor] interactionController is not an instance of InteractionController class.`);
                return;
            }

            // Use the same frequency as the InteractionController
            this.frequencyMs = this.interactionController.frequencyMs;
            console.log(`[SignalMonitor] Using frequencyMs: ${this.frequencyMs}`);

            // Visualizer elements
            this.$dom = null;
            this.canvas = null;
            this.ctx = null;

            // Colors and styles
            this.humanFundamentalFrequenciesColor = 'rgba(149, 0, 101, 0.5)'; // green
            this.humanDecibelsColor = 'rgba(255, 216, 25, 0.5)'; // red
            this.assistantDecibelsColor = 'rgba(9, 190, 239, 0.5)'; // blue

            // Other configurations
            this.width = 800; // default width
            this.height = 200; // default height

            // Update interval
            this.updateInterval = null;

            // Data ranges for normalization
            this.humanDecibelsRange = { min: -100, max: 0 };
            this.assistantDecibelsRange = { min: -100, max: 0 };
            this.humanFundamentalFrequenciesRange = { min: 0, max: 1000 };

            console.log('[SignalMonitor] Initialized successfully.');
        }

        mount($dom) {
            console.log('[SignalMonitor] Mounting visualizer.');
            this.$dom = $dom;

            // Create canvas element
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx = this.canvas.getContext('2d');

            // Append canvas to $dom
            this.$dom.appendChild(this.canvas);
            console.log('[SignalMonitor] Canvas appended to DOM.');
        }

        startMonitoring() {
            if (!this.canvas || !this.ctx) {
                console.error('[SignalMonitor] Canvas not initialized. Call mount($dom) first.');
                return;
            }

            console.log('[SignalMonitor] Starting monitoring.');
            // Start updating at the same frequency as InteractionController
            this.updateInterval = setInterval(() => {
                this.update();
            }, this.frequencyMs);
            console.log(`[SignalMonitor] Update interval set to ${this.frequencyMs} ms.`);
        }

        stopMonitoring() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                console.log('[SignalMonitor] Monitoring stopped.');
            }
        }

        update() {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.width, this.height);
            //console.log('[SignalMonitor] Canvas cleared.');

            // Get data arrays
            const humanDecibels = this.interactionController.humanDecibels;
            const humanFundamentalFrequencies = this.interactionController.humanFundamentalFrequencies;
            const assistantDecibels = this.interactionController.assistantDecibels;

            //console.log('[SignalMonitor] Retrieved data arrays.');
            //console.log(`[SignalMonitor] humanDecibels length: ${humanDecibels.length}`);
            //console.log(`[SignalMonitor] humanFundamentalFrequencies length: ${humanFundamentalFrequencies.length}`);
            //console.log(`[SignalMonitor] assistantDecibels length: ${assistantDecibels.length}`);

            // Limit data arrays to last N points
            const maxDataPoints = this.width; // One data point per pixel
            const humanDecibelsData = humanDecibels.slice(-maxDataPoints);
            const humanFundamentalFrequenciesData = humanFundamentalFrequencies.slice(-maxDataPoints);
            const assistantDecibelsData = assistantDecibels.slice(-maxDataPoints);

            //console.log(`[SignalMonitor] Data arrays truncated to last ${maxDataPoints} points if necessary.`);

            // Plot data
            this.plotData(humanDecibelsData, this.humanDecibelsColor, this.humanDecibelsRange, 'Human Decibels');
            this.plotData(humanFundamentalFrequenciesData, this.humanFundamentalFrequenciesColor, this.humanFundamentalFrequenciesRange, 'Human Fundamental Frequencies');
            this.plotData(assistantDecibelsData, this.assistantDecibelsColor, this.assistantDecibelsRange, 'Assistant Decibels');
        }

        plotData(dataArray, color, range, label) {
            //console.log(`[SignalMonitor] Plotting ${label}.`);

            // Corrected: Use range.min and range.max
            const normalizedData = this.normalizeData(dataArray, range.min, range.max);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
        
            const dataLength = normalizedData.length;
            const xStep = this.width / dataLength;
        
            for (let i = 0; i < dataLength - 1; i++) {
                const x = this.width - i * xStep;
                const y = this.height - normalizedData[dataLength - i - 1] * this.height;
                const nextX = this.width - (i + 1) * xStep;
                const nextY = this.height - normalizedData[dataLength - i - 2] * this.height;
        
                // Control point for quadratic curve
                const ctrlX = (x + nextX) / 2;
                const ctrlY = (y + nextY) / 2;
        
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                }
        
                this.ctx.quadraticCurveTo(x, y, ctrlX, ctrlY);
            }
        
            this.ctx.stroke();
            //console.log(`[SignalMonitor] Finished plotting ${label}.`);
        }

        normalizeData(dataArray, min, max) {
            // Normalize data to range [0, 1] based on provided min and max
            const range = max - min || 1;

            const normalizedData = dataArray.map((value, index) => {
                const normalizedValue = (value - min) / range;
                // Log the first few normalized values for debugging
                //if (index < 5) {
                //    console.log(`[SignalMonitor] Normalized data[${index}] = ${normalizedValue}`);
                //}
                return normalizedValue;
            });
            return normalizedData;
        }
    };
})(Quantz);
