const fs = require("fs");
const { largeToString, loadJSONSync } = require("./utils");


async function addMember(hre, govMembers, govContracts, memToAdd) {
  const ethers = hre.ethers;
  const U2B = ethers.utils.toUtf8Bytes;

  const { govDelegator } = govContracts

  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  maxPFee = "100" + "0".repeat(9);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  let txs = [];

  console.log(`=> Submit proposal add member ${memToAdd.name}`);
  const duration = await govDelegator.getMinVotingDuration();
  let tx = await govDelegator
    .connect(govMembers[0].account)
    .addProposalToAddMember(
      [
        memToAdd.addr,
        memToAdd.addr,
        memToAdd.addr,
        U2B(memToAdd.name),
        memToAdd.id,
        U2B(memToAdd.ip),
        memToAdd.port,
        largeToString(memToAdd.stake),
        U2B("add member " + memToAdd.name),
        duration,
      ],
      txParam
    );
  let receipt = await ethers.provider.waitForTransaction(tx.hash)
  if (receipt.status == 1) {
    console.log(`Proposal submited. tx:`, receipt.transactionHash)
  } else {
    console.log(`Failed to submit proposal. tx:`, receipt.transactionHash)
    return
  }

  const ballotId = await govDelegator.ballotLength();
  console.log("ballotId:", ballotId.toNumber())
  const needVote = Math.ceil(govMembers.length * 51 / 100)
  console.log('Need vote:', needVote)
  console.log('Begin voting')
  for (let idx = 0; idx < needVote; idx++) {
    tx = govDelegator.connect(govMembers[idx].account).vote(ballotId, true, txParam);
    console.log(`${govMembers[idx].name} voted: yes`);
    txs.push(tx);
  }
  txs = await Promise.all(txs)

  let receipts = []
  for (i = 0; i < txs.length; i++) {
    hash = txs[i].hash;
    receipts.push(ethers.provider.waitForTransaction(hash))
  }
  receipts = await Promise.all(receipts)
  let isAllOk = false
  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i]
    if (receipt && receipt.status == 1) {
      console.log(`${i}. ${hash} is ok`)
    }
    else {
      console.log(`${i}. ${hash} is not ok`)
      isAllOk = false
    }
  }
  if (isAllOk) {
    govMembers.push(memToAdd)
  }
}

async function removeMember(hre, govMembers, govContracts, memToRemove) {
  const ethers = hre.ethers;
  const U2B = ethers.utils.toUtf8Bytes;

  const { govDelegator } = govContracts

  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  maxPFee = "100" + "0".repeat(9);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  let txs = [];


  console.log(`=> Submit proposal remove member ${memToRemove.name}`);
  const duration = await govDelegator.getMinVotingDuration();
  const lockAmount = hre.ethers.utils.parseUnits('1500000', 18)
  let tx = await govDelegator
    .connect(govMembers[0].account)
    .addProposalToRemoveMember(
      memToRemove.addr,
      lockAmount,
      U2B("remove member " + memToRemove.name),
      duration,
      txParam
    );
  let receipt = await ethers.provider.waitForTransaction(tx.hash)
  if (receipt.status == 1) {
    console.log(`Proposal submited. tx:`, receipt.transactionHash)
  } else {
    console.log(`Failed to submit proposal. tx:`, receipt.transactionHash)
    return
  }

  const ballotId = await govDelegator.ballotLength();
  console.log("ballotId:", ballotId.toNumber())
  const needVote = Math.ceil(govMembers.length * 51 / 100)
  console.log('Need vote:', needVote)
  console.log('Begin voting')
  for (let idx = 0; idx < needVote; idx++) {
    tx = govDelegator.connect(govMembers[idx].account).vote(ballotId, true, txParam);
    console.log(`${govMembers[idx].name} voted: yes`);
    txs.push(tx);
  }
  txs = await Promise.all(txs)

  let receipts = []
  for (i = 0; i < txs.length; i++) {
    hash = txs[i].hash;
    receipts.push(ethers.provider.waitForTransaction(hash))
  }
  receipts = await Promise.all(receipts)
  let isAllOk = false
  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i]
    if (receipt && receipt.status == 1) {
      console.log(`${i}. ${hash} is ok`)
    }
    else {
      console.log(`${i}. ${hash} is not ok`)
      isAllOk = false
    }
  }
  if (isAllOk) {
    const memIndex = govMembers.findIndex(item => item.name == memToRemove.name)
    govMembers.splice(memIndex, 1)
  }
}

async function getGovMemers(hre, members, govDelegator) {
  const ethers = hre.ethers
  const currenNodeNum = (await govDelegator.getNodeLength()).toNumber()
  let govMembers = []
  const getGovMem = async function (idx) {
    const nodeInfo = await govDelegator.getNode(idx)
    const govMemName = ethers.utils.toUtf8String(nodeInfo.name)
    return members.find(mem => mem.name == govMemName)
  }
  for (let idx = 1; idx <= currenNodeNum; idx++) {
    govMembers.push(getGovMem(idx))
  }
  return await Promise.all(govMembers)
}

async function fuzzyChangeMembership(hre, accounts, govContracts, confPath) {
  const deployConfig = loadJSONSync(confPath);
  const { govDelegator } = govContracts
  const members = deployConfig.members.map((mem, idx) => ({ ...mem, account: accounts[idx] }))

  const getRandomMembers = (members) => {
    if (!members || members.length <= 0) return []
    const ret = []
    const count = Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      ret.push(members[Math.floor(Math.random() * members.length)])
    }
    return ret
  }

  while (true) {
    let govMembers = await getGovMemers(hre, members, govDelegator)
    let notGovMembers = members.filter(item => !govMembers.includes(item));
    const memsToAdd = getRandomMembers(notGovMembers)
    if (memsToAdd.length > 0) {
      console.log("Begin add members:", memsToAdd.map(item => item.name))
      for (const memToAdd of memsToAdd) {
        await addMember(hre, govMembers, govContracts, memToAdd)
        notGovMembers = members.filter(item => !govMembers.includes(item));
      }
    }
    const memsToRemove = getRandomMembers(govMembers)
    if (memsToRemove.length > 0) {
      console.log("Begin remove members:", memsToRemove.map(item => item.name))
      for (const memToRemove of memsToRemove) {
        await removeMember(hre, govMembers, govContracts, memToRemove)
      }
    }
  }
}

module.exports = { fuzzyChangeMembership };
