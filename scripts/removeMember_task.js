const fs = require("fs");
const { largeToString, loadJSONSync } = require("./utils");

async function removeMember(hre, accounts, govContracts, configPath, memberName) {
  const ethers = hre.ethers;
  const U2B = ethers.utils.toUtf8Bytes;
  const BigNumber = hre.ethers.BigNumber;

  const deployConfig = loadJSONSync(configPath);
  const deployer = accounts[0]

  const { staking, ballotStorage, govDelegator } = govContracts

  const members = deployConfig.members.map((mem, idx) => ({ ...mem, account: accounts[idx] }))
  const memToRemove = members.find(member => member.name === memberName)
  if (!memToRemove) {
    console.log('Could not find member', memToRemove.name)
    return
  }
  console.log("Member to remove:", memToRemove.name)

  const currenNodeNum = (await govDelegator.getNodeLength()).toNumber()
  let votingMembers = []
  console.log("Governance members:")
  const getGovMem = async function (idx) {
    const nodeInfo = await govDelegator.getNode(idx)
    const govMemName = ethers.utils.toUtf8String(nodeInfo.name)
    return members.find(mem => mem.name == govMemName)
  }
  for (let idx = 1; idx <= currenNodeNum; idx++) {
    votingMembers.push(getGovMem(idx))
  }
  votingMembers = await Promise.all(votingMembers)
  console.log(votingMembers.map(item => item.name))

  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  maxPFee = "100" + "0".repeat(9);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  let txs = [];

  console.log(`=> Submit proposal remove member ${memToRemove.name}`);
  const duration = await govDelegator.getMinVotingDuration();
  const lockAmount = hre.ethers.utils.parseUnits('1500000', 18)
  let tx = await govDelegator
    .connect(deployer)
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
  }

  const ballotId = await govDelegator.ballotLength();
  console.log("ballotId:", ballotId.toNumber())
  const needVote = Math.ceil(votingMembers.length * 51 / 100)
  console.log('Need vote:', needVote)
  console.log('Begin voting')
  for (let idx = 0; idx < needVote; idx++) {
    console.log(`${votingMembers[idx].name} voted: yes`);
    tx = govDelegator.connect(votingMembers[idx].account).vote(ballotId, true, txParam);
    txs.push(tx);
  }

  txs = await Promise.all(txs)
  fs.writeFileSync("./deployments/txs.json", JSON.stringify(txs, null, 2), "utf-8");

  const receipts = []
  for (i = 0; i < txs.length; i++) {
    hash = txs[i].hash;
    // receipt = await tx.wait()
    receipt = await ethers.provider.waitForTransaction(hash)
    // receipts.push(receipt)
    if (receipt && receipt.status == 1) {
      console.log(`${i}. ${hash} is ok`)
    }
    else {
      console.log(`${i}. ${hash} is not ok`)
    }
  }

  fs.writeFileSync('./deployments/receipts.json', JSON.stringify(receipts, null, 2), 'utf-8');
}

module.exports = { removeMember };
