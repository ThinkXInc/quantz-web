(function(ns) {
    ns.SignType = {
        standby: 'standby',
        busy: 'busy',
        active: 'active',
        error: 'error'
    };

    ns.Sign = class {
        constructor({buttonId, containerId, signType = ns.SignType.active}) {
            this.buttonId = buttonId;
            const container = document.getElementById(containerId);
            this.signElement = document.createElement('div');
            this.signElement.className = ns.configs[this.buttonId].prefix + ns.configs[this.buttonId].signClassName;
            this.signType = signType;

            if (container) {
                container.prepend(this.signElement);
            } else {
                console.error(`Sign container with ID ${containerId} does not exist.`);
                return;
            }

            this.initialize();
        }

        initialize() {
            this.changeTo(this.signType);
        }

        changeTo(signType) {
            if (Object.values(ns.SignType).includes(signType)) {
                this.signElement.classList.remove(
                    ns.configs[this.buttonId].prefix + ns.SignType.standby, 
                    ns.configs[this.buttonId].prefix + ns.SignType.busy, 
                    ns.configs[this.buttonId].prefix + ns.SignType.active, 
                    ns.configs[this.buttonId].prefix + ns.SignType.error
                );
                this.signType = signType;
                this.signElement.classList.add(ns.configs[this.buttonId].prefix + signType);
            } else {
                console.error("Invalid sign type.");
            }
        }
    }
})(Quantz); 