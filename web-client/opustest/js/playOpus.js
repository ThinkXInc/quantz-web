let decoder;
let audioBufferQueue = [];
let playbackQueue = [];
let isAudioPlaying = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

window.onload = async function() {
    try {
        // Initialize OpusDecoder
        decoder = new window["opus-decoder"].OpusDecoder({ sampleRate: 24000, channels: 1 });
        await decoder.ready;
        console.log("Decoder is ready.");

    } catch (e) {
        console.error("Error initializing OpusDecoder:", e);
    }
};

function loadAndDecodeOpusFile(fileUrl, fileUrls, fileIndex) {
    fetch(fileUrl)
        .then(response => response.arrayBuffer())
        .then(buffer => {
            decodeAndBufferAudioChunk(new Uint8Array(buffer));
            if (fileIndex + 1 < fileUrls.length) {
                loadAndDecodeOpusFile(fileUrls[fileIndex + 1], fileUrls, fileIndex + 1);
            } else {
                console.log("All files loaded and decoded");
                playBufferedAudio()
            }
        })
        .catch(error => console.error("Error loading Opus file:", error));
}

function decodeAndBufferAudioChunk(opusData) {
    try {
        let decodedData = decoder.decodeFrame(opusData);
        if (decodedData.errors && decodedData.errors.length > 0) {
            console.error("Decoding errors:", decodedData.errors);
            return;
        }
        audioBufferQueue.push(decodedData.channelData[0]);
    } catch (error) {
        console.error('Error decoding Opus data:', error);
    }
}

function play () {
    // Load and decode files sequentially
    let fileUrls = generateFileUrls();
    loadAndDecodeOpusFile(fileUrls[0], fileUrls, 0);
}

function playBufferedAudio() {
    // Set flag to indicate audio is playing
    isAudioPlaying = true;
    
    // Combine all buffered audio into a single buffer
    let totalLength = audioBufferQueue.reduce((acc, buffer) => acc + buffer.length, 0);
    console.log('Total Length ', totalLength);
    console.log('Buffer Queue ', audioBufferQueue.length)
    let combinedBuffer = audioContext.createBuffer(1, totalLength, 24000); // Assuming mono audio
    let offset = 0;
    audioBufferQueue.forEach(buffer => {
        combinedBuffer.getChannelData(0).set(buffer, offset);
        console.log('buffer length ', buffer.length)
        offset += buffer.length;
    });
    
    // Play the combined buffer
    let source = audioContext.createBufferSource();
    source.buffer = combinedBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    // When audio finishes playing, check for more audio in the queue
    source.onended = () => {
        isAudioPlaying = false;
        playBufferedAudio();
        //if (playbackQueue.length > 0) {
        //    audioBufferQueue = playbackQueue.shift();
        //    playBufferedAudio();
        //}
    };
    
    // Clear the buffer queue
    audioBufferQueue = [];
}


function generateFileUrls() {
    // Placeholder for generating file URLs
    let startIndex = 1;
    let endIndex = 57;
    let fileUrls = [];
    for (let i = startIndex; i <= endIndex; i++) {
        fileUrls.push(`./opuscheck/chunk_${i}.opus`);
    }
    return fileUrls;
}
