const fs = require("fs");
const { largeToString, loadJSONSync } = require("./utils");

async function addNewMember(hre, accounts, govContracts, configPath, memberName) {
  const ethers = hre.ethers;
  const U2B = ethers.utils.toUtf8Bytes;
  const BigNumber = hre.ethers.BigNumber;

  const deployConfig = loadJSONSync(configPath);
  const deployer = accounts[0]

  const { staking, govDelegator } = govContracts

  const members = deployConfig.members.map((mem, idx) => ({ ...mem, account: accounts[idx] }))

  const govMems = []
  const currenNodeNum = (await govDelegator.getNodeLength()).toNumber()
  console.log("Governace member:")
  for (let idx = 1; idx <= currenNodeNum; idx++) {
    const nodeInfo = await govDelegator.getNode(idx)
    const govMemName = ethers.utils.toUtf8String(nodeInfo.name)
    const govMem = members.find(mem => mem.name == govMemName)
    if (govMem) {
      console.log(govMemName)
      govMems.push(govMem)
    }
  }

  const memToAdd = members.find(member => member.name === memberName)
  if (!memToAdd) {
    console.log('Could not find member', memToAdd.name)
    return
  }
  console.log("Member to add:", memToAdd.name)

  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  maxPFee = "100" + "0".repeat(9);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  let ballotLen = await govDelegator.ballotLength();
  let txs = [];

  console.log('staking')
  tx = await staking.connect(memToAdd.account).deposit({
    value: largeToString(memToAdd.stake),
    gasLimit: txParam.gasLimit,
    gasPrice: txParam.gasPrice
  });
  txs.push(tx);
  console.log('staking finished')

  console.log(`=> Submit proposal add member ${memToAdd.name}`);
  const duration = await govDelegator.getMinVotingDuration();
  tx = await govDelegator
    .connect(deployer)
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
  txs.push(tx);

  ballotLen = ballotLen.add(BigNumber.from(1));
  console.log("ballotLen ", ballotLen.toNumber());
  const needVoteNum = Math.ceil(govMems.length * 51 / 100)
  console.log('Need vote:', needVoteNum)
  console.log('Begin voting')
  for (let idx = 0; idx < needVoteNum; idx++) {
    console.log(`${govMems[idx].name} voted: yes`);
    tx = await govDelegator.connect(govMems[idx].account).vote(ballotLen, true, txParam);
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
}
module.exports = { addNewMember };
