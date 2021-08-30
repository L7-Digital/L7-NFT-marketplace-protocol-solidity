const a = require('./1-seller-creates-english-auction-order').sellCreateEnglishAuction;
const b = require('./3-buyer-bids').buyerBids;
const c = require('./4-seller-accepts-offer').sellerAcceptsOffer;

(async () => {
    try {
        await a();
        await b({isOfferExpiresDemo: false});
        await c();

        console.log(" [TEST 4a] ", "This test case should pass")
    } catch (e) {
        console.log(e);
    }
})();
