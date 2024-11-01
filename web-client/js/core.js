(function(ns) {
    ns.MessageType = Object.freeze({
        HEALTH_CHECK: 0,
        TEXT_MESSAGE: 1,
        WAV_STREAM: 2
    });

    ns.START_MESSAGE = '\\START';
    ns.END_OF_MESSAGE = '\\END';
    ns.endOfMessageBytes = new TextEncoder().encode(ns.END_OF_MESSAGE);
    ns.FFT_SIZE = 2048;//64;  // 64 fails to accurate frequency
    ns.SMOOTHING_TIME = 0.1;
    ns.MIN_DECIBELS = -70;
    ns.MAX_DECIBELS = -10;

    ns.Core = class {

        constructor({buttonId, defaultLang = 'en'}) {
            this.buttonId = buttonId;
            this.$buttonLoader = document.getElementById(`${ns.configs[buttonId].prefix}button-loader-${buttonId}`)
            this.lang = defaultLang;
            this.audioCtx = null;
            this.assistantAudioAnalyzer = null;
            this.humanAudioAnalyzer = null;
            this.decoder; // OpusDecoder instance
            this.socket;  // WebSocket instance

            this.token;

            this.isConnected = false;

            this.mediaRecorder;
            this.audioChunks = [];
            this.isRecording = false;

            this.audioBufferQueue = [];
            this.isAudioPlaying = false;
            this.playbackQueue = [];
        
            this.history = []; // Initialize an empty array to store the dialogue history

            this.assistantSpectrumInterval = null;
            this.humanSpectrumInterval = null;
        }

        async initializeAudio() {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

                this.assistantAudioAnalyzer = this.audioCtx.createAnalyser();
                this.assistantAudioAnalyzer.fftSize = ns.FFT_SIZE;
                this.assistantAudioAnalyzer.smoothingTimeConstant = ns.SMOOTHING_TIME;
                this.assistantAudioAnalyzer.minDecibels = ns.MIN_DECIBELS;
                this.assistantAudioAnalyzer.maxDecibels = ns.MAX_DECIBELS;

                this.humanAudioAnalyzer = this.audioCtx.createAnalyser();
                this.humanAudioAnalyzer.fftSize = ns.FFT_SIZE;
                this.humanAudioAnalyzer.smoothingTimeConstant = ns.SMOOTHING_TIME;
                this.humanAudioAnalyzer.minDecibels = ns.MIN_DECIBELS;
                this.humanAudioAnalyzer.maxDecibels = ns.MAX_DECIBELS;
            }

            if (!this.mediaRecorder) {
                this.initializeMediaRecorder();
                //try {
                //    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                //    this.mediaRecorder = new MediaRecorder(stream);
                //    this.mediaRecorder.ondataavailable = (e) => {
                //        this.audioChunks.push(e.data);
                //    };
                //    this.mediaRecorder.onstop = (e) => {
                //        const messageType = new Uint8Array([ns.MessageType.WAV_STREAM]);
                //        const langBytes = new TextEncoder().encode(this.lang); // 2 bytes, ensure lang is 2 characters
                //    
                //        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                //    
                //        // Combine all parts into a single Blob
                //        const blobWithHeader = new Blob([messageType, langBytes, audioBlob, ns.endOfMessageBytes], { type: 'audio/wav' });
                //    
                //        if (this.socket.readyState === WebSocket.OPEN) {
                //            this.socket.send(blobWithHeader);
                //            console.log("Audio blob with header sent to server.");
                //        } else {
                //            console.error("WebSocket is not open. ReadyState:", this.socket.readyState);
                //        }
                //    
                //        console.log("Audio blob details:", {
                //            size: blobWithHeader.size,
                //            type: blobWithHeader.type,
                //            chunksCount: this.audioChunks.length
                //        });
                //    
                //        this.audioChunks = [];
                //    };

                //    // connect the microphone to the analyzer
                //    this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
                //    this.sourceNode.connect(this.humanAudioAnalyzer);
                //} catch (e) {
                //    console.error("Error getting user media:", e);
                //}
            }
        }

        async initializeMediaRecorder() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.mediaRecorder.ondataavailable = (e) => {
                    this.audioChunks.push(e.data);
                };
                this.mediaRecorder.onstop = (e) => {
                    this.submitHumanSpeach();
                    this.audioChunks = [];
                };

                // connect the microphone to the analyzer
                this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
                this.sourceNode.connect(this.humanAudioAnalyzer);
            } catch (e) {
                console.error("Error getting user media:", e);
            }
        }

        async submitHumanSpeach() {
            const messageType = new Uint8Array([ns.MessageType.WAV_STREAM]);
            const langBytes = new TextEncoder().encode(this.lang); // 2 bytes, ensure lang is 2 characters
            
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            
            // Combine all parts into a single Blob
            const blobWithHeader = new Blob([messageType, langBytes, audioBlob, ns.endOfMessageBytes], { type: 'audio/wav' });
            
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(blobWithHeader);
                console.log("Audio blob with header sent to server.");
            } else {
                console.error("WebSocket is not open. ReadyState:", this.socket.readyState);
            }
            
            console.log("Audio blob details:", {
                size: blobWithHeader.size,
                type: blobWithHeader.type,
                chunksCount: this.audioChunks.length
            });
        }

        //initializeMediaRecorder() {
        //    navigator.mediaDevices.getUserMedia({ audio: true })
        //        .then(stream => {
        //            this.mediaRecorder = new MediaRecorder(stream);
        //            this.mediaRecorder.ondataavailable = (e) => {
        //                this.audioChunks.push(e.data);
        //                console.warn('**************************>>>>>>>>>>>>>>>>>>>>>>>push')
        //            };
        //            this.mediaRecorder.onstop = (e) => {
        //                this.sendWav();
        //                console.warn('**************************>>>>>>>>>>>>>>>>>>>>>>>stop')
        //            };

        //            // connect the microphone to the analyzer
        //            this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
        //            this.sourceNode.connect(this.humanAudioAnalyzer);
        //            console.warn('**************************>>>>>>>>>>>>>>>>>>>>>>>setup')
        //        })
        //        .catch(e => console.error("Error getting user media:", e));
        //}

        async getToken() {
            // Request a token from Quantz server
            try {
                let pageURL = encodeURIComponent(window.location.href); 
                let origin = encodeURIComponent(window.location.origin);
                let url = `https://${ns.configs[this.buttonId].host}/stream/api/request-token?pageURL=${pageURL}&origin=${origin}`;
                let response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Origin header' It's automatically set by the browser for certain types of requests, especially cross-origin requests
                        // Additional headers can be added for security
                    },
                    body: JSON.stringify({ origin, pageURL })
                });

                if (!response.ok) {
                    // Instead of throwing an error, return an object indicating the status
                    return {
                        token: null,
                        status: response.status,
                        error: new Error('Token request was denied. Status: ' + response.status)
                    };
                }
    
                const token = await response.text();
                return { token, status: response.status, error: null };
            } catch (error) {
                console.error("Network error:", error);
                return { token: null, status: null, error };
            }
        }

        async connect(onConnected) {
            const result = await this.getToken();

            if (result.error) {
                console.error('Error obtaining token:', result.error);
                this.dispatchFailedToGetTokenEvent(result.error, result.status);
                return;
            }


            this.token = result.token;
            console.log("Token obtained:", this.token);

            try {
                // Initialize OpusDecoder
                this.decoder = new window["opus-decoder"].OpusDecoder({ sampleRate: ns.configs[this.buttonId].sampleRate, channels: 1 });
                await this.decoder.ready;
                console.log("Decoder is ready.");

                // Initialize WebSocket
                //const serverUrl = 'wss://quantz.thinkxinc.com:8001/ws';
                const serverUrl = `wss://${ns.configs[this.buttonId].host}/stream/ws?token=${encodeURIComponent(this.token)}`;
                this.socket = new WebSocket(serverUrl);
                this.socket.onopen = (e) => {
                    console.log("Connection to server opened.");
                    this.isConnected = true; // Set isConnected to true once the connection is open
                    if (typeof onConnected === 'function') {
                        onConnected();  // Call the callback function when connected
                    }
                };
                this.socket.onerror = (e) => console.error("[Error] An error occurred with the WebSocket:", e);
                this.socket.onmessage = this.handleWebSocketMessage.bind(this);;
                this.socket.onclose = (e) => {
                    this.isConnected = false;
                    if (e.wasClean) {
                        console.log(`Connection closed cleanly, code=${e.code}, reason=${e.reason}`);
                    } else {
                        console.log('Connection died', `Close event code: ${e.code}, reason: ${e.reason}`);
                    }
                };

            } catch (e) {
                console.error("Error initializing OpusDecoder:", e);
            }
        }

        sendStartMessage() {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                console.error("Cannot send start message: WebSocket is not connected.");
                return;
            }
        
            const messageType = new Uint8Array([ns.MessageType.WAV_STREAM]); // Adjust messageType if necessary
            const langBytes = new TextEncoder().encode(this.lang);
            const startMessageBytes = new TextEncoder().encode(ns.START_MESSAGE);
            const endOfMessageBytes = new TextEncoder().encode(ns.END_OF_MESSAGE);
        
            // Combine all parts into a single Blob
            const messageBlob = new Blob([messageType, langBytes, startMessageBytes, endOfMessageBytes], { type: 'application/octet-stream' });
        
            this.socket.send(messageBlob);
            console.log("Start message sent to server:", ns.START_MESSAGE);
        }

        sendWav() {
            const messageType = new Uint8Array([ns.MessageType.WAV_STREAM]);
            const langBytes = new TextEncoder().encode(this.lang); // 2 bytes, ensure lang is 2 characters
            
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            
            // Combine all parts into a single Blob
            const blobWithHeader = new Blob([messageType, langBytes, audioBlob, ns.endOfMessageBytes], { type: 'audio/wav' });
            
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(blobWithHeader);
                console.log("Audio blob with header sent to server.");
            } else {
                console.error("WebSocket is not open. ReadyState:", this.socket.readyState);
            }
            
            console.log("Audio blob details:", {
                size: blobWithHeader.size,
                type: blobWithHeader.type,
                chunksCount: this.audioChunks.length
            });
            
            this.audioChunks = [];
        }

        startRecording() {
            console.log(`MediaRecorder state before start: ${this.mediaRecorder.state}`);
            if (!this.isRecording) {
                this.audioChunks = [];
                this.mediaRecorder.start();
                this.isRecording = true;
                console.log(`MediaRecorder started. State after start: ${this.mediaRecorder.state}`);
            
                // Resume the audio context on user interaction
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                    console.log(`audioCtx resumed`);
                }

                // Start dispatching the human audio signal event
                this.startDispatchingHumanAudioSignalEvent();
            }
        }

        stopRecording() {
            console.log(`MediaRecorder state before stop: ${this.mediaRecorder.state}`);
            if (this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                console.log(`MediaRecorder stopped. State after stop: ${this.mediaRecorder.state}`);

                // Finish dispatching the human audio signal event
                this.finishDispatchingHumanAudioSignalEvent();
            }
        }

        playBufferedAudio() {
            //DEBUG: console.log("playBufferedAudio called, audioBufferQueue length:", audioBufferQueue.length, "isAudioPlaying:", isAudioPlaying);

            if (this.audioBufferQueue.length === 0) {
                this.isAudioPlaying = false;
                this.finishDispatchingAssistantAudioSignalEvent();
                this.dispatchAssistantEndAudioSignalEvent();
                //DEBUG: console.log("audioBufferQueue is empty, checking playbackQueue...");
                if (this.playbackQueue.length > 0) {
                    //DEBUG: console.log("Moving next item from playbackQueue to audioBufferQueue");
                    this.audioBufferQueue = this.playbackQueue.shift();
                    this.playBufferedAudio();
                } else {
                    //DEBUG: console.log("playbackQueue is also empty, no more audio to play");
                }
                return; 
            }
        
            this.isAudioPlaying = true;

            //DEBUG: console.log("Starting audio playback with combined buffer");

            // Combine all buffered audio into a single buffer
            let totalLength = this.audioBufferQueue.reduce((acc, buffer) => acc + buffer.length, 0);
            let combinedBuffer = this.audioCtx.createBuffer(1, totalLength, 24000); // Assuming mono audio
            let offset = 0;
            this.audioBufferQueue.forEach(buffer => {
                combinedBuffer.getChannelData(0).set(buffer, offset);
                offset += buffer.length;
            });
        
            // Play the combined buffer
            let source = this.audioCtx.createBufferSource();
            source.buffer = combinedBuffer;
            source.connect(this.assistantAudioAnalyzer);
            source.connect(this.audioCtx.destination);
            source.start();

            // Dispatch event after setting up the source
            if (!this.assistantSpectrumInterval) {
                this.assistantDidStartPlayingAudioBuffer(); // start dispatching assistantAudioSignalEvent
            }
        
            // When audio finishes playing, check for more audio in the queue
            source.onended = () => {
                console.log("Audio playback ended");
                this.isAudioPlaying = false;
                if (this.playbackQueue.length > 0) {
                    console.log("Continuing with next audio in playbackQueue");
                    this.audioBufferQueue = this.playbackQueue.shift();
                    this.playBufferedAudio();
                } else {
                    this.finishDispatchingAssistantAudioSignalEvent();
                    this.dispatchAssistantEndAudioSignalEvent();
                    console.log("No more audio in playbackQueue");
                }

            };
        
            // Clear the buffer queue
            this.audioBufferQueue = [];
        }

        decodeAndBufferAudioChunk(opusData) {
            //console.log('Decoding audio chunk of size:', opusData.length);
            try {
                let decodedData = this.decoder.decodeFrame(opusData);
                if (decodedData.errors && decodedData.errors.length > 0) {
                    console.error("Decoding errors:", decodedData.errors);
                    return;
                }
                console.log('Decoded audio chunk, samples:', decodedData.samplesDecoded);
                this.audioBufferQueue.push(decodedData.channelData[0]);
            } catch (error) {
                console.error('Error decoding Opus data:', error);
            }
        }

        handleWebSocketMessage(e) {
            //console.log(`Data received from server:`, e.data);
            if (e.data instanceof Blob) {
                e.data.arrayBuffer().then(arrayBuffer => {
                    // Convert ArrayBuffer to Uint8Array
                    let uint8Array = new Uint8Array(arrayBuffer);
                    // Convert Uint8Array to String to check for the message type
                    let messageString = new TextDecoder().decode(uint8Array);
                
                    if (messageString.startsWith('\\USER')) {
                        let userMessage = messageString.substring(5); // Remove '\\USER' (5 characters)
                        console.log('User message received:', userMessage);
                        this.appendToHistory(ns.SenderType.USER, userMessage);
                    } else if (messageString.startsWith('\\SYSTEM')) {
                        let systemMessage = messageString.substring(7); // Remove '\\SYSTEM' (7 characters)
                        console.log('System message received:', systemMessage);
                        if (this.history.length > 0 && this.history[this.history.length - 1].type === ns.SenderType.USER) {
                            // dispatch "responseStartEvent" when it is the beggining
                            this.dispatchAssistantResponseStartEvent(systemMessage);
                        }
                        this.appendToHistory(ns.SenderType.SYSTEM, systemMessage); // Splitting for example, modify as needed
                    } else if (messageString === '\\END' || messageString === '\\NEXT') {
                        console.log(`Marker received: ${messageString}, current audioBufferQueue length: ${this.audioBufferQueue.length}`);
                        if (this.audioBufferQueue.length > 0) {
                            //DEBUG: console.log("Adding current audioBufferQueue to playbackQueue");
                            this.playbackQueue.push([...this.audioBufferQueue]);
                            this.audioBufferQueue = [];
                        }
                        if (!this.isAudioPlaying) {
                            //DEBUG: console.log("Triggering playback from marker");
                            this.playBufferedAudio();
                        }
                        if (messageString === '\\END') {
                            this.dispatchAssistantEndTurnEvent();
                        }
                        // No immediate call to playBufferedAudio()
                    } else if (messageString.startsWith('\\LIMIT_EXCEEDED')) {
                        // Here we log the detailed limit exceeded message
                        const message = messageString.split(':')[1].trim()
                        console.log('[Limit exceeded]:', message);
                        this.appendToHistory(ns.SenderType.ANNOUNCE, message);
                        this.dispatchReachToLimitEvent(message);
                    } else {
                        // Normal data processing
                        this.decodeAndBufferAudioChunk(uint8Array);
                    }
                });
            }
        }

        appendToHistory(type, message) {
            this.history.push({ type, message });

            if (!ns.configs[this.buttonId].messageReceiveEventName) {
                console.error(`[Core] messageReceiveEventName must be defined in ns.configs[${this.buttonId}]`);
            } else {
                const eventName = ns.configs[this.buttonId].messageReceiveEventName;
                const event = new CustomEvent(eventName, {
                    detail: {
                        buttonId: this.buttonId,
                        type: type,
                        message: message
                    }
                });
                this.$buttonLoader.dispatchEvent(event);
                console.log(`[Core] Dispatched '${eventName}' with details: { buttonId: ${this.buttonId}, type: ${type}, message: ${message} }`);
            }

            //this.displayMessages();
        }

        // ↓↓↓ assistant turn event

        dispatchAssistantResponseStartEvent(message) {
            console.log(`[Core] Dispatching assistantResponseStartEvent - buttonId: ${this.buttonId} with message: ${message}`);
            const event = new CustomEvent(ns.configs[this.buttonId].assistantResponseStartEventName, {
                detail: {
                    buttonId: this.buttonId,
                    message: message
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        assistantDidStartPlayingAudioBuffer() {
            console.log(`[Core] assistant started playing audio buffer - buttonId: ${this.buttonId}`);
            this.dispatchAssistantStartPlayingAudioBufferEvent();
            this.startDispatchingAssistantAudioSignalEvent();
        }

        dispatchAssistantStartPlayingAudioBufferEvent() {
            console.log(`[Core] Dispatching assistantStartPlayingAudioBufferEvent - buttonId: ${this.buttonId}`);
            const event = new CustomEvent(ns.configs[this.buttonId].assistantStartPlayingAudioBufferEventName, {
                detail: {
                    buttonId: this.buttonId
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        startDispatchingAssistantAudioSignalEvent() {
            console.log(`[Core] Start Dispatching assistantAudioSignalEvent - buttonId: ${this.buttonId}`);
            this.assistantSpectrumInterval = setInterval(() => {
                const frequencyDataArray = new Uint8Array(this.assistantAudioAnalyzer.frequencyBinCount);
                this.assistantAudioAnalyzer.getByteFrequencyData(frequencyDataArray);
        
                const timeDomainDataArray = new Float32Array(this.assistantAudioAnalyzer.fftSize);
                this.assistantAudioAnalyzer.getFloatTimeDomainData(timeDomainDataArray);
                let decibels = this.calculateDecibels(timeDomainDataArray);
        
                const hasSignificantData = frequencyDataArray.some(value => value > 0);
                if (hasSignificantData) {
                    const event = new CustomEvent(ns.configs[this.buttonId].assistantAudioSignalEventName, {
                        detail: {
                            buttonId: this.buttonId,
                            spectrum: frequencyDataArray,
                            volume: decibels
                        }
                    });
                    this.$buttonLoader.dispatchEvent(event);
                    //console.log(`Dispatched assistantAudioSignalEvent with spectrum and volume - buttonId: ${this.buttonId}, volume: ${decibels.toFixed(2)} dB`);
                }
            }, ns.configs[this.buttonId].spectrumFrequencyMs);
        }

        finishDispatchingAssistantAudioSignalEvent() {
            console.log(`[Core] Finishing Dispatching assistantAudioSignalEvent for buttonId: ${this.buttonId}`);
            clearInterval(this.assistantSpectrumInterval);  // Ensure to clear the interval when no more audio is to play
            this.assistantSpectrumInterval = null;
        }

        dispatchAssistantEndAudioSignalEvent() {
            console.log(`[Core] Dispatching assistantEndAudioSignalEvent - buttonId: ${this.buttonId}`);
            const event = new CustomEvent(ns.configs[this.buttonId].assistantEndAudioSignalEventName, {
                detail: {
                    buttonId: this.buttonId
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        dispatchAssistantEndTurnEvent() {
            console.log(`[Core] Dispatching assistantEndTurnEvent - buttonId: ${this.buttonId}`);
            const event = new CustomEvent(ns.configs[this.buttonId].assistantEndTurnEventName, {
                detail: {
                    buttonId: this.buttonId
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        // ↑↑↑ assistant turn event

        // ↓↓↓ human turn event

        startDispatchingHumanAudioSignalEvent() {
            console.log(`[Core] Start Dispatching humanAudioSignalEvent - buttonId: ${this.buttonId}`);
            if (!this.humanAudioAnalyzer) {
                console.error("Analyser is not initialized.");
                return;
            }
        
            // Setup a repeating interval to dispatch the frequency data
            this.humanAudioSignalInterval = setInterval(() => {
                const frequencyDataArray = new Uint8Array(this.humanAudioAnalyzer.frequencyBinCount);
                this.humanAudioAnalyzer.getByteFrequencyData(frequencyDataArray);
        
                const timeDomainDataArray = new Float32Array(this.humanAudioAnalyzer.fftSize);
                this.humanAudioAnalyzer.getFloatTimeDomainData(timeDomainDataArray); // Get time-domain data
                let decibels = this.calculateDecibels(timeDomainDataArray);

                // Estimate the fundamental frequency using autocorrelation
                // const sampleRate = this.audioCtx.sampleRate;
                // const fundamentalFreq = this.fundamentalFrequencyByACF(timeDomainDataArray, sampleRate);

                // Estimate the fundamental frequency
                const sampleRate = this.audioCtx.sampleRate;
                const fftSize = this.humanAudioAnalyzer.fftSize;
                const fundamentalFreq = this.estimateFundamentalFrequency(frequencyDataArray, sampleRate, fftSize);

                const hasSignificantData = frequencyDataArray.some(value => value > 0);
                if (hasSignificantData) {
                    const event = new CustomEvent(ns.configs[this.buttonId].humanAudioSignalEventName, {
                        detail: {
                            buttonId: this.buttonId,
                            spectrum: frequencyDataArray,
                            volume: decibels,
                            fundamentalFreq: fundamentalFreq
                        }
                    });
                    this.$buttonLoader.dispatchEvent(event);
                    //console.log(`[Core] Dispatched humanAudioSignalEvent with spectrum and volume - buttonId: ${this.buttonId}, volume: ${decibels.toFixed(2)} dB`);
                }

            }, ns.configs[this.buttonId].spectrumFrequencyMs);
        }

        finishDispatchingHumanAudioSignalEvent() {
            console.log(`[Core] Finishing Dispatching humanAudioSignalEvent for buttonId: ${this.buttonId}`);
            clearInterval(this.humanAudioSignalInterval);  // Ensure to clear the interval when no more audio is to play
            this.humanAudioSignalInterval = null;
        }

        // ↑↑↑ human turn event

        calculateDecibels(timeDomainDataArray) {
            let sumSquares = 0;
            for (let i = 0; i < timeDomainDataArray.length; i++) {
                sumSquares += timeDomainDataArray[i] * timeDomainDataArray[i];
            }
            let rms = Math.sqrt(sumSquares / timeDomainDataArray.length);
            let decibels = rms > 0 ? 20 * Math.log10(rms) : -100;
            return decibels;
        }

        fundamentalFrequencyByACF(timeDomainDataArray, sampleRate) {
            const size = timeDomainDataArray.length;
            const autocorr = new Float32Array(size);
        
            // Calculate autocorrelation
            for (let lag = 0; lag < size; lag++) {
                let sum = 0;
                for (let i = 0; i < size - lag; i++) {
                    sum += timeDomainDataArray[i] * timeDomainDataArray[i + lag];
                }
                autocorr[lag] = sum;
            }
        
            // Find the lag with the highest autocorrelation (after lag 0)
            let peakIndex = -1;
            let maxValue = -Infinity;
            for (let i = 1; i < size; i++) {
                if (autocorr[i] > maxValue) {
                    maxValue = autocorr[i];
                    peakIndex = i;
                }
            }
        
            // Calculate the fundamental frequency
            const fundamentalFreq = sampleRate / peakIndex;
            return fundamentalFreq;
        }

        estimateFundamentalFrequency(frequencyDataArray, sampleRate, fftSize) {
            // Find the index of the peak in the frequency data
            let maxIndex = -1;
            let maxValue = -Infinity;
            for (let i = 0; i < frequencyDataArray.length; i++) {
                if (frequencyDataArray[i] > maxValue) {
                    maxValue = frequencyDataArray[i];
                    maxIndex = i;
                }
            }
        
            // Calculate the frequency corresponding to the peak index
            const nyquist = sampleRate / 2;
            const frequencyBinWidth = nyquist / (frequencyDataArray.length);
            const fundamentalFreq = maxIndex * frequencyBinWidth;
        
            return fundamentalFreq;
        }

        dispatchReachToLimitEvent(message) {
            console.log(`[Core] Dispatching ReachToLimitEvent - buttonId: ${this.buttonId} with message: ${message}`);
            const event = new CustomEvent(ns.configs[this.buttonId].reachToLimitEventName, {
                detail: {
                    buttonId: this.buttonId,
                    message: message
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }

        dispatchFailedToGetTokenEvent(error, status) {
            const event = new CustomEvent(ns.configs[this.buttonId].failedToGetTokenEventName, {
                detail: {
                    buttonId: this.buttonId,
                    error: error,
                    status: status
                }
            });
            this.$buttonLoader.dispatchEvent(event);
        }
    
        displayMessages() {
            const dialogueElement = document.getElementById(ns.configs[this.buttonId].balloonDialogueId);
        
            if (history.length === 0) return; // No messages to display
        
            // Retrieve the last message
            const newMessage = this.history[history.length - 1];
        
            // Get the last <li> element, if any
            const lastListItem = dialogueElement.lastElementChild;
        
            // Check if the last <li> is from the same sender
            if (lastListItem && lastListItem.className === newMessage.sender) {
                // Add a new <span> to the last <li>
                const messageSpan = document.createElement('span');
                messageSpan.className = 'message';
                messageSpan.textContent = newMessage.message;
                lastListItem.appendChild(messageSpan);
            } else {
                // Create a new <li> for a new sender
                const newListItem = document.createElement('li');
                newListItem.className = newMessage.sender;
                const messageSpan = document.createElement('span');
                messageSpan.className = 'message';
                messageSpan.textContent = newMessage.message;
                newListItem.appendChild(messageSpan);
                dialogueElement.appendChild(newListItem);
            }
        }

        setLanguage(lang) {
            this.lang = lang;
        }

        disconnect() {
            // Close WebSocket connection if it's open
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.close();
                console.log("WebSocket connection closed.");
            }
        
            // Reset the WebSocket instance
            this.socket = null;
        
            // Reset the token
            this.token = null;
        
            // Reset the connection status
            this.isConnected = false;
        
            // Clean up the decoder
            if (this.decoder) {
                // Assuming there's a method to clean up or reset the decoder
                this.decoder = null;
            }
        
            // Reset audio context, media recorder, and audio-related variables
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                this.audioCtx.close().then(() => {
                    console.log("AudioContext closed.");
                });
            }
            this.audioCtx = null;
        
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                // Ensure the media recorder is stopped
                this.mediaRecorder.stop();
            }
            this.mediaRecorder = null;
            this.audioChunks = [];
            this.isRecording = false;
        
            // Reset audio playback and queue
            this.audioBufferQueue = [];
            this.isAudioPlaying = false;
            this.playbackQueue = [];
        
            // Clear history
            this.history = [];
        
            console.log("Disconnected and resources reset.");
        }
    }
})(Quantz); 