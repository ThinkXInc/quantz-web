(function(ns) {
    ns.InteractionController = class {

        constructor({ buttonId, frequencyMs, defaultLang = 'en' }) {
            this.buttonId = buttonId;
            this.$buttonLoader = document.getElementById(
                `${ns.configs[buttonId].prefix}button-loader-${buttonId}`
            );
            this.lang = defaultLang;
            this.frequencyMs = frequencyMs;

            this.SPEECH_THRESHOLD = -35;
            this.SILENT_DECIBEL = -60;
            this.HUMAN_SILENCE_THRESHOLD_MS = 1000;

            // Initialize data arrays
            this.assistantDecibels = [];
            this.humanFundamentalFrequencies = [];
            this.humanDecibels = [];

            // Speaking status flags
            this.isHumanSpeaking = false;
            this.isAssistantSpeaking = false;

            // Last known signal values
            this.lastHumanFundamentalFreq = 0;
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
                    console.log('[InteractionController] Human has started speaking.');
                }
                this.silenceDurationMs = 0;
            } else {
                // Decibel is below threshold
                if (this.isHumanSpeaking) {
                    this.silenceDurationMs += this.frequencyMs;
                    console.log(
                        `[InteractionController] Incremented silenceDurationMs to ${this.silenceDurationMs}`
                    );
                    if (this.silenceDurationMs >= this.HUMAN_SILENCE_THRESHOLD_MS) {
                        this.isHumanSpeaking = false;
                        this.silenceDurationMs = 0; // Reset the silence duration
                        console.log('[InteractionController] Human has stopped speaking.');
                    }
                }
            }
        }

        appendHumanSignalData(decibel, fundamentalFreq) {
            // Update last known human signals
            this.lastHumanFundamentalFreq = fundamentalFreq;
            this.lastHumanDecibel = decibel;

            console.log('[InteractionController] Received human signal data');
        }

        appendAssistantSignalData(decibel) {
            this.lastAssistantDecibel = decibel;
            this.isAssistantSpeaking = true;

            console.log('[InteractionController] Received assistant signal data:', {
                decibel: decibel,
            });

            if (this.assistantSpeakingTimeout) {
                clearTimeout(this.assistantSpeakingTimeout);
            }
            this.assistantSpeakingTimeout = setTimeout(() => {
                this.isAssistantSpeaking = false;
                console.log(
                    '[InteractionController] Assistant speaking timeout reached. Assistant is now silent.'
                );
            }, this.frequencyMs * 2); // Adjust as needed
        }

        setAssistantStopSpeaking() {
            this.isAssistantSpeaking = false;
            console.log('[InteractionController] Assistant has stopped speaking.');
        }
    };
})(Quantz);
