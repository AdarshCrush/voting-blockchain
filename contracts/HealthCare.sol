// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HealthCare {
    // --------------------------------------------------------------------
    // ENUMS & STRUCTS
    // --------------------------------------------------------------------
    enum Department { Cardiology, Neurology, Oncology, Pediatrics }

    struct Hospital {
        address hospitalAddress;
        string name;
        string physicalAddress;
        string email;
        string phoneNumber;
        bool isRegistered;
        uint doctorCount;
    }

    struct Doctor {
        address doctorAddress;
        string name;
        string email;
        bool isRegistered;
        uint patientCount;
        Department department;
        address hospitalAddress;
    }

    struct Patient {
        address patientAddress;
        address registeredBy;
        string name;
        uint age;
        string gender;
        bool isRegistered;
        string sensorData;
    }

    // Patient transfer structures
    struct TransferRequest {
        address patientAddress;
        address currentDoctor;
        address newDoctor;
        address newHospital;
        bool isApproved;
        bool isProcessed;
        uint256 requestTimestamp;
    }

    // --------------------------------------------------------------------
    // STATE
    // --------------------------------------------------------------------
    address public owner;
    mapping(address => bool) public admins;
    mapping(address => Hospital) public hospitals;
    mapping(address => Doctor)    public doctors;
    mapping(address => Patient)   public patients;
    
    // Hospital doctors tracking
    mapping(address => address[]) public hospitalDoctors;
    mapping(address => address[]) public doctorPatients;
    
    // Cross-department access control
    mapping(address => mapping(address => bool)) public crossDepartmentAccess;
    mapping(address => address[]) public accessRequests;
    mapping(address => mapping(address => bool)) public hasRequestedAccess;

    // Patient transfer tracking
    mapping(uint256 => TransferRequest) public transferRequests;
    mapping(address => uint256[]) public patientTransferRequests;
    uint256 public transferRequestCount;

    // --------------------------------------------------------------------
    // EVENTS
    // --------------------------------------------------------------------
    event HospitalRegistered(address indexed hospitalAddress, string name, string email);
    event HospitalDeregistered(address indexed hospitalAddress);

    event DoctorRegistered(address indexed doctorAddress, string name, string email, Department department, address hospitalAddress);
    event DoctorDeregistered(address indexed doctorAddress);

    event PatientRegistered(address indexed patientAddress, address indexed registeredBy, string name);
    event PatientDeregistered(address indexed patientAddress);

    event SensorDataUpdated(address indexed patientAddress, string sensorData);
    event SensorDataOverridden(address indexed patientAddress, string newSensorData);

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    
    // Cross-department access events
    event AccessRequested(address indexed patientAddress, address indexed requestingDoctor);
    event AccessGranted(address indexed patientAddress, address indexed doctor);
    event AccessRevoked(address indexed patientAddress, address indexed doctor);

    // Transfer events
    event TransferRequested(
        uint256 indexed requestId,
        address indexed patientAddress,
        address indexed currentDoctor,
        address newDoctor,
        address newHospital
    );
    event TransferApproved(uint256 indexed requestId);
    event TransferRejected(uint256 indexed requestId);
    event PatientTransferred(
        address indexed patientAddress,
        address indexed oldDoctor,
        address indexed newDoctor,
        address newHospital
    );

    // --------------------------------------------------------------------
    // MODIFIERS
    // --------------------------------------------------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin can perform this action");
        _;
    }

    modifier onlyDoctor() {
        require(doctors[msg.sender].isRegistered, "Only registered doctors can perform this action");
        _;
    }

    modifier onlyHospitalAdmin() {
        require(hospitals[msg.sender].isRegistered || admins[msg.sender] || msg.sender == owner, "Only hospital admin or system admin can perform this action");
        _;
    }

    // --------------------------------------------------------------------
    // CONSTRUCTOR
    // --------------------------------------------------------------------
    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // --------------------------------------------------------------------
    // ADMIN MANAGEMENT FUNCTIONS (OWNER ONLY)
    // --------------------------------------------------------------------
    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid address");
        require(!admins[_admin], "Already an admin");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(admins[_admin], "Not an admin");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    function isAdmin(address _address) external view returns (bool) {
        return admins[_address] || _address == owner;
    }

    function getAdminBalance(address _admin) external view returns (uint) {
        require(admins[_admin] || _admin == owner, "Not an admin");
        return _admin.balance;
    }

    // --------------------------------------------------------------------
    // HOSPITAL MANAGEMENT FUNCTIONS (ADMIN ONLY)
    // --------------------------------------------------------------------
    function registerHospital(
        address _hospitalAddress,
        string calldata _name,
        string calldata _physicalAddress,
        string calldata _email,
        string calldata _phoneNumber
    )
        external
        onlyAdmin
    {
        require(_hospitalAddress != address(0), "Invalid hospital address");
        require(!hospitals[_hospitalAddress].isRegistered, "Hospital already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        require(msg.sender.balance > 0, "Insufficient balance to register hospital");

        hospitals[_hospitalAddress] = Hospital({
            hospitalAddress: _hospitalAddress,
            name: _name,
            physicalAddress: _physicalAddress,
            email: _email,
            phoneNumber: _phoneNumber,
            isRegistered: true,
            doctorCount: 0
        });
        emit HospitalRegistered(_hospitalAddress, _name, _email);
    }

    function deregisterHospital(address _hospitalAddress) external onlyAdmin {
        require(hospitals[_hospitalAddress].isRegistered, "Hospital not found");
        
        // Deregister all doctors in this hospital (internal cleanup without calling external function)
        address[] memory doctorsList = hospitalDoctors[_hospitalAddress];
        for (uint i = 0; i < doctorsList.length; i++) {
            address doctorAddress = doctorsList[i];
            if (doctors[doctorAddress].isRegistered) {
                // Remove doctor's patients
                address[] memory patientsList = doctorPatients[doctorAddress];
                for (uint j = 0; j < patientsList.length; j++) {
                    delete patients[patientsList[j]];
                    emit PatientDeregistered(patientsList[j]);
                }
                
                // Delete doctor data
                delete doctors[doctorAddress];
                delete doctorPatients[doctorAddress];
                emit DoctorDeregistered(doctorAddress);
            }
        }

        delete hospitals[_hospitalAddress];
        delete hospitalDoctors[_hospitalAddress];
        emit HospitalDeregistered(_hospitalAddress);
    }

    // --------------------------------------------------------------------
    // DOCTOR REGISTRATION FUNCTIONS (ADMIN ONLY)
    // --------------------------------------------------------------------
    function registerDoctor(
        address _doctorAddress,
        string calldata _name,
        string calldata _email,
        Department _department,
        address _hospitalAddress
    )
        external
        onlyAdmin
    {
        require(_doctorAddress != address(0), "Invalid doctor address");
        require(!doctors[_doctorAddress].isRegistered, "Doctor already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        require(hospitals[_hospitalAddress].isRegistered, "Hospital not registered");
        require(msg.sender.balance > 0, "Insufficient balance to register doctor");

        doctors[_doctorAddress] = Doctor({
            doctorAddress: _doctorAddress,
            name: _name,
            email: _email,
            isRegistered: true,
            patientCount: 0,
            department: _department,
            hospitalAddress: _hospitalAddress
        });

        hospitalDoctors[_hospitalAddress].push(_doctorAddress);
        hospitals[_hospitalAddress].doctorCount++;

        emit DoctorRegistered(_doctorAddress, _name, _email, _department, _hospitalAddress);
    }

    function deregisterDoctor(address _doctorAddress) external onlyAdmin {
        require(doctors[_doctorAddress].isRegistered, "Doctor not found");
        address hospitalAddress = doctors[_doctorAddress].hospitalAddress;
        address[] memory patientsList = doctorPatients[_doctorAddress];

        // Remove patients
        for (uint i = 0; i < patientsList.length; i++) {
            delete patients[patientsList[i]];
            emit PatientDeregistered(patientsList[i]);
        }

        // Remove doctor from hospital
        address[] storage hospitalDocs = hospitalDoctors[hospitalAddress];
        for (uint i = 0; i < hospitalDocs.length; i++) {
            if (hospitalDocs[i] == _doctorAddress) {
                hospitalDocs[i] = hospitalDocs[hospitalDocs.length - 1];
                hospitalDocs.pop();
                break;
            }
        }

        if (hospitals[hospitalAddress].doctorCount > 0) {
            hospitals[hospitalAddress].doctorCount--;
        }

        delete doctors[_doctorAddress];
        delete doctorPatients[_doctorAddress];
        emit DoctorDeregistered(_doctorAddress);
    }

    // --------------------------------------------------------------------
    // PATIENT MANAGEMENT
    // --------------------------------------------------------------------
    function registerPatient(
        address _patientAddress,
        string calldata _name,
        uint _age,
        string calldata _gender
    )
        external
        onlyDoctor
    {
        require(!patients[_patientAddress].isRegistered, "Patient already registered");
        require(_patientAddress != address(0), "Invalid patient address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_gender).length > 0, "Gender cannot be empty");

        patients[_patientAddress] = Patient({
            patientAddress: _patientAddress,
            registeredBy: msg.sender,
            name: _name,
            age: _age,
            gender: _gender,
            isRegistered: true,
            sensorData: ""
        });

        doctorPatients[msg.sender].push(_patientAddress);
        doctors[msg.sender].patientCount++;

        emit PatientRegistered(_patientAddress, msg.sender, _name);
    }

    function deregisterPatient(address _patientAddress) external onlyAdmin {
        require(patients[_patientAddress].isRegistered, "Patient not found");
        address doc = patients[_patientAddress].registeredBy;

        address[] storage list = doctorPatients[doc];
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == _patientAddress) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        if (doctors[doc].patientCount > 0) {
            doctors[doc].patientCount--;
        }

        delete patients[_patientAddress];
        emit PatientDeregistered(_patientAddress);
    }

    // --------------------------------------------------------------------
    // PATIENT TRANSFER FUNCTIONS
    // --------------------------------------------------------------------
    function requestPatientTransfer(
        address _patientAddress,
        address _newDoctor,
        address _newHospital
    ) external onlyDoctor {
        require(patients[_patientAddress].isRegistered, "Patient not registered");
        require(doctors[_newDoctor].isRegistered, "New doctor not registered");
        require(hospitals[_newHospital].isRegistered, "New hospital not registered");
        require(patients[_patientAddress].registeredBy == msg.sender, "Only current doctor can transfer patient");
        require(doctors[_newDoctor].hospitalAddress == _newHospital, "Doctor not in specified hospital");

        transferRequestCount++;
        transferRequests[transferRequestCount] = TransferRequest({
            patientAddress: _patientAddress,
            currentDoctor: msg.sender,
            newDoctor: _newDoctor,
            newHospital: _newHospital,
            isApproved: false,
            isProcessed: false,
            requestTimestamp: block.timestamp
        });

        patientTransferRequests[_patientAddress].push(transferRequestCount);

        emit TransferRequested(
            transferRequestCount,
            _patientAddress,
            msg.sender,
            _newDoctor,
            _newHospital
        );
    }

    function approvePatientTransfer(uint256 _requestId) external onlyAdmin {
        require(_requestId > 0 && _requestId <= transferRequestCount, "Invalid request ID");
        TransferRequest storage request = transferRequests[_requestId];
        require(!request.isProcessed, "Request already processed");
        require(patients[request.patientAddress].isRegistered, "Patient no longer registered");
        require(doctors[request.newDoctor].isRegistered, "New doctor no longer registered");

        // Update patient registration
        Patient storage patient = patients[request.patientAddress];
        address oldDoctor = patient.registeredBy;
        patient.registeredBy = request.newDoctor;

        // Update doctor patient lists
        // Remove from old doctor
        address[] storage oldDoctorPatients = doctorPatients[oldDoctor];
        for (uint256 i = 0; i < oldDoctorPatients.length; i++) {
            if (oldDoctorPatients[i] == request.patientAddress) {
                oldDoctorPatients[i] = oldDoctorPatients[oldDoctorPatients.length - 1];
                oldDoctorPatients.pop();
                break;
            }
        }
        doctors[oldDoctor].patientCount--;

        // Add to new doctor
        doctorPatients[request.newDoctor].push(request.patientAddress);
        doctors[request.newDoctor].patientCount++;

        // Mark request as processed
        request.isApproved = true;
        request.isProcessed = true;

        emit TransferApproved(_requestId);
        emit PatientTransferred(
            request.patientAddress,
            oldDoctor,
            request.newDoctor,
            request.newHospital
        );
    }

    function rejectPatientTransfer(uint256 _requestId) external onlyAdmin {
        require(_requestId > 0 && _requestId <= transferRequestCount, "Invalid request ID");
        TransferRequest storage request = transferRequests[_requestId];
        require(!request.isProcessed, "Request already processed");

        request.isApproved = false;
        request.isProcessed = true;

        emit TransferRejected(_requestId);
    }

    function getPatientTransferRequests(address _patientAddress) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return patientTransferRequests[_patientAddress];
    }

    function getTransferRequest(uint256 _requestId)
        external
        view
        returns (
            address patientAddress,
            address currentDoctor,
            address newDoctor,
            address newHospital,
            bool isApproved,
            bool isProcessed,
            uint256 requestTimestamp
        )
    {
        require(_requestId > 0 && _requestId <= transferRequestCount, "Invalid request ID");
        TransferRequest storage request = transferRequests[_requestId];
        return (
            request.patientAddress,
            request.currentDoctor,
            request.newDoctor,
            request.newHospital,
            request.isApproved,
            request.isProcessed,
            request.requestTimestamp
        );
    }

    function getActiveTransferRequests() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active requests
        for (uint256 i = 1; i <= transferRequestCount; i++) {
            if (!transferRequests[i].isProcessed) {
                activeCount++;
            }
        }

        // Create array
        uint256[] memory activeRequests = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= transferRequestCount; i++) {
            if (!transferRequests[i].isProcessed) {
                activeRequests[currentIndex] = i;
                currentIndex++;
            }
        }

        return activeRequests;
    }

    // --------------------------------------------------------------------
    // CROSS-DEPARTMENT ACCESS FUNCTIONS
    // --------------------------------------------------------------------
    function requestPatientAccess(address _patientAddress) external onlyDoctor {
        require(patients[_patientAddress].isRegistered, "Patient not registered");
        address regDoc = patients[_patientAddress].registeredBy;
        require(doctors[msg.sender].department != doctors[regDoc].department, "Same department - no need for access");
        require(!hasRequestedAccess[msg.sender][_patientAddress], "Already requested access");
        
        accessRequests[_patientAddress].push(msg.sender);
        hasRequestedAccess[msg.sender][_patientAddress] = true;
        emit AccessRequested(_patientAddress, msg.sender);
    }

    function grantAccess(address _patientAddress, address _doctorAddress) external onlyAdmin {
        require(patients[_patientAddress].isRegistered, "Patient not registered");
        require(doctors[_doctorAddress].isRegistered, "Doctor not registered");
        
        // Remove from access requests
        address[] storage requests = accessRequests[_patientAddress];
        for (uint i = 0; i < requests.length; i++) {
            if (requests[i] == _doctorAddress) {
                requests[i] = requests[requests.length - 1];
                requests.pop();
                hasRequestedAccess[_doctorAddress][_patientAddress] = false;
                break;
            }
        }
        
        crossDepartmentAccess[_doctorAddress][_patientAddress] = true;
        emit AccessGranted(_patientAddress, _doctorAddress);
    }

    function revokeAccess(address _patientAddress, address _doctorAddress) external onlyAdmin {
        crossDepartmentAccess[_doctorAddress][_patientAddress] = false;
        emit AccessRevoked(_patientAddress, _doctorAddress);
    }

    function getAccessRequests(address _patientAddress) external view returns (address[] memory) {
        require(patients[_patientAddress].isRegistered, "Patient not registered");
        return accessRequests[_patientAddress];
    }

    // --------------------------------------------------------------------
    // SENSOR DATA FUNCTIONS
    // --------------------------------------------------------------------
    function updateSensorData(address _patientAddress, string calldata _sensorData) external {
        require(patients[_patientAddress].isRegistered, "Patient not registered");
        address regDoc = patients[_patientAddress].registeredBy;

        if (msg.sender == _patientAddress || msg.sender == regDoc || crossDepartmentAccess[msg.sender][_patientAddress]) {
            patients[_patientAddress].sensorData = _sensorData;
            emit SensorDataUpdated(_patientAddress, _sensorData);
            return;
        }

        require(
            doctors[msg.sender].isRegistered &&
            doctors[msg.sender].department == doctors[regDoc].department,
            "Access denied: not authorized"
        );
        patients[_patientAddress].sensorData = _sensorData;
        emit SensorDataUpdated(_patientAddress, _sensorData);
    }

    function overrideSensorData(address _patientAddress, string calldata _newSensorData) external onlyAdmin {
        require(patients[_patientAddress].isRegistered, "Patient not registered");
        patients[_patientAddress].sensorData = _newSensorData;
        emit SensorDataOverridden(_patientAddress, _newSensorData);
    }

    // --------------------------------------------------------------------
    // VIEWERSHIP FUNCTIONS
    // --------------------------------------------------------------------
    function getHospitalDoctors(address _hospitalAddress) external view returns (address[] memory) {
        require(hospitals[_hospitalAddress].isRegistered, "Hospital not registered");
        return hospitalDoctors[_hospitalAddress];
    }

    function getDoctorPatients(address _doctorAddress) external view returns (address[] memory) {
        require(doctors[_doctorAddress].isRegistered, "Doctor not registered");
        return doctorPatients[_doctorAddress];
    }

    function isPatientRegistered(address _patientAddress) external view returns (bool) {
        return patients[_patientAddress].isRegistered;
    }

    function getPatientDetails(address _patientAddress)
        external
        view
        returns (
            string memory name,
            uint age,
            string memory gender,
            string memory sensorData,
            address registeredBy
        )
    {
        require(patients[_patientAddress].isRegistered, "Patient not found");
        address regDoc = patients[_patientAddress].registeredBy;

        require(
            msg.sender == _patientAddress ||
            msg.sender == regDoc ||
            (doctors[msg.sender].isRegistered && crossDepartmentAccess[msg.sender][_patientAddress]),
            "Access denied"
        );

        Patient storage p = patients[_patientAddress];
        return (
            p.name,
            p.age,
            p.gender,
            p.sensorData,
            p.registeredBy
        );
    }

    function getDoctorDetails(address _doctorAddress)
        external
        view
        returns (
            string memory name,
            string memory email,
            uint patientCount,
            Department department,
            address hospitalAddress
        )
    {
        require(doctors[_doctorAddress].isRegistered, "Doctor not found");
        Doctor storage d = doctors[_doctorAddress];
        return (
            d.name,
            d.email,
            d.patientCount,
            d.department,
            d.hospitalAddress
        );
    }

    function getHospitalDetails(address _hospitalAddress)
        external
        view
        returns (
            string memory name,
            string memory physicalAddress,
            string memory email,
            string memory phoneNumber,
            uint doctorCount
        )
    {
        require(hospitals[_hospitalAddress].isRegistered, "Hospital not found");
        Hospital storage h = hospitals[_hospitalAddress];
        return (
            h.name,
            h.physicalAddress,
            h.email,
            h.phoneNumber,
            h.doctorCount
        );
    }

    function isHospitalRegistered(address _hospitalAddress) external view returns (bool) {
        return hospitals[_hospitalAddress].isRegistered;
    }

    function isDoctorRegistered(address _doctorAddress) external view returns (bool) {
        return doctors[_doctorAddress].isRegistered;
    }
}