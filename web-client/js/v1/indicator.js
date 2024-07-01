console.log('indicator file');

const canvasId = "canvas";

const Config = {
    R: 74,  // Radius of the circle
    H: 80,//H: 8,  // Length of the region
    M: 30,   // Number of regions
    F: 1.6,//F: 10,   // Fluctuation range
    N: 100,  // Number of particles per region
    k: 0.5, // Energy to back
    particleRadiusMean: 0.5,//r: 0.35, // Median of particle radius
    particleRadiusDeviation: 0.5,//d: 0.05, // Deviation of particle radius (radius = random(r-d, r+d))

    particleMoveInterval: 5,
    particleMoveDeviation: 0.1,

    particleOpacityInterval: 10,
    particleOpacityDeviation: 0.3,

    threshold: 0.05
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
const regionColors = ['#1ba9b0']; // Example colors

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
                startOpacity: random(0, 1.0),
                color: regionColors[m % regionColors.length]
            }));
        }
    }
};


Indicator.draw = function() {
    //console.log('draw indicator')
    // Set the background to black
    //this.fillStyle = 'white';
    this.fillStyle = 'black';
    this.fillRect(0, 0, this.width, this.height);

    // Draw a white circle at the middle point
    this.fillStyle = 'white';  // Set fill color for the circle
    this.beginPath();  // Start a new path for the circle
    this.arc(this.middlepoint.x, this.middlepoint.y, 4, 0, Math.PI * 2, false); // Draw the circle
    this.fill();  // Fill the circle with white color

    // Draw a dark gray circle at the middle point with radius R + H
    this.fillStyle = '#000';//'#EEE';//'#222'; // Dark gray color
    this.beginPath();
    const paddingCircleEdge = 10;
    this.arc(this.middlepoint.x, this.middlepoint.y, Config.R + Config.H + paddingCircleEdge, 0, Math.PI * 2, false);
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
  
    startOpacitySequence(batch = 16, minOpacity = 0, maxOpacity = 1.0) {
        console.log(`Starting opacity sequence with batch: ${batch}, minOpacity: ${minOpacity}, maxOpacity: ${maxOpacity}`);

        // Clear the set of already set indices
        this.alreadySetIndices.clear();

        // Initialize opacity targets and speeds
        this.indicator.particles.forEach((particle, index) => {
            this.indicator.targetMap.opacityTargets[index] = particle.opacity;
            this.indicator.targetMap.opacitySpeeds[index] = 1;  // Fixed speed for simplicity
        });

        this.currentRegion = Config.M - 1;

        this.intervalTimer = setInterval(() => {
            if (this.isStopping || this.currentRegion < 0) {
                console.log('Stopping or completed opacity sequence.');
                clearInterval(this.intervalTimer);
                if (this.isStopping) {
                    this.stopSequence();
                } else {
                    console.log('Opacity sequence completed for all regions.');
                }
                return;
            }

            let startRange = this.currentRegion * Config.N;
            let endRange = (this.currentRegion + 1) * Config.N - 1;

            // Identify indices in the current region that haven't been set yet
            let unsetIndices = [];
            for (let i = startRange; i <= endRange; i++) {
                if (!this.alreadySetIndices.has(i)) {
                    unsetIndices.push(i);
                }
            }

            // Update the target for a batch of particles
            if (unsetIndices.length > 0) {
                console.log(`Updating opacity targets for particles in region ${this.currentRegion}`);
                for (let i = 0; i < Math.min(batch, unsetIndices.length); i++) {
                    let randomIndex = unsetIndices.splice(Math.floor(random(0, unsetIndices.length)), 1)[0];
                    this.indicator.targetMap.opacityTargets[randomIndex] = random(minOpacity, maxOpacity);
                    this.indicator.targetMap.opacitySpeeds[randomIndex] = 1;
                    this.alreadySetIndices.add(randomIndex);
                    console.log(`Particle ${randomIndex} opacity target set to ${this.indicator.targetMap.opacityTargets[randomIndex]}`);
                }
            } else {
                console.log(`Completed region: ${this.currentRegion}`);
                this.currentRegion--;
            }
        }, 0.1);
    }

      
    setAllOpacityToZero(speed = 0.1) {
        // Ensure all opacity targets are set to 0 with the specified speed
        this.indicator.targetMap.opacityTargets.fill(0);
        this.indicator.targetMap.opacitySpeeds.fill(speed);  // Use the provided speed for the transition
        console.log(`All opacities are set to zero with speed ${speed}.`);
    }
  
    stopSequence() {
        clearInterval(this.intervalTimer);
        this.indicator.targetMap.opacityTargets.fill(null); // Clear all opacity targets
        this.isStopping = false;
        this.alreadySetIndices.clear();
    }
  
    sendStopCommand() {
      this.isStopping = true; // Flag to stop the sequence
    }
  }
  
const controller = new IndicatorController(Indicator);
const startButton = document.getElementById('start');

startButton.addEventListener('mouseenter', () => {
    console.log('Start button mouseenter');
    controller.setAllOpacityToZero(0.1); // Set speed as an argument without the parameter name
    //controller.startOpacitySequence(batch=16, minOpacity=0, maxOpacity=0)
});

startButton.addEventListener('mouseleave', () => {
    console.log('Start button mouseleave');
    controller.stopSequence();
})

startButton.addEventListener('mousedown', () => {
  console.log('Start button pressed - starting opacity sequence');
  //controller.setAllOpacityToZero();
  //controller.startOpacitySequence();
  controller.setAllOpacityToZero(1); // Set speed as an argument without the parameter name
  controller.startOpacitySequence(batch=64, minOpacity=1, maxOpacity=1.0, clockwise=true);
});

startButton.addEventListener('mouseup', () => {
  console.log('Start button released - stopping opacity sequence');
  controller.stopSequence();
  controller.setAllOpacityToZero(1); // Set speed as an argument without the parameter name
  //controller.sendStopCommand();
  //controller.startOpacitySequence(batch=16, minOpacity=0, maxOpacity=0, clockwise=false);
});

// Handling touch events for touch devices
startButton.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevents additional mouse events being fired on touch devices
  console.log('Start button touched - starting opacity sequence');
  controller.startOpacitySequence();
});

startButton.addEventListener('touchend', () => {
  console.log('Start button touch ended - stopping opacity sequence');
  //controller.sendStopCommand();
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

