const fs = require("fs");

async function listMembers(hre, govContracts) {
  const ethers = hre.ethers;

  const { staking, govDelegator } = govContracts

  const currenNodeNum = (await govDelegator.getNodeLength()).toNumber()
  const getMemberInfo = async function (idx) {
    const nodeInfo = await govDelegator.getNode(idx)
    const addr = await govDelegator.getMember(idx)
    const lockedBalance = await staking.lockedBalanceOf(addr)
    const locked = ethers.utils.formatEther(lockedBalance) + ' ETH'
    const name = ethers.utils.toUtf8String(nodeInfo.name)
    const enode = nodeInfo.enode
    const ip = ethers.utils.toUtf8String(nodeInfo.ip)
    const port = nodeInfo.port.toNumber()
    return { name, addr, enode, ip, port, locked }
  }
  let govMembers = []
  for (let idx = 1; idx <= currenNodeNum; idx++) {
    govMembers.push(getMemberInfo(idx))
  }
  govMembers = await Promise.all(govMembers)
  console.log("Governace member:")
  console.log(govMembers)
}

module.exports = { listMembers };
