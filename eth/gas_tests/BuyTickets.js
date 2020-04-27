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
    let deadline = Math.round((Date.now() + 1000*60*60*24)/ 1000) // One day in the future.
    let id = web3.utils.asciiToHex("TestEvent");
    await eventC.create_event(id, title, [10000], [ticket_price.toString()], false, 0, true, true, deadline, {from:owner});
    let costs = [];

    for(let acc of accounts) {
      let receipt = (await eventC.buy_tickets(id, 0, 1, {from: acc, value: ticket_price})).receipt;
      costs.push(receipt.gasUsed);
    }
    content = costs.join('\n');
    fs.writeFileSync('buytickets.csv', content);
  });
});

contract('', (acc) => {
  // Dummy test to fix bug where snapshots are not properly rerverted in the last test to run
  it('Dummy test', async () => {
    util.advanceBlock();
  });
});
