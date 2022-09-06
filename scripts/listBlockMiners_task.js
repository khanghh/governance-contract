const { loadJSONSync } = require('./utils')

async function listBlockMiners(hre, numBlock, startBlockNum) {
  const ethers = hre.ethers
  let endBlockNum = parseInt(startBlockNum) + parseInt(numBlock)
  console.log(endBlockNum)
  if (!startBlockNum) {
    endBlockNum = await ethers.provider.getBlockNumber()
    startBlockNum = endBlockNum - numBlock
  }

  for (let blockNum = startBlockNum; blockNum <= endBlockNum; blockNum++) {
    const block = await ethers.provider.getBlock('0x' + blockNum.toString(16))
    if (block) {
      console.log(`Block #${blockNum} miner: ${block.miner}, timestamp: ${block.timestamp}`)
    }
  }
}

module.exports = { listBlockMiners };
