const AdminAuth = artifacts.require("AdminAuth");

module.exports = function (deployer) {
  deployer.deploy(AdminAuth);
};