require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();
const { task } = require("hardhat/config");
const path = require("path");

const sendTx = require("./scripts/sendTx_task").sendTxKeep;
const setup = require("./scripts/setup_task").setup;
const changeEnv = require("./scripts/changeEnv_task").changeEnvVal;
const deployGov = require("./scripts/deploy_task").deployGov;
const listMembers = require("./scripts/listAllMember_task").listMembers;
const getVotingInfo = require("./scripts/getVotingInfo_task").getVotingInfo;
const voteBallot = require("./scripts/vote_task").voteBallot;
const listBlockMiners = require("./scripts/listBlockMiners_task").listBlockMiners;
const addMembers = require("./scripts/addMembers_task").addMembers;
const addNewMember = require("./scripts/addNewMember_task").addNewMember;
const removeMember = require("./scripts/removeMember_task").removeMember;

task("accounts", "List all accounts")
  .setAction(async (taskArgs, hre) => {
    const { accounts } = await setup(hre)
    for (const acc of accounts) {
      const balance = await acc.getBalance()
      const ethBalance = hre.ethers.utils.formatEther(balance)
      console.log(`${acc.address}: ${ethBalance} ETH`)
    }
  })

task("deployGov", "Deploy governance contracts")
  .addParam('conf')
  .setAction(async (taskArgs, hre) => {
    hre.ethers.utils.toUtf8String
    const { accounts } = await setup(hre)
    await deployGov(hre, accounts, taskArgs.conf);
  })

task("listMembers", "list all governance members")
  .setAction(async (taskArgs, hre) => {
    const { govContracts } = await setup(hre)
    await listMembers(hre, govContracts);
  })

task("listMiners", "list block miners")
  .addParam('from', "", "", undefined, true)
  .addParam('count')
  .setAction(async (taskArgs, hre) => {
    await listBlockMiners(hre, taskArgs.count, taskArgs.from)
  })

task("addMembers", "Add governance members")
  .addParam("conf")
  .setAction(async (taskArgs, hre) => {
    const { accounts, govContracts } = await setup(hre)
    await addMembers(hre, accounts, govContracts, taskArgs.conf);
  })

task("addNewMember", "Add new member")
  .addParam("conf")
  .addParam("name")
  .setAction(async (taskArgs, hre) => {
    const { accounts, govContracts } = await setup(hre)
    await addNewMember(hre, accounts, govContracts, taskArgs.conf, taskArgs.name);
  })

task("removeMember", "Add new member")
  .addParam("conf")
  .addParam("name")
  .setAction(async (taskArgs, hre) => {
    const { accounts, govContracts } = await setup(hre)
    await removeMember(hre, accounts, govContracts, taskArgs.conf, taskArgs.name);
  })

task("votingInfo", "Get voting ballot info")
  .addParam("conf")
  .addParam("ballotId", "", "", undefined, true)
  .setAction(async (taskArgs, hre) => {
    const { accounts, govContracts } = await setup(hre)
    await getVotingInfo(hre, accounts, govContracts, taskArgs.conf, taskArgs.ballotId);
  })

task("vote", "vote a ballot")
  .addParam("conf")
  .addParam("accIndex")
  .addParam("ballotId")
  .addParam("decision")
  .setAction(async (taskArgs, hre) => {
    const { accounts, govContracts } = await setup(hre)
    await voteBallot(hre, accounts, govContracts, taskArgs.conf, taskArgs.accIndex, taskArgs.ballotId, taskArgs.decision);
  })

task("changeMP", "Change maxPrioirtyFeePerGas")
  .addParam("envValue")
  .setAction(async (args, hre) => {
    hre.ethers.provider.getBlock()
    const { accounts, govContracts } = await setup(hre);
    let envName = "blockPer";
    let envTypes = ["uint256"];
    let envValue = [args.envValue];
    envMsg = "change blockPer";
    await changeEnv(hre, accounts, govContracts, envName, envTypes, envValue, envMsg);
  });

task("changeFee", "Change gasLimitAndBaseFee")
  .addParam("gasLimit")
  .addParam("changeRate")
  .addParam("targetPerc")
  .addParam("maxBasefee")
  .setAction(async (args, hre) => {
    const { accounts, govContracts } = await setup(hre);
    let envName = "gasLimitAndBaseFee";
    let envTypes = ["uint256", "uint256", "uint256", "uint256"];
    let envValue = [args.gasLimit, args.changeRate, args.targetPerc, args.maxBasefee + "0".repeat(9)];
    envMsg = "mp test";
    await changeEnv(hre, accounts, govContracts, envName, envTypes, envValue, envMsg);
  });

task("sendTx", "send tx")
  .addParam("fromIdx")
  .addParam("toIdx")
  .addParam("value")
  .setAction(async (args, hre) => {
    const { accounts } = await setup(hre);
    await sendTx(hre, accounts, args.fromIdx, args.toIdx, args.value);
  });

module.exports = {
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        initialIndex: 0,
        accountsBalance: "1000000000" + "0".repeat(18),
      },
      // forking:{
      //     url: 'https://api.test.wemix.com'
      // },
      allowUnlimitedContractSize: true
    },
    local: {
      url: "http://127.0.0.1:8545"
    },
    testnet: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545"
    }
  },
  contractSizer: {
    runOnCompile: true,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: path.join(__dirname, "./contracts"),
  },
  mocha: {
    timeout: 1000000,
  },
  gasReporter: {
    enabled: true,
  },
};
