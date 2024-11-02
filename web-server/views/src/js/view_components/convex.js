class Convex {
    constructor({ id }) {
        this.id = id;
        this.setupView();
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

        const light = new THREE.PointLight(0xffffff, 3);
        this.camera.add(light);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 20;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;

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
            opacity: 0.5,
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

    startAnimating() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate.bind(this));
        }
    }

    animate() {
        this.controls.update();
        this.mesh.rotation.y += 0.005;
        this.renderer.render(this.scene, this.camera);
        this.frameId = requestAnimationFrame(this.animate.bind(this));
    }

    stopAnimating() {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
    }

    updateSize(value) {
        const scale = Math.log10(value + 1); // Using logarithmic scale for more natural visualization
        this.mesh.scale.set(scale, scale, scale);
    }
}
