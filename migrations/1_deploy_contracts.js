const ConvertLib = artifacts.require("ConvertLib");
const MetaCoin = artifacts.require("MetaCoin");
const MedicalRecords = artifacts.require("MedicalRecords");
const HealthCare = artifacts.require("HealthCare");
const BlockchainVoting = artifacts.require("BlockchainVoting");



module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(MedicalRecords);
  deployer.deploy(HealthCare);
  deployer.deploy(BlockchainVoting);
};
