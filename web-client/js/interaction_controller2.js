(function(ns) {
    ns.InteractionController = class {

        constructor({buttonId, frequencyMs, defaultLang = 'en'}) {
            this.buttonId = buttonId;
            this.$buttonLoader = document.getElementById(`${ns.configs[buttonId].prefix}button-loader-${buttonId}`)
            this.lang = defaultLang;
            this.frequencyMs = frequencyMs;
            this.startTime = null;

            // Initialize data lists
            this.assistantDecibels = [];
            this.humanFundamentalFrequencies = [];
            this.humanDecibels = [];
        }

        start() {
            // Start timestamp in milliseconds
            console.log('[InteractionController] interaction start.')
            this.startTime = Date.now();

            //ns.cores[this.buttonId].initializeAudio();
            //ns.cores[this.buttonId].connect(() => {
            //    console.log(`[Quantz Button ${this.buttonId}] Connection established.`);
            //    ns.buttonControllers[this.buttonId].switchToConnected(); // Switch to the connected state
            //    ns.buttonControllers[this.buttonId].switchStandbyToPushSpeak(); // Switch to the speaking state
            //    console.log('*****************************')
            //    ns.cores[this.buttonId].sendStartMessage();
            //    console.log('*****************************')
            //});
 
        }

        // Method to append assistant decibel data
        appendAssistantDecibel(decibel) {
            //if (!this.startTime) {
            //    console.error('[InteractionController] must start at first.')
            //}
            const timestamp = Date.now() - this.startTime; // Time since start in ms
            this.assistantDecibels.push({'timestamp': timestamp, 'value': decibel});
        }

        // Method to append human decibel data
        appendHumanDecibel(decibel) {
            const timestamp = Date.now() - this.startTime;
            this.humanDecibels.push({'timestamp': timestamp, 'value': decibel});
        }

        // Method to append human fundamental frequency data
        appendHumanFundamentalFrequency(frequency) {
            const timestamp = Date.now() - this.startTime;
            this.humanFundamentalFrequencies.push({'timestamp': timestamp, 'value': frequency});
        }

        // Method to get data arrays up to current time
        getDataArray() {
            const currentTime = Date.now() - this.startTime; // Time since start in ms

            // Calculate number of intervals based on frequencyMs
            const numIntervals = Math.ceil(currentTime / this.frequencyMs);

            // Initialize data arrays with zeros
            const assistantDecibelsArray = new Array(numIntervals).fill(0);
            const humanDecibelsArray = new Array(numIntervals).fill(0);
            const humanFundamentalFrequenciesArray = new Array(numIntervals).fill(0);

            // Helper function to populate a data array from a data list
            const populateDataArray = (dataList, dataArray) => {
                dataList.forEach(dataPoint => {
                    // Determine which interval the dataPoint belongs to
                    // Slot index is calculated based on the timestamp
                    const slotIndex = Math.ceil(dataPoint.timestamp / this.frequencyMs) - 1;

                    if (slotIndex >= 0 && slotIndex < dataArray.length) {
                        dataArray[slotIndex] = dataPoint.value;
                    }
                });
            }

            // Populate data arrays
            populateDataArray(this.assistantDecibels, assistantDecibelsArray);
            populateDataArray(this.humanDecibels, humanDecibelsArray);
            populateDataArray(this.humanFundamentalFrequencies, humanFundamentalFrequenciesArray);

            // Return an object containing the data arrays
            return {
                assistantDecibels: assistantDecibelsArray,
                humanDecibels: humanDecibelsArray,
                humanFundamentalFrequencies: humanFundamentalFrequenciesArray
            };
        }

        // Method to clear data
        clearData() {
            this.assistantDecibels = [];
            this.humanDecibels = [];
            this.humanFundamentalFrequencies = [];
            // Reset startTime to now
            this.startTime = Date.now();
        }
    }
})(Quantz);
