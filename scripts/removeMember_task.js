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

  const votingMembers = []
  const currenNodeNum = (await govDelegator.getNodeLength()).toNumber()
  console.log("Voting member:")
  for (let idx = 1; idx <= currenNodeNum; idx++) {
    const nodeInfo = await govDelegator.getNode(idx)
    const govMemName = ethers.utils.toUtf8String(nodeInfo.name)
    const govMem = members.find(mem => mem.name == govMemName)
    if (govMem) {
      console.log(govMemName)
      votingMembers.push(govMem)
    }
  }

  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  maxPFee = "100" + "0".repeat(9);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  let ballotLen = await govDelegator.ballotLength();
  let txs = [];

  console.log(`=> Submit proposal remove member ${memToRemove.name}`);
  const duration = await govDelegator.getMinVotingDuration();
  tx = await govDelegator
    .connect(deployer)
    .addProposalToRemoveMember(
      votingMembers[0].addr,
      largeToString(0),
      U2B("remove member " + memToRemove.name),
      duration,
      txParam
    );
  txs.push(tx);

  const ballotId = ballotLen.add(BigNumber.from(1));
  // const ballotId = await govDelegator.getBallotInVoting()
  console.log("ballotId ", ballotId.toNumber());
  // const info = await ballotStorage.getBallotVotingInfo(ballotId)
  // console.log(info)
  const needVoteNum = Math.ceil(votingMembers.length * 51 / 100)
  console.log('Need vote:', needVoteNum)
  console.log('Begin voting')
  for (let idx = 0; idx < needVoteNum; idx++) {
    console.log(`${votingMembers[idx + 2].name} voted: yes`);
    tx = await govDelegator.connect(votingMembers[idx].account).vote(ballotId, true, txParam);
    txs.push(tx);
  }

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
