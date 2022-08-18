const fs = require("fs");
const { largeToString, loadJSONSync } = require("./utils");

async function addMembers(hre, accounts, govContracts, configPath) {
  const deployConfig = loadJSONSync(configPath);
  const ethers = hre.ethers;

  const { staking, govDelegator } = govContracts

  const BigNumber = hre.ethers.BigNumber;

  const U2B = ethers.utils.toUtf8Bytes;

  let members = deployConfig.members;
  if (accounts.length != members.length) {
    console.log("accounts length is not equal members length");
    return;
  }
  const deployer = accounts[0]

  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  maxPFee = "100" + "0".repeat(9);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  let ballotLen = await govDelegator.ballotLength();
  let txs = [];

  const duration = await govDelegator.getMinVotingDuration();
  console.log("staking");
  // skip first member
  for (idx = 1; idx < accounts.length; idx++) {
    tx = await staking.connect(accounts[idx]).deposit({ value: largeToString(members[idx].stake), gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    txs.push(tx);
  }
  console.log("staking finished");
  // skip first member
  for (idx = 1; idx < accounts.length; idx++) {
    console.log(`=> Submit proposal add member ${members[idx].name}`);

    tx = await govDelegator
      .connect(deployer)
      .addProposalToAddMember(
        [
          accounts[idx].address,
          accounts[idx].address,
          accounts[idx].address,
          U2B(members[idx].name),
          members[idx].id,
          U2B(members[idx].ip),
          members[idx].port,
          largeToString(members[idx].stake),
          U2B("add member " + members[idx].name),
          duration,
        ],
        txParam
      );
    txs.push(tx);

    ballotLen = ballotLen.add(BigNumber.from(1));
    console.log("ballotLen ", ballotLen.toNumber());
    for (memIdx = 0; memIdx < Math.ceil(idx * 51 / 100); memIdx++) {
      console.log(`${members[memIdx].name} voted: yes`);
      tx = await govDelegator.connect(accounts[memIdx]).vote(ballotLen, true, txParam);
      txs.push(tx);
    }
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
module.exports = { addMembers };
