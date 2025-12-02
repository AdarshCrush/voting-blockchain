// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AdminAuth {
    mapping(address => bool) public authorizedAdmins;
    address public owner;

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAdmins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    function addAdmin(address _admin) external onlyOwner {
        authorizedAdmins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        authorizedAdmins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    function isAdmin(address _admin) external view returns (bool) {
        return authorizedAdmins[_admin];
    }

    function verifyAdminSignature(
        address _admin,
        bytes32 _messageHash,
        bytes memory _signature
    ) external pure returns (bool) {
        require(_signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        address recovered = ecrecover(_messageHash, v, r, s);
        return recovered == _admin;
    }
}