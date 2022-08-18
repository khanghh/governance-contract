// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const path = require('path')
const utils = require('./utils')
// const accs = require("../deployments/accounts.json");
// const addresses = require("../deployments/gov_contracts.json");

async function loadGovContracts() {
  const govAddressesFile = path.resolve('deployments/gov_contracts.json');
  const govAddresses = utils.loadJSONSync(govAddressesFile)
  if (govAddresses) {
    const staking = await ethers.getContractAt("Staking", govAddresses.STAKING_ADDRESS);
    const govDelegator = await ethers.getContractAt("GovImp", govAddresses.GOV_ADDRESS);
    const envDelegator = await ethers.getContractAt("EnvStorageImp", govAddresses.ENV_STORAGE_ADDRESS);
    const ballotStorage = await ethers.getContractAt("BallotStorage", govAddresses.BALLOT_STORAGE_ADDRESS);
    return { ...govAddresses, govDelegator, envDelegator, ballotStorage, staking }
  }
}

async function loadAccounts(hre) {
  const accsFile = path.resolve('deployments/accounts.json');
  const privateKeys = utils.loadJSONSync(accsFile)
  const accounts = [];
  if (privateKeys && privateKeys.length) {
    const ethers = hre.ethers;
    for (i = 0; i < privateKeys.length; i++) {
      const wallet = new ethers.Wallet(privateKeys[i]).connect(ethers.provider);
      accounts.push(wallet)
    }
  }
  return accounts
}

async function setup(hre) {
  const accounts = await loadAccounts(hre)
  if (accounts.length > 0) {
    const govContracts = await loadGovContracts()
    return { accounts, govContracts };
  }
}

module.exports = {
  setup: setup,
};
