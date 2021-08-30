Dutch Auction
===============

# Overview

**maker**: seller 
**taker**: buyer  
**fee charged to**: buyer  

**number of orders**:  
- seller: 1
- buyer: 1 (atomicMatch_ with the expected price)


# Sequence diagram

- See the [sequence diagram](./DutchAuction.png) for overview. ([Link to online diagram editor](https://online.visual-paradigm.com/community/share/taureum-diagram-n9ebhlvip))
- The flow of auction is explained in the comment section in each js code.
- The party who calls `atomicMatch_` should be the buyer.
