English Auction
===============

# Overview

**maker**: buyers  
**taker**: seller  
**fee charged to**: seller  

**number of orders**:  
- buyers: many
- seller: one (to atomicMatch_ with the bid winner) 

**automatically match order after auction ends?** no

# Sequence diagram

- See the [sequence diagram](./EnglishAuction.png) for overview.
- The flow of auction is explained in the comment section in each js code.
- NOTE that only BEP20 tokens should be used as fees in an English auction. If one wishes to use `BNB`, consider its BEP20 equivalence `WBNB`.