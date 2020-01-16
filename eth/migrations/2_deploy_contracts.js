const EventContract = artifacts.require("EventContract");

module.exports = function(deployer) {
  deployer.deploy(EventContract, 100, "1000000000000000000");
};
