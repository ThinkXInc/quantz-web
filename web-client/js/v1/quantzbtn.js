const IconType = {
    STANDBY: './images/standby-icon.svg',
    PUSHSPEAK: './images/push-speak-icon.svg',
    RECORDING: './images/recording-icon.svg',
    REPLYING: './images/replying-icon.svg',
};

const ButtonState = {
    standby: 'standby',
    waiting: 'waiting',
    listening: 'listening',
    loading: 'loading',
    replying: 'replying'
}

console.log('indicator file');

const canvasId = "canvas";

const Config = {
    R: 72,  // Radius of the circle
    H: 1,//H: 8,  // Length of the region
    M: 50,   // Number of regions
    F: 10.01,//F: 10,   // Fluctuation range
    N: 80,  // Number of particles per region
    k: 0.5, // Energy to back
    particleRadiusMean: 0.35,//r: 0.35, // Median of particle radius
    particleRadiusDeviation: 0.05,//d: 0.05, // Deviation of particle radius (radius = random(r-d, r+d))

    particleMoveInterval: 30,
    particleMoveDeviation: 0.4,

    particleMinOpacity: 1.0,
    particleMaxOpacity: 1.0,
    particleOpacityInterval: 5,
    particleOpacityDeviation: 0.5,

    particleStartOpacity: 0,

    threshold: 0.05,
    trigerBatch: 32,

    displayFillColor: '#fff',//'#eee',//'#808080',//'#333',//'#fff',//'#111',//'#fff',
    displayEdgePadding: 0,
    displayBorderWidth: 2, // The border thickness
    displayBorderTopColor: '#fff',//'#dadada',//'#dadada',//'#333', // Color for the top half
    displayBorderBottomColor: '#fff',//'#ddd',//'#000', // Color for the bottom half
    displayShadowAlpha: 0,
    displayShadowBlur: 12,
    displayShadowOffset: 7,
 
    particleColor: '#999999',//'#0affd2',//'#00ffec',//'#999999',//'#00ffec',//'#1ba90b',//'#0affd2',//'#1ba90b',
};


function random(min, max) {
    return Math.random() * (max - min) + min;
}

function middlePointOfCanvas() {
    const canvas = document.querySelector('.sketch');
    return {
        x: canvas.width / 2,
        y: canvas.height / 2
    };
}

function randomColorCode() {
    return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

function hexToRgba(hex, opacity) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const Indicator = Sketch.create({
    autoclear: false,
    container: document.getElementById(canvasId)
});

Indicator.targetMap = {
    positionTargets: new Array(Config.M * Config.N),
    positionSpeeds: new Array(Config.M * Config.N),
    opacityTargets: new Array(Config.M * Config.N),
    opacitySpeeds: new Array(Config.M * Config.N),
};

Indicator.setNewPositionTargetsForRegion = function(regionIndex, newX, newY, speed) {
    for (let i = 0; i < Config.N; i++) {
        let particleIndex = regionIndex * Config.N + i;
        this.targetMap.positionTargets[particleIndex] = { x: newX, y: newY };
        this.targetMap.positionSpeeds[particleIndex] = speed;
    }
};

Indicator.clearPositionTargetsForRegion = function(regionIndex) {
    for (let i = 0; i < Config.N; i++) {
        let particleIndex = regionIndex * Config.N + i;
        this.targetMap.positionTargets[particleIndex] = null;
    }
};

class Particle {
    constructor(options) {
        this.index = options.index;
        this.options = options;
        this.radius = options.radius;
        this.x = options.x;
        this.y = options.y;
        this.visible = true;
        this.region = options.region;
        this.color = options.color || randomColorCode(); // Assign a color or use a random one
        this.opacity = options.startOpacity; // Start fully opaque
        this.moveInterval = options.moveInterval;
        this.pauseMoveCounter = options.moveInterval;
        this.opacityInterval = options.opacityInterval;
        this.pauseOpacityCounter = options.opacityInterval;
    }

    update() {
        if (!this.visible) return;
    
        // Position update towards target if set
        const positionTarget = Indicator.targetMap.positionTargets[this.index];
        if (this.pauseMoveCounter <= 0) {
            if (positionTarget != null) {
                let speed = Indicator.targetMap.positionSpeeds[this.index];
                if (Math.abs(this.x - positionTarget.x) > Config.threshold) {
                    console.log(` to target (x): now ${this.x} -> target ${positionTarget.x}`);
                    if (this.x < positionTarget.x) {
                        this.x += speed;
                        if (this.x > positionTarget.x) this.x = positionTarget.x;
                    }
                    if (this.x < positionTarget.x) {
                        this.x -= speed;
                        if (this.x < positionTarget.x) this.x = positionTarget.x;
                    }
                    console.log(`x updated ${this.x}`)
                }
                if (Math.abs(this.y - positionTarget.y) > Config.threshold) {
                    console.log(` to target (y): now ${this.y} -> target ${positionTarget.y}`);
                    if (this.y < positionTarget.y) {
                        this.y += speed;
                        if (this.y > positionTarget.y) this.y = positionTarget.y;
                    }
                    if (this.y < positionTarget.y) {
                        this.y -= speed;
                        if (this.y < positionTarget.y) this.y = positionTarget.y;
                    }
                    console.log(`y updated ${this.y}`)
                }
            } else {
                // Default random movement
                //console.log('random');
                this.x += random(-Config.particleMoveDeviation, Config.particleMoveDeviation);
                this.y += random(-Config.particleMoveDeviation, Config.particleMoveDeviation);
            }
            this.pauseMoveCounter = this.moveInterval; // Reset the counter after updating
        } else {
            this.pauseMoveCounter--;
        }
  
        // Opacity update towards target if set
        const opacityTarget = Indicator.targetMap.opacityTargets[this.index];
        if (this.pauseOpacityCounter <= 0) {
            if (opacityTarget != null) {
                let speed = Indicator.targetMap.opacitySpeeds[this.index];
                //console.log(`to target (opacity): now ${this.opacity} -> target ${opacityTarget} speed ${Indicator.targetMap.opacitySpeeds[this.index]}`);
                if (Math.abs(this.opacity - opacityTarget) > Config.threshold) {
                    //console.log(`*** needs update`)
                    if (this.opacity < opacityTarget) {
                        this.opacity += speed;
                        if (this.opacity > opacityTarget) this.opacity = opacityTarget;
                    }
                    if (this.opacity > opacityTarget) {
                        this.opacity -= speed;
                        if (this.opacity < opacityTarget) this.opacity = opacityTarget;
                    }
                }
                //console.log(`opacity updated: ${this.opacity}`);
                this.pauseOpacityCounter = this.opacityInterval;
            } else {
                // Default opacity change
                const deviation = Config.particleOpacityDeviation;
                this.opacity += random(-deviation, deviation);
                this.opacity = Math.max(0, Math.min(this.opacity, 1));
                this.pauseOpacityCounter = this.opacityInterval; // Reset the counter after updating
            }
        } else {
            this.pauseOpacityCounter--;
        }
    }
  
    draw() {
        if (!this.visible) return;
  
        //console.log(`${this.x} ${this.y}`)
        Indicator.fillStyle = hexToRgba(this.color, this.opacity);
        Indicator.beginPath();
        Indicator.arc(this.x, this.y, this.radius, Math.PI * 2, false);
        Indicator.fill();
    }

    setVisible(visibility) {
        this.visible = visibility;
    }
}

class Coordinate {
    constructor(radius, regionLength, numOfRegions) {
        this.radius = radius;
        this.regionLength = regionLength;
        this.numOfRegions = numOfRegions;
    }
  
    // Calculate a random point within the region
    static getRandomPointInRegion(regionIndex, radius, regionLength, numOfRegions, fluctuationRange) {
        const angle = ((2 * Math.PI / numOfRegions) * regionIndex) - Math.PI;

        //console.log(angle)
        const middlePoint = this.middlepoint = middlePointOfCanvas();
        
        // Random position before placing on the circumference
        let xiPrime = random(radius, radius + regionLength);
        let fluctuation = random(-fluctuationRange, fluctuationRange);
        //console.log(`xiPrime: ${xiPrime} yiPrime: ${yiPrime}`)
        
        // Rotating the point to align with the region's angle
        let xi = (xiPrime * Math.sin(angle)) + (fluctuation*Math.sin(angle + Math.PI/2));
        let yi = (xiPrime * Math.cos(angle)) + (fluctuation*Math.cos(angle + Math.PI/2));
        xi = xi + middlePoint.x;
        yi = yi + middlePoint.y;
        //let yi = (xiPrime * Math.cos(angle)) + fluctuation;
        //let xi = xiPrime;//
        //let yi = yiPrime;//
 
        //console.log(Math.sin(angle))
        //console.log(`${xi} ${yi}`)

        return { x: xi, y: yi };
    }
}

//const regionColors = ['#FF5733', '#33FF57', '#3357FF', '#57FF33', '#FF3357']; // Example colors

Indicator.setup = function() {
    console.log('setup indicator')
    this.particles = [];
    this.middlepoint = middlePointOfCanvas();
    console.log(`middle point (${this.middlepoint.x}, ${this.middlepoint.y})`)

    let index = 0;
    for (let m = 0; m < Config.M; m++) {
        for (let i = 0; i < Config.N; i++) {
            let point = Coordinate.getRandomPointInRegion(m, Config.R, Config.H, Config.M, Config.F);
            this.particles.push(new Particle({
                index: index++,
                x: point.x,
                y: point.y,
                radius: random(
                    Config.particleRadiusMean - Config.particleRadiusDeviation,
                    Config.particleRadiusMean + Config.particleRadiusDeviation),  // Example radius
                region: m,
                moveInterval: Config.particleMoveInterval,
                opacityInterval: Config.particleOpacityInterval,
                startOpacity: Config.particleStartOpacity,//random(Config.particleMinOpacity, Config.particleMaxOpacity),
                color: Config.particleColor,//regionColors[m % regionColors.length]
            }));
        }
    }
};

Indicator.draw = function() {
    //console.log('draw indicator')
    // Set the background to black
    this.fillStyle = 'white';
    //this.fillStyle = 'black';
    this.fillRect(0, 0, this.width, this.height);

    // Draw a white circle at the middle point
    this.fillStyle = 'white';  // Set fill color for the circle
    this.beginPath();  // Start a new path for the circle
    this.arc(this.middlepoint.x, this.middlepoint.y, 4, 0, Math.PI * 2, false); // Draw the circle
    this.fill();  // Fill the circle with white color

    // Draw a dark gray circle at the middle point with radius R + H
    //this.fillStyle = '#000';//'#EEE';//'#222'; // Dark gray color

    const borderSize = Config.displayBorderWidth; // The border thickness
    const topColor = Config.displayBorderTopColor; //'#333'; // Color for the top half
    const bottomColor = Config.displayBorderBottomColor; //'#000'; // Color for the bottom half

    // Set shadow properties once
    this.shadowColor = `rgba(0, 0, 0, ${Config.displayShadowAlpha})`;
    this.shadowBlur = Config.displayShadowBlur;//12;
    this.shadowOffsetX = Config.displayShadowOffset;//7;
    this.shadowOffsetY = 7;
    
    const paddingCircleEdge = Config.displayEdgePadding;
    
    // Bottom half (blue)
    this.fillStyle = bottomColor;
    this.beginPath();
    this.arc(this.middlepoint.x, this.middlepoint.y, Config.R + Config.H + paddingCircleEdge + borderSize, 3 * Math.PI / 4, 7 * Math.PI / 4, false);
    this.closePath();
    this.fill();


    // Top half (red)
    this.fillStyle = topColor;
    this.beginPath();
    this.arc(this.middlepoint.x, this.middlepoint.y, Config.R + Config.H + paddingCircleEdge + borderSize, -Math.PI / 4, 3 * Math.PI / 4, false);
    this.closePath();
    this.fill();

    // Reset shadow properties before drawing the main circle
    this.shadowColor = 'transparent';
    this.shadowBlur = 0;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;

    // Main circle
    this.fillStyle = Config.displayFillColor;
    this.beginPath();
    this.arc(this.middlepoint.x, this.middlepoint.y, Config.R + Config.H + paddingCircleEdge, 0, 2 * Math.PI, false);
    this.fill();

    //this.fillStyle = 'RGBA(256,256,256,1)';
    //this.fillRect(0, 0, this.width, this.height);
    this.particles.forEach(particle => particle.draw());
};

Indicator.update = function() {
    this.middlepoint = middlePointOfCanvas();
    this.particles.forEach(particle => particle.update());
};

class IndicatorController {
    constructor(indicator) {
        this.indicator = indicator;
        this.intervalTimer = null;
        this.isStopping = false;
        this.currentRegion = Config.M - 1; // Temporarily manage the current region in scope
        this.alreadySetIndices = new Set();  // Store indices for which targets have been set
    }

    setOpacityInterval(newOpacityInterval) {
        this.indicator.particles.forEach((particle, index) => {
            particle.opacityInterval = newOpacityInterval;
        });
    }

    startOpacitySequence(batch = 16, minOpacity = 0, maxOpacity = 1.0) {
        console.log(`Starting opacity sequence with batch: ${batch}, minOpacity: ${minOpacity}, maxOpacity: ${maxOpacity}`);
    
        // Clear the set of already set indices
        this.alreadySetIndices.clear();
    
        // Initialize opacity targets and speeds
        this.indicator.particles.forEach((particle, index) => {
            particle.opacityInterval = 1;
            this.indicator.targetMap.opacityTargets[index] = particle.opacity;
            this.indicator.targetMap.opacitySpeeds[index] = 1;  // Fixed speed for simplicity
        });
    
        this.currentRegion = Config.M - 1;
    
        this.intervalTimer = setInterval(() => {
            if (this.isStopping) {
                console.log('Stopping opacity sequence.');
                clearInterval(this.intervalTimer);
                this.stopSequence();
                return;
            }
    
            let updatedCount = 0;
            
            while (updatedCount < batch && this.currentRegion >= 0) {
                let startRange = this.currentRegion * Config.N;
                let endRange = (this.currentRegion + 1) * Config.N - 1;
                let unsetIndices = [];
    
                // Identify unset indices in the current region
                for (let i = startRange; i <= endRange; i++) {
                    if (!this.alreadySetIndices.has(i)) {
                        unsetIndices.push(i);
                    }
                }
    
                let updateCount = Math.min(batch - updatedCount, unsetIndices.length);
                for (let i = 0; i < updateCount; i++) {
                    let randomIndex = unsetIndices.splice(Math.floor(random(0, unsetIndices.length)), 1)[0];
                    this.indicator.targetMap.opacityTargets[randomIndex] = random(minOpacity, maxOpacity);
                    this.indicator.targetMap.opacitySpeeds[randomIndex] = 1;
                    this.alreadySetIndices.add(randomIndex);
                    console.log(`Particle ${randomIndex} opacity target set to ${this.indicator.targetMap.opacityTargets[randomIndex]}`);
                    updatedCount++;
                }
    
                // Move to the previous region if no more indices to update in the current region
                if (updateCount === 0) {
                    console.log(`Completed region: ${this.currentRegion}`);
                    this.currentRegion--;
                }
            }
    
            if (this.currentRegion < 0) {
                console.log('Opacity sequence completed for all regions.');
                clearInterval(this.intervalTimer);
            }
        }, 1);
    }
      
    setAllOpacityToZero(speed = 0.1) {
        // Ensure all opacity targets are set to 0 with the specified speed
        this.indicator.targetMap.opacityTargets.fill(0);
        this.indicator.targetMap.opacitySpeeds.fill(speed);  // Use the provided speed for the transition
        console.log(`All opacities are set to zero with speed ${speed}.`);
    }

    stopSequence() {
        clearInterval(this.intervalTimer);
        this.setOpacityInterval(Config.particleOpacityInterval);
        this.indicator.targetMap.opacityTargets.fill(null); // Clear all opacity targets
        this.isStopping = false;
        this.alreadySetIndices.clear();
    }

    sendStopCommand() {
      this.isStopping = true; // Flag to stop the sequence
    }
}
  
class ButtonController {
    constructor(animationController, indicatorController) {
        this.animationController = animationController;
        this.indicatorController = indicatorController;
        this.buttonElement = document.querySelector('#start');
        this.iconElement = document.querySelector('.icon');
        this.textElement = document.querySelector("#start .text");

        if (!this.buttonElement) {
            console.error('Button element not found.');
            return;
        }
        if (!this.iconElement) {
            console.error('Icon element not found.');
        }
        if (!this.textElement) {
            console.error('Text element not found.');
        }
    }

    switchIcon(prevIconType, nextIconType, hideAnimationType, showAnimationType, hideDelay, hideDuration, showDelay, showDuration) {
        console.log(`Switching icon from ${prevIconType} to ${nextIconType}`);
    
        if (!this.iconElement) {
          console.error('Icon element not found.');
          return;
        }
    
        // Hide the current icon with the specified animation and delay/duration
        this.animationController.animate(this.iconElement, hideAnimationType, hideDelay, hideDuration, null, () => {
            // Show the next icon with the specified animation and delay/duration
            this.toggleIconVisibility(false);
            this.animationController.animate(this.iconElement, showAnimationType, showDelay, showDuration, () => {
                this.animationController.animate(this.iconElement, showAnimationType, showDelay, showDuration, () => {
                    // pre animation
                    this.toggleIconVisibility(true)
                    this.setIcon(nextIconType);
                }, () => {
                    console.log(`Switched to: ${nextIconType}`);
                });
            });
        });
    }

    setIcon(iconType) {
        console.log('Set Icon:', iconType);
        if (iconType) {
            this.iconElement.src = iconType;
        } else {
            console.error('Icon type is undefined:', iconType);
        }
    }

    toggleIconVisibility(isVisible) {
        if (!this.iconElement) {
            console.error('Icon element not found.');
            return;
        }
        this.iconElement.style.visibility = isVisible ? 'visible' : 'hidden';
        console.log(`Icon visibility set to: ${isVisible ? 'visible' : 'hidden'}`);
    }

    toggleButtonState(buttonState) {
        // Remove all possible button state classes first
        Object.values(ButtonState).forEach(state => {
            this.buttonElement.classList.remove(state);
        });

        // Add the new state as a class to the button element
        if (Object.values(ButtonState).includes(buttonState)) {
            this.buttonElement.classList.add(buttonState);
            console.log(`Button state changed to "${buttonState}".`);
        } else {
            console.error(`Invalid button state: "${buttonState}".`);
        }
    }

    switchStandbyToSpeak() {
        this.toggleButtonState(ButtonState.waiting);
        this.switchIcon(IconType.STANDBY, IconType.PUSHSPEAK, AnimationType.flipOut, AnimationType.flipIn, 0, 0.3, 0, 0.3);
        controller.lightDownIndicator();
    }

    switchToRecording() {
        this.toggleButtonState(ButtonState.listening);
        this.setIcon(IconType.RECORDING);
        this.updateButtonText('Listening...');
    }

    switchToPushSpeak() {
        this.toggleButtonState(ButtonState.waiting);
        this.setIcon(IconType.PUSHSPEAK);
        this.updateButtonText('Speak while pushing');
    }

    switchToReplying() {
        this.toggleButtonState(ButtonState.replying);
        this.setIcon(IconType.REPLYING);
        this.updateButtonText('');
    }

    updateButtonText(newText) {
        if (this.textElement) {
            this.textElement.textContent = newText;
        } else {
            console.error("Text element not found.");
        }
    }

    lightDownIndicator() {
        indicatorController.stopSequence();
        indicatorController.setAllOpacityToZero(0.1);
    }

    stopIndicator() {
        indicatorController.stopSequence();
    }

    trigerIndicator() {
        indicatorController.setAllOpacityToZero(1); // Set speed as an argument without the parameter name
        indicatorController.startOpacitySequence(Config.trigerBatch, 1.0, 1.0);
    }
}
  
const animationController = new AnimationController();
const indicatorController = new IndicatorController(Indicator);
const controller = new ButtonController(animationController, indicatorController);
const startButton = document.getElementById('start');

setTimeout(() => {
    setTimeout(()=>{
        controller.updateButtonText('Connected.')
    }, 100)
    //setTimeout(()=>{
    //    controller.updateButtonText('')
    //}, 150)
    //setTimeout(()=>{
    //    controller.updateButtonText('Connected.')
    //}, 200)
    //setTimeout(()=>{
    //    controller.updateButtonText('')
    //}, 250)
    //setTimeout(()=>{
    //    controller.updateButtonText('Connected.')
    //}, 300)

    setTimeout(() => {
        controller.switchStandbyToSpeak();
        controller.updateButtonText('Speak while pushing.')
    }, 1000)
}, 500);
  

startButton.addEventListener('mouseenter', () => {
    console.log('Start button mouseenter');
    controller.lightDownIndicator();
});

startButton.addEventListener('mouseleave', () => {
    console.log('Start button mouseleave');
    controller.stopIndicator();
})

startButton.addEventListener('mousedown', () => {
    console.log('Start button pressed - starting opacity sequence');
    controller.trigerIndicator();
    controller.switchToRecording();
});

startButton.addEventListener('mouseup', () => {
    console.log('Start button released - stopping opacity sequence');
    controller.lightDownIndicator();
    controller.switchToReplying();
    setTimeout(()=>{
        indicatorController.setAllOpacityToZero(1);
        controller.switchStandbyToSpeak();
        controller.updateButtonText('Speak while pushing.')
    }, 4000);
});

// Handling touch events for touch devices
startButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents additional mouse events being fired on touch devices
    console.log('Start button touched - starting opacity sequence');
    indicatorController.startOpacitySequence();
});

startButton.addEventListener('touchend', () => {
    console.log('Start button touch ended - stopping opacity sequence');
    //indicatorController.sendStopCommand();
});
// Indicator.setVisibilityByRegion = function(regionCounts) {
//   this.particles.forEach(particle => {
//     let count = regionCounts[particle.region];
//     particle.setVisible(count > 0);
//     regionCounts[particle.region] = count > 0 ? count - 1 : 0;
//   });
// }
// // Example usage
// Indicator.setVisibilityByRegion({ A: 100, B: 80, C: 0 }); // A:100 visible, B:80 visible, C:0 visible

