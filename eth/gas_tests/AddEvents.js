const EventContract = artifacts.require("EventContract");

const util = require('../test/Util');

const fs = require('fs')

contract('Gas measurements', (accounts) => {

  let eventC;
  const eth = 1e18; //1 eth in wei units
  const ticket_price = 1e12; // 0.000001 eth
  let buyer = accounts[1];
  const owner = accounts[0];
  let test_event;

  let gas = {}

  it('Gas cost of ticket purchase as number of events increase', async () => {
    eventC = await EventContract.deployed();

    let title = web3.utils.asciiToHex("This is the event title");
    let costs = [];

    for(let i = 0; i < 1000; i++) {
      let id = web3.utils.asciiToHex(i.toString());
      let deadline = Math.round((Date.now() + 1000*60*60*24)/ 1000) // One day in the future.
      let r = await eventC.create_event(id, title, [1000], [ticket_price.toString()], false, 0, true, true, deadline, {from:owner});
      costs.push(r.receipt.gasUsed);
    }
    content = costs.join('\n');
    fs.writeFileSync('add_events.csv', content);
  });
});

contract('', (acc) => {
  // Dummy test to fix bug where snapshots are not properly rerverted in the last test to run
  it('Dummy test', async () => {
    util.advanceBlock();
  });
});
