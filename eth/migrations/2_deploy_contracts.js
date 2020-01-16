const EventContract = artifacts.require("EventContract");

module.exports = function(deployer) {
  deployer.deploy(EventContract, 100, "10000000000000000");
};
