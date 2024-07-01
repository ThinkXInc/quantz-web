console.log('motion file');

var Demo = Sketch.create({
						autoclear: false, 
						container:document.getElementById('container')
				}), i = 0;
function Particle(options){
  this.radius = options.radius;
  this.x = options.x;
  this.y = options.y;
  this.angle = 0;
  this.rotateSpeed = options.rotateSpeed;
  this.orbit = options.orbit;
  this.speed = options.speed;
}

Particle.prototype.update = function() {
  this.x += Math.sin(this.angle * this.rotateSpeed) * this.orbit;
  this.y += Math.cos(this.angle * this.rotateSpeed) * this.orbit;
  this.x += ((Demo.middlepoint.x) - this.x) * 0.05;
  this.y += ((Demo.middlepoint.y) - this.y) * 0.05;
  this.angle += 0.02;
};

Particle.prototype.draw = function() {
  Demo.beginPath();
  Demo.arc(this.x, this.y, this.radius, TWO_PI, false);
  Demo.fill();
};

Particle.prototype.setOrbit = function(newOrbit) {
  this.orbit = newOrbit;
}

Demo.setup = function() {
  this.particles = [];
  this.particlesIndex = 0;
  this.particlesMax = 50;
  this.color = '#7C00FF';
  this.colors = [];
  for(var i=0; i<20; i++){
  	this.colors[i] = randomColorCode();
  }

  this.middlepoint = middlePointOfCanvas();

  for (var i = 0; i < 20; i++) {
    this.particles[(this.particlesIndex++)%this.particlesMax] = new Particle({
      x: random(0,this.width),
      y: random(0,this.height),
      rotateSpeed: random(2,6),
      orbit: random(2, 20),
      radius: random(2,10)
    });
  };
};

Demo.draw = function() {
  this.fillStyle = 'RGBA(256,256,256,0.1)';
  this.fillRect(0,0,this.width, this.height);

  for (i = this.particles.length - 1; i >= 0; i--) {
    this.fillStyle = this.colors[i];
    this.particles[i].draw();
  };
};

Demo.update = function() {
  this.middlepoint = middlePointOfCanvas();
  for (i = this.particles.length - 1; i >= 0; i--) {
    this.particles[i].update();
  };
};

Demo.changeOrbits = function(maxRange){
  console.log('change max orbit->'+maxRange);
  for (var i = 0; i < 20; i++) {
    this.particles[i].setOrbit(random(2, maxRange));
  }
}

Demo.setRandomColor = function() {
  for(var i=0; i<20; i++){
  	this.colors[i] = randomColorCode();
  }
}

Demo.setColor = function(colorcode) {
  for(var i=0; i<20; i++){
  	this.colors[i] = colorcode;
  }
}

function middlePointOfCanvas(){
  var canvas = document.getElementsByClassName('sketch')[0];
  return {
	x: canvas.width / 2,
	y: canvas.height / 2
  }
}

function distance(ax, ay, bx, by) {
  return Math.sqrt(Math.pow( ax - bx, 2) + Math.pow( ay - by, 2));
}

function randomColorCode(){
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
