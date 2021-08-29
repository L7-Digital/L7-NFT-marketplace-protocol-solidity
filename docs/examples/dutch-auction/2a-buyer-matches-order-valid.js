const a = require('./1-seller-creates-dutch-auction-order').sellerCreatesDutchAuction;
const b = require('./2-buyer-matches-order').buyerMatchesOrder;

(async () => {
    try {
        await a();
        await b({isTimeManipulatedDemo: false});

        console.log(" [TEST 2a] ", "This test case should pass")
    } catch (e) {
        console.log(e);
    }
})();