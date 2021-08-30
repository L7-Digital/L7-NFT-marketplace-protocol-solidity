const a = require('./1-seller-creates-english-auction-order').sellCreateEnglishAuction;
const b = require('./3-buyer-bids').buyerBids;
const c = require('./4-seller-accepts-offer').sellerAcceptsOffer;

(async () => {
    try {
        await a();
        await b({isOfferExpiresDemo: true});
        
        /**
         * This must be failed with error of 'Orders is not matchable.'
         */
        await c();
    } catch (e) {
        console.log(" [TEST 4b] ", "This test case should be FAILED with error of 'Orders is not matchable.'")
    }
})();
