class Convex {
    constructor({ id }) {
        this.id = id;
        this.setupView();
        this.hide()

        this.ROTATE_SPEED = 0.002;
        this.MESH_DEFAULT_OPACITY = 0.5;
        this.DEFAULT_SCALE = 0.8;//1.0;//0.5; 

        this.currentScale = 1.0; // Start at default scale
        this.targetScale = 1.0; // Target scale initialized to default
        this.lerpFactor = 0.05;
    }

    setupView() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(15, 20, 30);
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        const ambient = new THREE.AmbientLight(0x666666);
        this.scene.add(ambient);

        //const light = new THREE.PointLight(0xffffff, 3, 0, 0);  // 2D look
        const light = new THREE.PointLight(0xffffff, 3, 0, 0);
        this.camera.add(light);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 20;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.enabled = false;

        this.initGeometry();
    }

    initGeometry() {
        const geometry = new THREE.DodecahedronGeometry(10);
        geometry.deleteAttribute('normal');
        geometry.deleteAttribute('uv');


		const vertices = [];
		const positionAttribute = geometry.getAttribute( 'position' );

		for ( let i = 0; i < positionAttribute.count; i ++ ) {

			const vertex = new THREE.Vector3();
			vertex.fromBufferAttribute( positionAttribute, i );
			vertices.push( vertex );

		}

        //const vertices = new THREE.BufferGeometry().setFromPoints(geometry.vertices);

        const material = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            opacity: 0.3,
            side: THREE.DoubleSide,
            transparent: true
        });
        this.mesh = new THREE.Mesh(new ConvexGeometry(vertices), material);
        this.scene.add(this.mesh);

    }

    mount($parent) {
        if (!$parent) {
            console.error('Parent element not provided for Convex mount.');
            return;
        }
        $parent.appendChild(this.renderer.domElement);
        this.updateRendererSize($parent);
        window.addEventListener('resize', () => this.updateRendererSize($parent));
        this.startAnimating();
    }

    updateRendererSize($parent) {
        const width = $parent.clientWidth;
        const height = $parent.clientHeight;
        console.log("Width:", width, "Height:", height); // This will tell you the dimensions being set
        if (width === 0 || height === 0) {
            console.warn("[Convex] Parent element has zero dimensions.");
        }
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    hide() {
        this.mesh.scale.set(0, 0, 0);
    }

    show() {
        const duration = 300; // Animation duration in milliseconds
        const start = performance.now();
        const targetScale = this.DEFAULT_SCALE; // Scale the mesh up to its original size
        const initialScale = 0;

        const animateScale = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const scale = initialScale + progress * (targetScale - initialScale);
            this.mesh.scale.set(scale, scale, scale);

            if (progress < 1) {
                requestAnimationFrame(animateScale);
            }
        };

        requestAnimationFrame(animateScale);
    }

    startAnimating() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate.bind(this));
        }
    }

    //animate() {
    //    // Update scale smoothly using lerp
    //    if (this.mesh) {
    //        this.currentScale += (this.targetScale - this.currentScale) * this.lerpFactor;
    //        this.mesh.scale.set(this.currentScale, this.currentScale, this.currentScale);
    //    }

    //    this.renderer.render(this.scene, this.camera);
    //    this.frameId = requestAnimationFrame(this.animate.bind(this));
    //}

    animate() {
        this.controls.update();
        this.mesh.rotation.y += this.ROTATE_SPEED;
        this.renderer.render(this.scene, this.camera);
        this.frameId = requestAnimationFrame(this.animate.bind(this));
    }

    stopAnimating() {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
    }

    setTransparency(opacity) {
        if (this.material) {
            this.material.opacity = opacity;
            this.material.transparent = opacity < 1.0;
            this.material.needsUpdate = true; // Make sure Three.js updates the material
        }
    }

    updateScale(value) {
        let newScale = Math.log10(value + 1);
        newScale = Math.max(newScale, 1.0) * this.DEFAULT_SCALE; // Ensure the scale does not drop below 1.0
        this.currentScale = this.currentScale * 0.9 + newScale * 0.1; // 90% old scale, 10% new scale
        //console.log(`Update convex by scale: ${this.currentScale} <- value: ${value}`);
        this.mesh.scale.set(this.currentScale, this.currentScale, this.currentScale);
    }

}
