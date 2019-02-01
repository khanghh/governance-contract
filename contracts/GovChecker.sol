pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interface/IRegistry.sol";
import "./Gov.sol";


/**
 * @title GovChecker
 * @dev GovChecker Contract that uses Registry contract
 */
contract GovChecker is Ownable {

    IRegistry public reg;
    bytes32 public constant GOV_NAME ="GovernanceContract";
    bytes32 public constant STAKING_NAME ="Staking";
    bytes32 public constant BALLOT_STORAGE_NAME ="BallotStorage";
    bytes32 public constant ENV_STORAGE_NAME ="EnvStorage";

    /**
     * @dev Function to set registry address. Contract that wants to use registry should setRegistry first.
     * @param _addr address of registry
     * @return A boolean that indicates if the operation was successful.
     */
    function setRegistry(address _addr) public onlyOwner {
        reg = IRegistry(_addr);
    }
    
    modifier onlyGov() {
        require(getContractAddress(GOV_NAME) == msg.sender, "No Permission");
        _;
    }

    modifier onlyGovMem() {
        address addr = reg.getContractAddress(GOV_NAME);
        require(addr != address(0), "No Governance");
        require(Gov(addr).isMember(msg.sender), "No Permission");
        _;
    }

    function getContractAddress(bytes32 name) internal view returns (address) {
        return reg.getContractAddress(name);
    }
}