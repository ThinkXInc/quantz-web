(function(ns) {
    ns.ResponseMode = Object.freeze({
        TEMPO_ORIENTED: 0,
        NORMAL: 1,
        CAREFUL_LISTENING: 2
    });

    ns.HumanState = Object.freeze({
        SPEAKING: 0,
        WAITING_RESPONSE: 1,
    });
    ns.AssistantState = Object.freeze({
        START_RESPONDING: 0,
        SPEAKING: 1,
        WAITING: 2,
    });

    ns.InteractionController = class {

        constructor({ buttonId, frequencyMs = 100, analysisWindowMs = 500, responseMode = ns.ResponseMode.TEMPO_ORIENTED, defaultLang = 'en' }) {
            this.buttonId = buttonId;
            this.$buttonLoader = document.getElementById(
                `${ns.configs[buttonId].prefix}button-loader-${buttonId}`
            );
            this.lang = defaultLang;
            this.frequencyMs = frequencyMs;

            this.SPEECH_THRESHOLD = -35;
            this.SILENT_DECIBEL = -60;
            this.SILENT_FREQUENCY = 0; // Define a silent frequency value

            this.responseMode = responseMode;

            switch (this.responseMode) {
                case ns.ResponseMode.TEMPO_ORIENTED:
                    this.SHORT_HUMAN_SILENCE_THRESHOLD_MS = 2000;
                    this.DEFAULT_HUMAN_SILENCE_THRESHOLD_MS = 3000;
                    this.LONG_HUMAN_SILENCE_THRESHOLD_MS = 4000;
                    break;
                case ns.ResponseMode.NORMAL:
                    this.SHORT_HUMAN_SILENCE_THRESHOLD_MS = 3000;
                    this.DEFAULT_HUMAN_SILENCE_THRESHOLD_MS = 5000;
                    this.LONG_HUMAN_SILENCE_THRESHOLD_MS = 6000;
                    break;
                 case ns.ResponseMode.CAREFUL_LISTENING:
                    this.SHORT_HUMAN_SILENCE_THRESHOLD_MS = 5000;
                    this.DEFAULT_HUMAN_SILENCE_THRESHOLD_MS = 5000;
                    this.LONG_HUMAN_SILENCE_THRESHOLD_MS = 7000;
                    break;
            }

            this.HUMAN_SILENCE_THRESHOLD_MS = this.DEFAULT_HUMAN_SILENCE_THRESHOLD_MS; // Initialize with default value

            this.analysisWindowMs = analysisWindowMs; // Configurable analysis window

            // Initialize data arrays
            this.assistantDecibels = [];
            this.humanFundamentalFrequencies = [];
            this.humanDecibels = [];

            // Speaking status flags
            this.isHumanSpeaking = false;
            this.isAssistantSpeaking = false;

            this.humanState = ns.HumanState.WAITING;
            this.assistantState = ns.AssistantState.WAITING;

            // Last known signal values
            this.lastHumanFundamentalFreq = this.SILENT_FREQUENCY; // Initialize to silence
            this.lastHumanDecibel = this.SILENT_DECIBEL; // Initialize to silence
            this.lastAssistantDecibel = this.SILENT_DECIBEL;

            // Silence duration tracker
            this.silenceDurationMs = 0;

            console.log(
                '[InteractionController] Initialized with frequencyMs:',
                this.frequencyMs
            );

            // Start appending data at specified intervals
            this.start();
        }

        start() {
            this.clock = setInterval(() => {
                // Append human data
                this.humanFundamentalFrequencies.push(
                    this.lastHumanFundamentalFreq
                );
                this.humanDecibels.push(this.lastHumanDecibel);

                // Append assistant data
                this.assistantDecibels.push(
                    this.isAssistantSpeaking
                        ? this.lastAssistantDecibel
                        : this.SILENT_DECIBEL
                );

                // Dispatch signal data updated event
                this.dispatchSignalDataUpdatedEvent();

                // Check for human silence
                this.checkHumanSilence();

            }, this.frequencyMs);

            console.log(
                '[InteractionController] Data appending started with interval:',
                this.frequencyMs,
                'ms'
            );
        }

        stop() {
            clearInterval(this.clock);
            console.log('[InteractionController] Data appending stopped.');
        }

        checkHumanSilence() {
            if (this.lastHumanDecibel >= this.SPEECH_THRESHOLD) {
                // Decibel is above threshold
                if (!this.isHumanSpeaking) {
                    this.isHumanSpeaking = true;
                    console.warn('[InteractionController] Human has started speaking.');
                    this.dispatchHumanStartSpeakingEvent();
                }
                this.silenceDurationMs = 0;
            } else {
                // Decibel is below threshold
                if (this.isHumanSpeaking) {
                    if (this.silenceDurationMs === 0) {
                        // Just started being silent, analyze the frequency pattern
                        this.analyzeFrequencyPattern();
                    }

                    this.silenceDurationMs += this.frequencyMs;
                    console.log(
                        `[InteractionController] Incremented silenceDurationMs to ${this.silenceDurationMs}`
                    );
                    if (this.silenceDurationMs >= this.HUMAN_SILENCE_THRESHOLD_MS) {
                        this.isHumanSpeaking = false;
                        this.silenceDurationMs = 0; // Reset the silence duration
                        console.log('[InteractionController] Human has stopped speaking.');

                        // Reset last human signal values to silent values
                        this.lastHumanDecibel = this.SILENT_DECIBEL;
                        this.lastHumanFundamentalFreq = this.SILENT_FREQUENCY;

                        this.dispatchHumanStopSpeakingEvent();

                        // Reset HUMAN_SILENCE_THRESHOLD_MS to default after human stops speaking
                        this.HUMAN_SILENCE_THRESHOLD_MS = this.DEFAULT_HUMAN_SILENCE_THRESHOLD_MS;
                    }
                } else {
                    // Human is not speaking
                    // Ensure last human signals are set to silent values
                    this.lastHumanDecibel = this.SILENT_DECIBEL;
                    this.lastHumanFundamentalFreq = this.SILENT_FREQUENCY;
                }
            }
        }

        analyzeFrequencyPattern() {
            const numDataPoints = Math.floor(this.analysisWindowMs / this.frequencyMs);

            // Get the last numDataPoints from humanFundamentalFrequencies
            const freqData = this.humanFundamentalFrequencies.slice(-numDataPoints);

            // Remove zero or silent frequency values (if any)
            const validFreqData = freqData.filter(freq => freq > 0);

            if (validFreqData.length < 2) {
                // Not enough valid data to analyze
                return;
            }

            // Prepare data for linear regression
            // x is time in ms
            const x = [];
            const y = validFreqData;

            for (let i = 0; i < validFreqData.length; i++) {
                x.push(i * this.frequencyMs);
            }

            // Compute linear regression
            const n = x.length;
            const sumX = x.reduce((sum, val) => sum + val, 0);
            const sumY = y.reduce((sum, val) => sum + val, 0);
            const sumXY = x.reduce((sum, val, idx) => sum + val * y[idx], 0);
            const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

            const denominator = n * sumX2 - sumX * sumX;
            if (denominator === 0) {
                // Avoid division by zero
                return;
            }

            const slope = (n * sumXY - sumX * sumY) / denominator;
            const intercept = (sumY - slope * sumX) / n;

            // The slope represents rate of change of frequency per ms

            // Determine the pattern based on the slope
            let pattern = '';

            if (slope <= -0.05) {
                pattern = 'A (suddenly declining)';
                this.HUMAN_SILENCE_THRESHOLD_MS = this.SHORT_HUMAN_SILENCE_THRESHOLD_MS; // Shorter threshold
            } else if (slope <= -0.01) {
                pattern = 'B (gradually declining)';
                this.HUMAN_SILENCE_THRESHOLD_MS = this.DEFAULT_HUMAN_SILENCE_THRESHOLD_MS;
            } else if (slope >= 0.01) {
                pattern = 'D (rising)';
                this.HUMAN_SILENCE_THRESHOLD_MS = this.LONG_HUMAN_SILENCE_THRESHOLD_MS; // Longer threshold
            } else {
                pattern = 'C (almost constant)';
                this.HUMAN_SILENCE_THRESHOLD_MS = this.LONG_HUMAN_SILENCE_THRESHOLD_MS; // Default
            }

            // Log the result
            console.warn(`[InteractionController] F0 PATTERN: *** ${pattern} *** (slope: ${slope.toFixed(4)}) SILENCE_THRESHOLD_MS ${this.HUMAN_SILENCE_THRESHOLD_MS}`);
        }

        appendHumanSignalData(decibel, fundamentalFreq) {
            // Update last known human signals
            this.lastHumanFundamentalFreq = fundamentalFreq;
            this.lastHumanDecibel = decibel;

            //console.log('[InteractionController] Received human signal data');
        }

        appendAssistantSignalData(decibel) {
            this.lastAssistantDecibel = decibel;
            this.isAssistantSpeaking = true;

            //console.log('[InteractionController] Received assistant signal data:', {
            //    decibel: decibel,
            //});

            if (this.assistantSpeakingTimeout) {
                clearTimeout(this.assistantSpeakingTimeout);
            }
            this.assistantSpeakingTimeout = setTimeout(() => {
                this.isAssistantSpeaking = false;
                //console.log(
                //    '[InteractionController] Assistant speaking timeout reached. Assistant is now silent.'
                //);
            }, this.frequencyMs * 2); // Adjust as needed
        }

        dispatchSignalDataUpdatedEvent() {
            const eventName = ns.configs[this.buttonId].signalDataUpdatedEventName;
            if (eventName) {
                //console.log(`[InteractionController] Dispatching ${eventName} event`);
                const event = new CustomEvent(eventName, {
                    detail: { 
                        humanDecibels: this.humanDecibels,
                        humanFundamentalFrequencies: this.humanFundamentalFrequencies,
                        assistantDecibels: this.assistantDecibels,
                    },
                });
                this.$buttonLoader.dispatchEvent(event);
            } else {
                console.warn(
                    `[InteractionController] Event name for signalDataUpdatedEvent not defined in configs for buttonId ${this.buttonId}`
                );
            }
        }

        // human action handler

        dispatchHumanStartSpeakingEvent() {
            console.log(`[InteractionController] Dispatching humanStartSpeakingEvent - buttonId: ${this.buttonId}`);
            this.humanState = ns.HumanState.SPEAKING;
            const event = new CustomEvent(ns.configs[this.buttonId].humanStartSpeakingEventName, {
                detail: {
                    buttonId: this.buttonId,
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        dispatchHumanStopSpeakingEvent() {
            console.log(`[InteractionController] Dispatching humanStopSpeakingEvent - buttonId: ${this.buttonId}`);
            this.humanState = ns.HumanState.WAITING;
            const event = new CustomEvent(ns.configs[this.buttonId].humanStopSpeakingEventName, {
                detail: {
                    buttonId: this.buttonId,
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        // assistant action handler

        didAssistantResponseStart(message) {
            console.log('[InteractionController] Did assistant response started.');
            this.assistantState = ns.AssistantState.START_RESPONDING;

        }

        didAssistantStartPlayingAudioBuffer() {
            console.log('[InteractionController] Did assistant start playing audio buffer.');
            this.assistantState = ns.AssistantState.SPEAKING;
        }

        didAssistantEndTurn() {
            console.log('[InteractionController] Did assistant turn end.');

        }

        didAssistantEndPlayingAudio() {
            this.assistantState = ns.AssistantState.WAITING;
            this.isAssistantSpeaking = false;
            console.log('[InteractionController] Assistant has stopped speaking.');
        }

        // message receive handler

        didAssistantMessageReceive(message) {
            console.log('[InteractionController] Assistant message received: ', message);
        }
        
        
        didHumanMessageReceive(message) {
            console.log('[InteractionController] Human message received: ', message);
        }
        
        
        didAnnounceMessageReceive(message) {
            console.log('[InteractionController] Announce message received: ', message);
        }

    };
})(Quantz);
