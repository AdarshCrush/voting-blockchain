// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BlockchainVoting
 * @dev Optimized decentralized voting system contract
 */
contract BlockchainVoting {
    
    enum VotingStatus { Pending, Active, Completed, Cancelled }
    enum AccessLevel { None, Voter, Observer, Admin }

    struct Party {
        address partyAddress;
        string name;
        string symbol;
        address representative;
        bool isRegistered;
        uint256 voteCount;
        uint256 memberCount;
        uint256 registrationTimestamp;
    }

    struct Candidate {
        address candidateAddress;
        uint256 partyId;
        string name;
        string position;
        bool isRegistered;
        uint256 voteCount;
        uint256 registrationTimestamp;
    }

    struct Election {
        uint256 electionId;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        VotingStatus status;
        bool isApproved;
        uint256 totalVotes;
        uint256 totalParties;
        uint256 totalCandidates;
        uint256 createdAt;
        uint256 approvedAt;
    }

    struct Voter {
        address voterAddress;
        string email;
        bool isRegistered;
        bool hasVoted;
        uint256 votedElectionId;
        uint256 votedCandidateId;
        uint256 votedPartyId;
        string transactionHash;
        uint256 votedAt;
        uint256 registrationTimestamp;
    }

    struct VoterAccessRequest {
        uint256 requestId;
        address voterAddress;
        uint256 electionId;
        AccessLevel requestedLevel;
        bool isApproved;
        bool isProcessed;
        uint256 requestTimestamp;
        address approvedBy;
    }

    struct AdminRequest {
        uint256 requestId;
        address requestedAdmin;
        AccessLevel adminLevel;
        bool isApproved;
        bool isProcessed;
        uint256 requestTimestamp;
    }

    address public owner;
    mapping(address => bool) public admins;
    mapping(address => AccessLevel) public adminLevels;
    bool public paused;

    // Core mappings
    mapping(uint256 => Election) public elections;
    mapping(uint256 => address[]) public electionParties;
    mapping(uint256 => address[]) public electionCandidates;
    mapping(uint256 => address[]) public electionVoters;
    mapping(uint256 => mapping(address => bool)) public isPartyInElection;
    mapping(uint256 => mapping(address => bool)) public isCandidateInElection;
    uint256 public electionCount;

    mapping(address => Party) public parties;
    mapping(address => address[]) public partyCandidates;
    address[] public registeredParties;

    mapping(address => Candidate) public candidates;
    address[] public registeredCandidates;

    mapping(address => Voter) public voters;
    mapping(uint256 => mapping(address => bool)) public hasVotedInElection;
    mapping(uint256 => mapping(address => AccessLevel)) public voterAccessPerElection;
    address[] public registeredVoters;

    // Vote Tracking
    mapping(uint256 => mapping(address => uint256)) public candidateVotesInElection;
    mapping(uint256 => mapping(address => uint256)) public partyVotesInElection;

    // Access Control
    mapping(uint256 => VoterAccessRequest) public voterAccessRequests;
    mapping(address => uint256[]) public voterAccessRequestIds;
    uint256 public voterAccessRequestCount;

    // Admin Requests
    mapping(uint256 => AdminRequest) public adminRequests;
    uint256 public adminRequestCount;
    mapping(address => uint256[]) public adminRequestIds;

    // Reentrancy guard
    bool private _locked;

    // Events (simplified)
    event AdminAdded(address indexed admin, AccessLevel level);
    event AdminRemoved(address indexed admin);
    event ElectionCreated(uint256 indexed electionId, string name);
    event ElectionApproved(uint256 indexed electionId, address indexed approver);
    event ElectionStatusChanged(uint256 indexed electionId, VotingStatus newStatus);
    event PartyRegistered(address indexed partyAddress, string name);
    event CandidateRegistered(address indexed candidateAddress, string name, address indexed partyAddress);
    event VoterRegistered(address indexed voterAddress, string email);
    event VoteCasted(address indexed voter, uint256 indexed electionId, address indexed candidateAddress);
    event VoterAccessGranted(address indexed voterAddress, uint256 indexed electionId, AccessLevel grantedLevel);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin can perform this action");
        _;
    }

    modifier onlyAdminWithLevel(AccessLevel _level) {
        require((admins[msg.sender] && adminLevels[msg.sender] >= _level) || msg.sender == owner, "Insufficient admin privileges");
        _;
    }

    modifier voterRegistered() {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        _;
    }

    modifier partyRegistered(address _partyAddress) {
        require(parties[_partyAddress].isRegistered, "Party not registered");
        _;
    }

    modifier candidateRegistered(address _candidateAddress) {
        require(candidates[_candidateAddress].isRegistered, "Candidate not registered");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        Election storage election = elections[_electionId];
        require(election.status == VotingStatus.Active, "Election is not active");
        require(block.timestamp >= election.startTime && block.timestamp <= election.endTime, "Voting period has ended");
        _;
    }

    modifier notVoted(uint256 _electionId) {
        require(!hasVotedInElection[_electionId][msg.sender], "Already voted in this election");
        _;
    }

    modifier validAccess(uint256 _electionId) {
        require(voterAccessPerElection[_electionId][msg.sender] >= AccessLevel.Voter, "No access to this election");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
        adminLevels[msg.sender] = AccessLevel.Admin;
    }

    // ====================================================================
    // CORE FUNCTIONS (Essential ones for deployment)
    // ====================================================================

    function createElection(
        string calldata _name,
        string calldata _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAdmin whenNotPaused {
        require(_startTime < _endTime, "Invalid election times");
        require(_endTime > block.timestamp, "End time must be in future");
        require(bytes(_name).length > 0, "Name cannot be empty");

        electionCount++;
        elections[electionCount] = Election({
            electionId: electionCount,
            name: _name,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            status: VotingStatus.Pending,
            isApproved: false,
            totalVotes: 0,
            totalParties: 0,
            totalCandidates: 0,
            createdAt: block.timestamp,
            approvedAt: 0
        });

        emit ElectionCreated(electionCount, _name);
    }

    function approveElection(uint256 _electionId) external onlyAdmin whenNotPaused electionExists(_electionId) {
        Election storage election = elections[_electionId];
        require(!election.isApproved, "Election already approved");
        require(election.status == VotingStatus.Pending, "Invalid election status");

        election.isApproved = true;
        election.status = VotingStatus.Active;
        election.approvedAt = block.timestamp;

        emit ElectionApproved(_electionId, msg.sender);
        emit ElectionStatusChanged(_electionId, VotingStatus.Active);
    }

    function registerParty(
        string calldata _name,
        string calldata _symbol,
        address _representative
    ) external onlyAdmin whenNotPaused {
        require(_representative != address(0), "Invalid representative address");
        require(!parties[_representative].isRegistered, "Party already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");

        parties[_representative] = Party({
            partyAddress: _representative,
            name: _name,
            symbol: _symbol,
            representative: _representative,
            isRegistered: true,
            voteCount: 0,
            memberCount: 0,
            registrationTimestamp: block.timestamp
        });

        registeredParties.push(_representative);
        emit PartyRegistered(_representative, _name);
    }

    function registerCandidate(
        address _candidateAddress,
        string calldata _name,
        string calldata _position,
        address _partyAddress,
        uint256 _electionId
    ) external onlyAdmin whenNotPaused partyRegistered(_partyAddress) electionExists(_electionId) {
        require(_candidateAddress != address(0), "Invalid candidate address");
        require(!candidates[_candidateAddress].isRegistered, "Candidate already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(isPartyInElection[_electionId][_partyAddress], "Party not in election");

        candidates[_candidateAddress] = Candidate({
            candidateAddress: _candidateAddress,
            partyId: uint256(uint160(_partyAddress)),
            name: _name,
            position: _position,
            isRegistered: true,
            voteCount: 0,
            registrationTimestamp: block.timestamp
        });

        partyCandidates[_partyAddress].push(_candidateAddress);
        parties[_partyAddress].memberCount++;
        registeredCandidates.push(_candidateAddress);

        electionCandidates[_electionId].push(_candidateAddress);
        isCandidateInElection[_electionId][_candidateAddress] = true;
        elections[_electionId].totalCandidates++;

        emit CandidateRegistered(_candidateAddress, _name, _partyAddress);
    }

    function registerVoter(string calldata _email) external whenNotPaused {
        require(!voters[msg.sender].isRegistered, "Voter already registered");
        require(bytes(_email).length > 0, "Email cannot be empty");

        voters[msg.sender] = Voter({
            voterAddress: msg.sender,
            email: _email,
            isRegistered: true,
            hasVoted: false,
            votedElectionId: 0,
            votedCandidateId: 0,
            votedPartyId: 0,
            transactionHash: "",
            votedAt: 0,
            registrationTimestamp: block.timestamp
        });

        registeredVoters.push(msg.sender);
        emit VoterRegistered(msg.sender, _email);
    }

    function requestVoterAccess(uint256 _electionId, AccessLevel _accessLevel) external voterRegistered whenNotPaused electionExists(_electionId) {
        require(_accessLevel != AccessLevel.None, "Invalid access level");
        require(voterAccessPerElection[_electionId][msg.sender] == AccessLevel.None, "Already has access");

        voterAccessRequestCount++;
        voterAccessRequests[voterAccessRequestCount] = VoterAccessRequest({
            requestId: voterAccessRequestCount,
            voterAddress: msg.sender,
            electionId: _electionId,
            requestedLevel: _accessLevel,
            isApproved: false,
            isProcessed: false,
            requestTimestamp: block.timestamp,
            approvedBy: address(0)
        });

        voterAccessRequestIds[msg.sender].push(voterAccessRequestCount);
        electionVoters[_electionId].push(msg.sender);
    }

    function approveVoterAccess(uint256 _requestId) external onlyAdmin whenNotPaused {
        require(_requestId > 0 && _requestId <= voterAccessRequestCount, "Invalid request ID");
        VoterAccessRequest storage request = voterAccessRequests[_requestId];
        require(!request.isProcessed, "Request already processed");

        voterAccessPerElection[request.electionId][request.voterAddress] = request.requestedLevel;
        request.isApproved = true;
        request.isProcessed = true;
        request.approvedBy = msg.sender;

        emit VoterAccessGranted(request.voterAddress, request.electionId, request.requestedLevel);
    }

    function castVote(
        uint256 _electionId,
        address _candidateAddress,
        string calldata _transactionHash
    ) external voterRegistered whenNotPaused electionExists(_electionId) electionActive(_electionId) validAccess(_electionId) notVoted(_electionId) candidateRegistered(_candidateAddress) nonReentrant {
        require(isCandidateInElection[_electionId][_candidateAddress], "Candidate not in election");

        Candidate storage candidate = candidates[_candidateAddress];
        address partyAddress = address(uint160(candidate.partyId));

        candidateVotesInElection[_electionId][_candidateAddress]++;
        partyVotesInElection[_electionId][partyAddress]++;
        candidate.voteCount++;
        parties[partyAddress].voteCount++;
        elections[_electionId].totalVotes++;

        hasVotedInElection[_electionId][msg.sender] = true;

        Voter storage voter = voters[msg.sender];
        voter.hasVoted = true;
        voter.votedElectionId = _electionId;
        voter.votedCandidateId = uint256(uint160(_candidateAddress));
        voter.votedPartyId = candidate.partyId;
        voter.transactionHash = _transactionHash;
        voter.votedAt = block.timestamp;

        emit VoteCasted(msg.sender, _electionId, _candidateAddress);
    }

    // ====================================================================
    // VIEW FUNCTIONS (Essential ones)
    // ====================================================================

    function getElection(uint256 _electionId) external view electionExists(_electionId) returns (Election memory) {
        return elections[_electionId];
    }

    function getParty(address _partyAddress) external view partyRegistered(_partyAddress) returns (Party memory) {
        return parties[_partyAddress];
    }

    function getCandidate(address _candidateAddress) external view candidateRegistered(_candidateAddress) returns (Candidate memory) {
        return candidates[_candidateAddress];
    }

    function getVoter(address _voterAddress) external view returns (Voter memory) {
        return voters[_voterAddress];
    }

    function getElectionResults(uint256 _electionId) external view electionExists(_electionId) onlyAdminWithLevel(AccessLevel.Observer) returns (uint256 totalVotes, address[] memory candidateAddresses, uint256[] memory votesCounts) {
        Election storage election = elections[_electionId];
        uint256 len = electionCandidates[_electionId].length;

        candidateAddresses = new address[](len);
        votesCounts = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            address candidateAddr = electionCandidates[_electionId][i];
            candidateAddresses[i] = candidateAddr;
            votesCounts[i] = candidateVotesInElection[_electionId][candidateAddr];
        }

        totalVotes = election.totalVotes;
    }

    function getActiveElections() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= electionCount; i++) {
            if (elections[i].status == VotingStatus.Active && block.timestamp >= elections[i].startTime && block.timestamp <= elections[i].endTime) {
                count++;
            }
        }
        
        uint256[] memory activeElections = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= electionCount; i++) {
            if (elections[i].status == VotingStatus.Active && block.timestamp >= elections[i].startTime && block.timestamp <= elections[i].endTime) {
                activeElections[index] = i;
                index++;
            }
        }
        
        return activeElections;
    }

    function getTotalElections() external view returns (uint256) {
        return electionCount;
    }

    function getTotalParties() external view returns (uint256) {
        return registeredParties.length;
    }

    function getTotalCandidates() external view returns (uint256) {
        return registeredCandidates.length;
    }

    function getTotalVoters() external view returns (uint256) {
        return registeredVoters.length;
    }
}