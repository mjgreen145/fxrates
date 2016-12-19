class FXApp {
    constructor() {
        this.baseInput = document.getElementById('baseInput');
        this.quoteInput = document.getElementById('quoteInput');

        this.baseCurrencySelect = document.getElementById('baseCurrency');
        this.quoteCurrencySelect = document.getElementById('quoteCurrency');

        this.baseCurrency = this.baseCurrencySelect.value;
        this.quoteCurrency = this.quoteCurrencySelect.value;

        this.offlineToast = document.getElementById('offline-toast');

        this.buyButton = document.getElementById('buy-button');

        this.rates = {};

        this.addEventListeners();

        // display initial rate
        this.onInputChange({target: this.baseInput });
    }

    addEventListeners() {
        this.baseInput.addEventListener('focus', this.onInputFocus.bind(this));
        this.quoteInput.addEventListener('focus', this.onInputFocus.bind(this));

        this.baseInput.addEventListener('input', this.onInputChange.bind(this));
        this.quoteInput.addEventListener('input', this.onInputChange.bind(this));

        this.baseCurrencySelect.addEventListener('change', this.onCurrencySelectChange.bind(this));
        this.quoteCurrencySelect.addEventListener('change', this.onCurrencySelectChange.bind(this));

        this.buyButton.addEventListener('click', this.onButtonClicked.bind(this));

        window.addEventListener('offline', this.showOfflineToast.bind(this));
        window.addEventListener('online', this.hideOfflineToast.bind(this));
    }

    onInputChange(event) {
        if (event.target.id === 'baseInput') {
            this.updateValue(this.quoteInput, event.target.value, this.baseCurrency, this.quoteCurrency);
        } else {
            this.updateValue(this.baseInput, event.target.value, this.quoteCurrency, this.baseCurrency);
        }
    }

    onInputFocus(event) {
        if (event.target.id === 'baseInput') {
            this.baseInput.parentElement.classList.add('active');
            this.quoteInput.parentElement.classList.remove('active');
        } else {
            this.baseInput.parentElement.classList.remove('active');
            this.quoteInput.parentElement.classList.add('active');
        }
    }

    onCurrencySelectChange(event) {
        if (event.target.id === 'baseCurrency') {
            this.baseCurrency = event.target.value;
            this.updateValue(this.quoteInput, this.baseInput.value, this.baseCurrency, this.quoteCurrency);
        } else {
            this.quoteCurrency = event.target.value;
            this.updateValue(this.baseInput, this.quoteInput.value, this.quoteCurrency, this.baseCurrency);
        }
    }

    updateValue(inputToUpdate, inputVal, fromCurrency, toCurrency) {
        if (!inputVal) {
            return;
        }
        inputVal = parseFloat(inputVal.replace(/[^\d\.]/g, ''), 10);
        if (this.rates[fromCurrency]) {
            inputToUpdate.value = (this.rates[fromCurrency][toCurrency] * inputVal).toFixed(2).toString();
        } else {
            this.fetchRates(fromCurrency).then(() => {
                inputToUpdate.value = (this.rates[fromCurrency][toCurrency] * inputVal).toFixed(2).toString();
            }).catch(() => {});
        }
    }

    fetchRates(currency) {
        return fetch(`https://api.fixer.io/latest?base=${currency}`).then((response) => {
            return response.json();

        }).then((data) => {
            this.rates[currency] = data.rates;
            this.rates[currency][currency] = 1;
            setTimeout(() => {
                this.removeRates(currency)
            }, 300000);
        }).catch(() => {
            this.showOfflineToast();
            return Promise.reject('offline');
        });
    }

    showOfflineToast() {
        this.offlineToast.classList.add('active');
    }

    hideOfflineToast() {
        this.offlineToast.classList.remove('active');
    }

    removeRates(currency) {
        delete this.rates[currency];
    }

    // onNotifyButtonClicked() {
    //     const active = this.notifyButton.classList.toggle('active');
    //     if(active && this.messaging) {
    //         this.messaging.requestPermission().then(() => {
    //             this.messaging.getToken()
    //                 .then((currentToken) => {
    //                   if (currentToken) {
    //                     sendTokenToServer(currentToken);
    //                     updateUIForPushEnabled(currentToken);
    //                   } else {
    //                     // Show permission request.
    //                     console.log('No Instance ID token available. Request permission to generate one.');
    //                     // Show permission UI.
    //                     updateUIForPushPermissionRequired();
    //                     setTokenSentToServer(false);
    //                   }
    //                 })
    //                 .catch((err) => {
    //                   console.log('An error occurred while retrieving token. ', err);
    //                   showToken('Error retrieving Instance ID token. ', err);
    //                   setTokenSentToServer(false);
    //                 });
    //         }).catch((err) => {
    //           console.log('Unable to get permission to notify.', err);
    //           this.notifyButton.classList.toggle('active');
    //         });
    //     }
    // }

    onButtonClicked() {
        if(window.PaymentRequest) {
            const methodData = [
                {
                    supportedMethods: ['visa', 'mastercard', 'amex']
                }
            ];
            const details = {
                displayItems: [
                    {
                        label: `Currency - ${this.quoteInput.value} ${this.quoteCurrency}`,
                        amount: {
                            currency: this.baseCurrency,
                            value: this.baseInput.value
                        }
                    }
                ],
                shippingOptions: [
                    {
                        id: 'delivery',
                        label: 'Next Day Delivery',
                        amount: {currency: this.baseCurrency, value: '5.00'},
                        selected: true
                    },
                    {
                        id: 'store',
                        label: 'Store Pick-up',
                        amount: {currency: this.baseCurrency, value: '0.00'},
                    }
                ],
                total: {
                    label: 'Total',
                    amount: {
                        currency: this.baseCurrency,
                        value: (parseFloat(this.baseInput.value) + 5).toString()
                    }
                }
            };
            const options = {
                requestShipping: true,
                shippingType: 'shipping'
            }

            const request = new PaymentRequest(methodData, details, options);
            request.addEventListener('shippingoptionchange', e => {
              e.updateWith(((details, shippingOption) => {
                var selectedShippingOption;
                var otherShippingOption;
                if (shippingOption === 'store') {
                  selectedShippingOption = details.shippingOptions[1];
                  otherShippingOption = details.shippingOptions[0];
                  details.total.amount.value = this.baseInput.value;
                } else {
                  selectedShippingOption = details.shippingOptions[0];
                  otherShippingOption = details.shippingOptions[1];
                  details.total.amount.value = (parseFloat(this.baseInput.value) + 5).toString();
                }
                if (details.displayItems.length === 2) {
                  details.displayItems.splice(1, 0, selectedShippingOption);
                } else {
                  details.displayItems.splice(1, 1, selectedShippingOption);
                }
                selectedShippingOption.selected = true;
                otherShippingOption.selected = false;
                return Promise.resolve(details);
              })(details, request.shippingOption));
            });
            request.show().then((paymentResponse) => {
                const paymentData = {
                    method: paymentResponse.methodName,
                    details: paymentResponse.details.toJSON(),
                    address: paymentResponse.shippingAddress.toJSON(),
                    shippingOption: paymentResponse.shippingOption
                };
                console.log(paymentData);
                paymentResponse.complete('success');
            }).catch((error) => {
                console.error('Uh oh, something bad happened', error);
            });
        }
    }
}

const fxApp = new FXApp();

// Register a service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// window.addEventListener('load', () => {
//     var config = {
//         apiKey: 'AIzaSyDJTpbpXnJDj-JaO7gCIfsOH3yFD-Nernc',
//         messagingSenderId: '103953800507',
//     };
//     firebase.initializeApp(config);
//
//     fxApp.messaging = firebase.messaging();
// });
