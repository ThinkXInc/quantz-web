const stripePublicKey = "pk_test_51P6Ok4RxUiyhO1hqnkHsmIhK30jeFun81jDFsABrYKN0djyDSWnV8yhg1xIsKMH5jplHRfsVsZ0Kary9wgvqUJyS00VJFfhj0f"

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
        const { clientSecret } = await response.json();
      
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

    async submitCard({
        event,
        email,
        onError = (error)=>{},
        onComplete = ()=>{}
    }) {
        console.warn(`submit card for user with email ${email}`)
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
        } catch (error) {
            console.error('An error occurred:', error);
            onError(error);
        } finally {
            onComplete();
        }

    }

}