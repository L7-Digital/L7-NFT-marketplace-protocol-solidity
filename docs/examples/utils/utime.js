const getUnixTime = (() => {
    return Math.floor(Date.now() / 1000);
})

const getUnixTimeAfter = ((dd, hh, mm, ss) => {
    let curr = getUnixTime();
    return curr + ss + mm*60 + hh*60*60 + dd*24*60*60;
})

const getUnixTimeAfterDays = ((dd) => {
    return getUnixTimeAfter(dd,0,0,0);
})

const getUnixTimeAfterHours = ((hh) => {
    return getUnixTimeAfter(0,hh,0,0);
})

const getUnixTimeAfterMinutes = ((mm) => {
    return getUnixTimeAfter(0,0,mm,0);
})

const getUnixTimeAfterSeconds = ((ss) => {
    return getUnixTimeAfter(0,0,0,ss);
})

module.exports = {
    getUnixTime, 
    getUnixTimeAfter,
    getUnixTimeAfterDays,
    getUnixTimeAfterHours,
    getUnixTimeAfterMinutes,
    getUnixTimeAfterSeconds
}

// const {getUnixTime, getUnixTimeAfter} = require('./docs/examples/utils/utime')