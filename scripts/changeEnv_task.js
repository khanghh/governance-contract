const { loadJSONSync } = require('./utils')
const fs = require('fs')

async function changeEnvVal(hre, accounts, govContracts, envName, types, values, msg) {
  const ethers = hre.ethers;
  const U2B = ethers.utils.toUtf8Bytes;
  const B2U = ethers.utils.toUtf8String;
  const BigNumber = hre.ethers.BigNumber;

  const deployer = accounts[0]
  const { govDelegator, envDelegator, ballotStorage } = govContracts

  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  maxPFee = "100" + "0".repeat(9);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  let ballotLen = await govDelegator.ballotLength();
  let txs = [];

  const bfMP = await envDelegator.getMaxPriorityFeePerGas();
  const bfGLB = await envDelegator.getGasLimitAndBaseFee();
  const bfMB = await envDelegator.getMaxBaseFee();
  const bfBlockPer = await envDelegator.getBlocksPer();
  const bfBlockCreationTime = await envDelegator.getBlockCreationTime();

  const govMems = []
  const currenNodeNum = (await govDelegator.getNodeLength()).toNumber()
  console.log("Governance members:")
  const getGovMem = async function (idx) {
    const nodeInfo = await govDelegator.getNode(idx)
    const govMemName = ethers.utils.toUtf8String(nodeInfo.name)
    return members.find(mem => mem.name == govMemName)
  }
  for (let idx = 1; idx <= currenNodeNum; idx++) {
    govMems.push(getGovMem(idx))
  }
  govMems = await Promise.all(votingMembers)
  console.log(govMems.map(item => item.name))

  console.log(`=> Submit proposal changeEnv`);
  let tx = await govDelegator
    .connect(deployer)
    .addProposalToChangeEnv(
      ethers.utils.keccak256(U2B(envName)),
      2,
      type2Bytes(ethers, types, values),
      U2B(msg),
      86400,
      txParam
    );
  let receipt = await ethers.provider.waitForTransaction(tx.hash)
  if (receipt.status == 1) {
    console.log(`tx: ${tx.hash} is ok`)
  } else {
    console.log(`tx: ${tx.hash} is not ok`)
  }

  const ballotId = ballotLen.add(BigNumber.from(1));
  console.log("ballotId", ballotId);
  const needVoteNum = Math.ceil(accounts.length * 51 / 100)
  console.log('Need vote:', needVoteNum)
  console.log('Begin voting')
  for (let idx = 0; idx < needVoteNum; idx++) {
    console.log(`${govMems[idx]} voted: yes`);
    tx = await govDelegator.connect(accounts[idx]).vote(ballotId, true, txParam);
    txs.push(tx);
  }

  fs.writeFileSync("./deployments/txs.json", JSON.stringify(txs), "utf-8");

  for (i = 0; i < txs.length; i++) {
    hash = txs[i].hash;
    receipt = await ethers.provider.waitForTransaction(hash)
    if (receipt && receipt.status == 1) {
      console.log(`${i}. ${hash} is ok`)
    }
    else {
      console.log(`${i}. ${hash} is not ok`)
    }
  }

  const state = await ballotStorage.getBallotState(ballotId);
  console.log("voting state", state)
  const afterMP = await envDelegator.getMaxPriorityFeePerGas();
  const afterGLB = await envDelegator.getGasLimitAndBaseFee();
  const afterMB = await envDelegator.getMaxBaseFee();
  const afBlockPer = await envDelegator.getBlocksPer();
  const afBlockCreationTime = await envDelegator.getBlockCreationTime();
  console.log("BlockCreationTime", bfBlockCreationTime.toNumber(), "->", afBlockCreationTime.toNumber());
  console.log("BlockPer", bfBlockPer.toNumber(), "->", afBlockPer.toNumber());
  // console.log("blockGasLimit", bfGLB[0].toNumber(), "->", afterGLB[0].toNumber());
  // console.log("baseFeeMaxChangeRate", bfGLB[1].toNumber(), "->", afterGLB[1].toNumber());
  // console.log("gasTargetPercentage", bfGLB[2].toNumber(), "->", afterGLB[2].toNumber());
  // console.log("maxBaseFee", bfMB.toNumber(), "->", afterMB.toNumber());
}

module.exports = { changeEnvVal };

function type2Bytes(ethers, types, inputs) {
  const ABICoder = ethers.utils.AbiCoder;
  const abiCoder = new ABICoder();

  let parameters = abiCoder.encode(types, inputs);
  return parameters;
}
