// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalRecords {
    // --- Structures ---
    
    // Structure to store doctor details.
    struct Doctor {
        string name;
        bool isRegistered;
    }
    
    // Structure to store medical record metadata.
    struct MedicalRecord {
        uint recordId;
        address owner;      // Doctor who uploaded the record.
        string fileHash;    // SHA-256 hash of the (encrypted) file.
        string cloudUrl;    // URL pointing to the file in cloud storage.
        uint timestamp;     // When the record was uploaded.
    }
    
    // --- State Variables ---
    
    // Mapping of doctor address to their details.
    mapping(address => Doctor) public doctors;
    
    // Mapping to store medical records by a unique recordId.
    mapping(uint => MedicalRecord) public records;
    uint public recordCounter; // Auto-incrementing counter for record IDs.
    
    // Mapping for access permissions: recordId => (doctor address => access granted).
    mapping(uint => mapping(address => bool)) public accessPermissions;
    
    // --- Events ---
    
    event DoctorRegistered(address indexed doctorAddress, string doctorName);
    event MedicalRecordUploaded(uint indexed recordId, address indexed uploader, string fileHash, string cloudUrl, uint timestamp);
    event AccessRequested(uint indexed recordId, address indexed requester);
    event AccessGranted(uint indexed recordId, address indexed grantedTo);
    event AccessRevoked(uint indexed recordId, address indexed revokedFrom);
    
    // --- Modifiers ---
    
    // Restricts function access to only registered doctors.
    modifier onlyRegisteredDoctor() {
        require(doctors[msg.sender].isRegistered, "Only registered doctors can call this function.");
        _;
    }
       // Ensure that only non-registered doctors can call the function.
    modifier notRegistered() {
        require(!doctors[msg.sender].isRegistered, "Doctor already registered.");
        _;
    }
    
    // --- Functions ---
    
      // --- Functions ---
    
    // Register a doctor with their name.
    // Using the notRegistered modifier prevents duplicate registration.
    function registerDoctor(string memory _name) public notRegistered {
        doctors[msg.sender] = Doctor(_name, true);
        emit DoctorRegistered(msg.sender, _name);
    }
    
    // Check if a doctor is registered.
    function isRegisteredDoctor(address _doctorAddress) public view returns (bool) {
        return doctors[_doctorAddress].isRegistered;
    }
    
    // Upload a medical record's metadata (file hash, cloud URL) to the blockchain.
    // Only a registered doctor can call this.
    function uploadMedicalRecord(string memory _fileHash, string memory _cloudUrl) public onlyRegisteredDoctor {
        recordCounter++;
        records[recordCounter] = MedicalRecord(recordCounter, msg.sender, _fileHash, _cloudUrl, block.timestamp);
        // Grant owner access by default.
        accessPermissions[recordCounter][msg.sender] = true;
        emit MedicalRecordUploaded(recordCounter, msg.sender, _fileHash, _cloudUrl, block.timestamp);
    }
    
    // Retrieve a medical record.
    // Only the owner or an authorized doctor can view the record.
    function getMedicalRecord(uint _recordId) public view returns (MedicalRecord memory) {
        require(
            records[_recordId].owner == msg.sender || accessPermissions[_recordId][msg.sender] == true,
            "Access not granted to view this record."
        );
        return records[_recordId];
    }
    
    // Request access to a medical record.
    // This function simply emits an event for the record owner to review off-chain.
    function requestAccess(uint _recordId) public onlyRegisteredDoctor {
        emit AccessRequested(_recordId, msg.sender);
    }
    
    // Grant access to a specific medical record.
    // Only the owner of the record can grant access.
    function grantAccess(uint _recordId, address _doctor) public {
        require(records[_recordId].owner == msg.sender, "Only record owner can grant access.");
        require(doctors[_doctor].isRegistered, "The doctor must be registered.");
        accessPermissions[_recordId][_doctor] = true;
        emit AccessGranted(_recordId, _doctor);
    }
    
    // Revoke access from a doctor for a specific record.
    // Only the record owner can revoke access.
    function revokeAccess(uint _recordId, address _doctor) public {
        require(records[_recordId].owner == msg.sender, "Only record owner can revoke access.");
        require(accessPermissions[_recordId][_doctor] == true, "The doctor does not have access.");
        accessPermissions[_recordId][_doctor] = false;
        emit AccessRevoked(_recordId, _doctor);
    }
}