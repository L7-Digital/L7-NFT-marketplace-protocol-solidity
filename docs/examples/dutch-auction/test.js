const utime = require('../utils/utime').getUnixTime;

function address(i) {
    return 0;
}

let SaleKindInterface = { }
SaleKindInterface.Side = {
    Buy: 0,
    Sell: 1 
}
SaleKindInterface.canSettleOrder = function(listingTime, expirationTime) {
    let blockTimestamp = utime();

    return (listingTime < blockTimestamp) && (expirationTime == 0 || blockTimestamp < expirationTime);
}

function check(stmt, num) {
    if (stmt) {
        console.log(num, "OK")
    } else {
        console.log(num, "FAIL")
    }
}

function checkAll(buy, sell) {
    check((buy.side == SaleKindInterface.Side.Buy && sell.side == SaleKindInterface.Side.Sell), 1);
    /* Must use same fee method. */
    check((buy.feeMethod == sell.feeMethod), 2);
    /* Must use same payment token. */
    check((buy.paymentToken == sell.paymentToken), 3);
    /* Must match maker/taker addresses. */
    check((sell.taker == address(0) || sell.taker == buy.maker), 4);
    check((buy.taker == address(0) || buy.taker == sell.maker), 5);
    /* One must be maker and the other must be taker (no bool XOR in Solidity). */
    check((sell.feeRecipient == address(0) && buy.feeRecipient != address(0)), "6.1");
    check((sell.feeRecipient != address(0) && buy.feeRecipient == address(0)), "6.2");
    /* Must match target. */
    check((buy.target == sell.target), 7);
    /* Must match howToCall. */
    check((buy.howToCall == sell.howToCall), 8);
    /* Buy-side order must be settleable. */
    check(SaleKindInterface.canSettleOrder(buy.listingTime, buy.expirationTime), 9);
    // /* Sell-side order must be settleable. */
    check(SaleKindInterface.canSettleOrder(sell.listingTime, sell.expirationTime), 10);
};

auction = require('./auction.json')

console.log(SaleKindInterface.Side.Buy)
console.log(SaleKindInterface.Side.Sell)

checkAll(auction.buy, auction.sell)