const fs = require("fs");
const { largeToString, loadJSONSync } = require("./utils");

async function voteBallot(hre, accounts, govContracts, confPath, accIndex, ballotId, decision) {
  const ethers = hre.ethers;
  const U2B = ethers.utils.toUtf8Bytes;
  const BigNumber = hre.ethers.BigNumber;

  const deployConfig = loadJSONSync(confPath);
  let members = deployConfig.members;

  const voteAcc = accounts[accIndex]
  const voteMem = members[accIndex]
  ballotId = parseInt(ballotId)

  console.log("BallotId:", ballotId)
  console.log("Vote member:", voteMem.name)
  console.log("Vote account:", voteAcc.address)

  const { govDelegator } = govContracts
  decision = decision == "true" || decision == "1"
  GL = "30000000"; //ethers.BigNumber.from(21000 * 1500);
  let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
  console.log(`${voteMem.name} voted: ${decision}`)
  const tx = await govDelegator.connect(voteAcc).vote(ballotId, decision, txParam)
  const receipt = await ethers.provider.waitForTransaction(tx.hash)
  if (receipt.status == 1) {
    console.log(`tx ${tx.hash} is ok `,)
  } else {
    console.log(`tx ${tx.hash} is not ok `,)
    console.log(receipt)
  }
}

module.exports = { voteBallot };
