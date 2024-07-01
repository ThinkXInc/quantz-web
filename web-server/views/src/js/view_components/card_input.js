const stripePublicKey = "pk_live_51PTCBcP1TaGQC1MDzX0q5j419eyUyJeymT8G4zisWR28w8TWBCTQqjJafSUaYHbGrMcQIG71r2s2hlNkMGfIk57M00exKNhtR6"
//const stripePublicKey = "pk_test_51PTCBcP1TaGQC1MDeUgNkgN9Ob2g0FYwnJvZmiE9hWQhUZHUYizUi8c8ORiP3E2kX8NuVrMvofw1hO1gRgMvadQl00Wo9b3waJ"

class CardInputView {
    constructor({
        id,
        lang,
        mountElementId,
        redirectUrl,
    }) {
        this.id = id;
        this.mountElementId = mountElementId;
        this.redirectUrl = redirectUrl;

        this.stripe = Stripe(stripePublicKey, {
            locale: lang
        })
 
        this.initializeStripeElements()
    }

    async initializeStripeElements() {
        const response = await fetch("/v1/payments/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ }),
        });

        const data = await response.json();

        if (data.error) {
            this.displayError(data.error.message);
            return; // Stop initialization if there is an error
        }
      
        const { clientSecret } = data;
        const appearance = {
            theme: 'stripe',
        };
        this.elements = this.stripe.elements({ appearance, clientSecret });
        this.clientSecret = clientSecret;
      
        const paymentElementOptions = {
            layout: "tabs",
        };
      
        const paymentElement = this.elements.create("payment", paymentElementOptions);
        paymentElement.mount(`#${this.mountElementId}`);

        paymentElement.on('ready', () => {
            console.log('Payment element is mounted and ready.');
            document.getElementById(this.mountElementId).dispatchEvent(new CustomEvent('cardInputMounted'));
        });
    }

    displayError(errorMessage) {
        console.log(`display error ${errorMessage} to ${this.mountElementId}`)
        const $parent = document.getElementById(this.mountElementId); // Make sure you have this element in your HTML
        const $errorMessage = document.createElement('p')
        $errorMessage.classList.add('errorMessage');
        $errorMessage.style.color = '#8c1111';
        $errorMessage.style.padding = '3px 0';
        $errorMessage.style.fontSize = '12px';
        $errorMessage.textContent = errorMessage;
        $errorMessage.style.display = 'block'; // Show the error message element
        $parent.appendChild($errorMessage)
    }

    async submitCard({
        event,
        email,
        onError = (error)=>{},
        onComplete = ()=>{}
    }) {
        console.log(`submit card for user with email ${email}`)
        event.preventDefault();

        try {
            // Trigger form validation and wallet collection
            const { error: submitError } = await this.elements.submit();
            if (submitError) {
                throw submitError; // Handle the error if the form submission fails
            }

            const result = await this.stripe.confirmSetup({
                elements: this.elements,
                clientSecret: this.clientSecret,
                confirmParams: {
                    return_url: this.redirectUrl,
                }
            })
            if (result.error) {
                throw result.error;
            }
        } catch (error) {
            console.error('An error occurred:', error);
            onError(error.message);
        } finally {
            onComplete();
        }

    }

}