const { largeToString, loadJSONSync } = require("./utils");
const BallotStates = {
  0: 'Invalid',
  1: 'Ready',
  2: 'InProgress',
  3: 'Accepted',
  4: 'Rejected',
  5: 'Canceled'
}

const BallotDecisions = {
  0: 'Invalid',
  1: 'Accept',
  2: 'Reject'
}

const BallotTypes = {
  0: 'Invalid',
  1: 'MemberAdd',  // new Member Address, new Node id, new Node ip, new Node port
  2: 'MemberRemoval', // old Member Address
  3: 'MemberChange',     // Old Member Address, New Member Address, new Node id, New Node ip, new Node port
  4: 'GovernanceChange', // new Governace Impl Address
  5: 'EnvValChange'    // Env variable name, type , value
}

function printBallotMemeber(ballotMember) {

}

async function getVotingInfo(hre, accounts, govContracts, confPath, ballotId) {
  const ethers = hre.ethers;
  const B2U = ethers.utils.toUtf8String;
  const deployConfig = loadJSONSync(confPath);
  const { staking, ballotStorage, govDelegator } = govContracts

  if (!ballotId) {
    const ballotInVoting = await govDelegator.getBallotInVoting()
    console.log("BallotInVoting:", ballotInVoting.toNumber())
    ballotId = ballotInVoting
  }

  console.log(`Ballot ${ballotId} basic info:`)
  const basicInfo = await ballotStorage.getBallotBasic(ballotId)
  console.log({
    startTime: basicInfo.startTime.toNumber(),
    endTime: basicInfo.endTime.toNumber(),
    ballotType: BallotTypes[basicInfo.ballotType],
    creator: basicInfo.creator,
    memo: B2U(basicInfo.memo),
    totalVoters: basicInfo.totalVoters.toNumber(),
    powerOfAccepts: basicInfo.powerOfAccepts.toNumber(),
    powerOfRejects: basicInfo.powerOfRejects.toNumber(),
    state: BallotStates[basicInfo.state],
    isFinalized: basicInfo.isFinalized,
    duration: basicInfo.duration.toNumber(),
  })
}

module.exports = { getVotingInfo };
