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
            this.SILENT_FREQUENCY = 0; // Define a silent frequency value
            this.HUMAN_SILENCE_THRESHOLD_MS = 5000;

            // Initialize data arrays
            this.assistantDecibels = [];
            this.humanFundamentalFrequencies = [];
            this.humanDecibels = [];

            // Speaking status flags
            this.isHumanSpeaking = false;
            this.isAssistantSpeaking = false;

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

                        // Reset last human signal values to silent values
                        this.lastHumanDecibel = this.SILENT_DECIBEL;
                        this.lastHumanFundamentalFreq = this.SILENT_FREQUENCY;

                        this.dispatchHumanStopSpeakingEvent();
                    }
                } else {
                    // Human is not speaking
                    // Ensure last human signals are set to silent values
                    this.lastHumanDecibel = this.SILENT_DECIBEL;
                    this.lastHumanFundamentalFreq = this.SILENT_FREQUENCY;
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

        dispatchHumanStopSpeakingEvent() {
            console.log(`[Core] Dispatching humanStopSpeakingEvent - buttonId: ${this.buttonId}`);
            const event = new CustomEvent(ns.configs[this.buttonId].humanStopSpeakingEventName, {
                detail: {
                    buttonId: this.buttonId,
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        setAssistantStopSpeaking() {
            this.isAssistantSpeaking = false;
            console.log('[InteractionController] Assistant has stopped speaking.');
        }
    };
})(Quantz);
