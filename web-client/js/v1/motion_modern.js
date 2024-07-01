console.log('motion file');

const Demo = Sketch.create({
  autoclear: false,
  container: document.getElementById('container')
});

class Particle {
  constructor(options) {
    this.radius = options.radius;
    this.x = options.x;
    this.y = options.y;
    this.angle = 0;
    this.rotateSpeed = options.rotateSpeed;
    this.orbit = options.orbit;
    this.speed = options.speed;
  }

  update() {
    this.x += Math.sin(this.angle * this.rotateSpeed) * this.orbit;
    this.y += Math.cos(this.angle * this.rotateSpeed) * this.orbit;
    this.x += (Demo.middlepoint.x - this.x) * 0.05;
    this.y += (Demo.middlepoint.y - this.y) * 0.05;
    this.angle += 0.02;
  }

  draw() {
    Demo.beginPath();
    Demo.arc(this.x, this.y, this.radius, Math.PI * 2, false);
    Demo.fill();
  }

  setOrbit(newOrbit) {
    this.orbit = newOrbit;
  }
}

Demo.setup = function() {
  this.particles = new Array(20);
  this.color = '#7C00FF';
  this.colors = new Array(20).fill().map(() => randomColorCode());
  this.middlepoint = middlePointOfCanvas();

  this.particles.forEach((_, index) => {
    this.particles[index] = new Particle({
      x: random(0, this.width),
      y: random(0, this.height),
      rotateSpeed: random(2, 6),
      orbit: random(2, 20),
      radius: random(2, 10)
    });
  });
};

Demo.draw = function() {
  this.fillStyle = 'RGBA(256,256,256,0.1)';
  this.fillRect(0, 0, this.width, this.height);

  this.particles.forEach((particle, index) => {
    this.fillStyle = this.colors[index];
    particle.draw();
  });
};

Demo.update = function() {
  this.middlepoint = middlePointOfCanvas();
  this.particles.forEach(particle => particle.update());
};

Demo.changeOrbits = function(maxRange) {
  console.log('change max orbit->' + maxRange);
  this.particles.forEach(particle => particle.setOrbit(random(2, maxRange)));
}

Demo.setRandomColor = function() {
  this.colors = this.colors.map(() => randomColorCode());
}

Demo.setColor = function(colorcode) {
  this.colors.fill(colorcode);
}

function middlePointOfCanvas() {
  const canvas = document.querySelector('.sketch');
  return { x: canvas.width / 2, y: canvas.height / 2 };
}

function randomColorCode() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}
