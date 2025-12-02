// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("HealthCare Contract Tests", function () {
//   let HealthCare;
//   let healthcare;
//   let owner, doctor, patient, other;

//   before(async function () {
//     [owner, doctor, patient, other] = await ethers.getSigners();
//     HealthCare = await ethers.getContractFactory("HealthCare");
//     healthcare = await HealthCare.deploy();
//     await healthcare.deployed();
//   });

//   it("Should set the correct owner", async function () {
//     expect(await healthcare.owner()).to.equal(owner.address);
//   });

//   describe("Doctor Registration", function () {
//     it("Should allow owner to register a doctor", async function () {
//       await expect(healthcare.connect(owner).registerDoctor(doctor.address, "Dr. Smith"))
//         .to.emit(healthcare, "DoctorRegistered")
//         .withArgs(doctor.address, "Dr. Smith");
      
//       const doc = await healthcare.doctors(doctor.address);
//       expect(doc.name).to.equal("Dr. Smith");
//       expect(doc.isRegistered).to.be.true;
//     });

//     it("Should prevent non-owner from registering doctors", async function () {
//       await expect(
//         healthcare.connect(other).registerDoctor(other.address, "Dr. Invalid")
//       ).to.be.revertedWith("Only owner can register doctors");
//     });

//     it("Should prevent duplicate doctor registration", async function () {
//       await expect(
//         healthcare.connect(owner).registerDoctor(doctor.address, "Dr. Smith")
//       ).to.be.revertedWith("Doctor already registered");
//     });
//   });

//   describe("Patient Registration", function () {
//     it("Should allow registered doctor to register patient", async function () {
//       await expect(
//         healthcare.connect(doctor).registerPatient(
//           patient.address,
//           "John Doe",
//           30,
//           "Male"
//         )
//       )
//         .to.emit(healthcare, "PatientRegistered")
//         .withArgs(patient.address, "John Doe");

//       const pat = await healthcare.patients(patient.address);
//       expect(pat.name).to.equal("John Doe");
//       expect(pat.age).to.equal(30);
//       expect(pat.isRegistered).to.be.true;
//     });

//     it("Should prevent non-doctors from registering patients", async function () {
//       await expect(
//         healthcare.connect(other).registerPatient(
//           other.address,
//           "Jane Doe",
//           25,
//           "Female"
//         )
//       ).to.be.revertedWith("Only registered doctors can perform this action");
//     });

//     it("Should prevent duplicate patient registration", async function () {
//       await expect(
//         healthcare.connect(doctor).registerPatient(
//           patient.address,
//           "John Doe",
//           30,
//           "Male"
//         )
//       ).to.be.revertedWith("Patient already registered");
//     });
//   });

//   describe("Sensor Data Management", function () {
//     const testData = JSON.stringify({
//       heartRate: 72,
//       bloodPressure: "120/80",
//       temperature: 98.6
//     });

//     it("Should update sensor data for registered patient", async function () {
//       await expect(healthcare.connect(doctor).updateSensorData(patient.address, testData))
//         .to.emit(healthcare, "SensorDataUpdated")
//         .withArgs(patient.address, testData);

//       const pat = await healthcare.patients(patient.address);
//       expect(pat.sensorData).to.equal(testData);
//     });

//     it("Should prevent updating data for unregistered patients", async function () {
//       await expect(
//         healthcare.connect(doctor).updateSensorData(other.address, testData)
//       ).to.be.revertedWith("Patient is not registered in the blockchain");
//     });
//   });

//   describe("Patient Data Retrieval", function () {
//     it("Should return correct patient details", async function () {
//       const details = await healthcare.getPatientDetails(patient.address);
//       expect(details[0]).to.equal("John Doe"); // name
//       expect(details[1]).to.equal(30); // age
//       expect(details[2]).to.equal("Male"); // gender
//       expect(details[3]).to.include("heartRate"); // sensor data
//     });

//     it("Should revert for unregistered patients", async function () {
//       await expect(
//         healthcare.getPatientDetails(other.address)
//       ).to.be.revertedWith("Patient not found");
//     });
//   });
// });







const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthCare Contract", function () {
  let HealthCare;
  let healthcare;
  let owner, doctor1, doctor2, patient1, patient2, otherAccount;

  before(async function () {
    [owner, doctor1, doctor2, patient1, patient2, otherAccount] = await ethers.getSigners();
    
    HealthCare = await ethers.getContractFactory("HealthCare");
    healthcare = await HealthCare.deploy();
    await healthcare.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await healthcare.owner()).to.equal(owner.address);
    });
  });

  describe("Doctor Registration", function () {
    it("Should allow a doctor to register", async function () {
      await healthcare.connect(doctor1).registerDoctor("Dr. Smith", "dr.smith@example.com");
      
      const isRegistered = await healthcare.isDoctorRegistered(doctor1.address);
      expect(isRegistered).to.be.true;
    });

    it("Should emit DoctorRegistered event", async function () {
      await expect(healthcare.connect(doctor2).registerDoctor("Dr. Johnson", "dr.johnson@example.com"))
        .to.emit(healthcare, "DoctorRegistered")
        .withArgs(doctor2.address, "Dr. Johnson", "dr.johnson@example.com");
    });

    it("Should prevent duplicate doctor registration", async function () {
      await expect(
        healthcare.connect(doctor1).registerDoctor("Dr. Smith", "dr.smith@example.com")
      ).to.be.revertedWith("Doctor already registered");
    });
  });

  describe("Patient Registration", function () {
    it("Should allow a doctor to register a patient", async function () {
      await healthcare.connect(doctor1).registerPatient(
        patient1.address,
        "John Doe",
        30,
        "Male"
      );
      
      const isRegistered = await healthcare.isPatientRegistered(patient1.address);
      expect(isRegistered).to.be.true;
    });

    it("Should emit PatientRegistered event", async function () {
      await expect(
        healthcare.connect(doctor1).registerPatient(
          patient2.address,
          "Jane Smith",
          25,
          "Female"
        )
      ).to.emit(healthcare, "PatientRegistered")
        .withArgs(patient2.address, doctor1.address, "Jane Smith");
    });

    it("Should prevent duplicate patient registration", async function () {
      await expect(
        healthcare.connect(doctor1).registerPatient(
          patient1.address,
          "John Doe",
          30,
          "Male"
        )
      ).to.be.revertedWith("Patient already registered");
    });

    it("Should prevent non-doctors from registering patients", async function () {
      await expect(
        healthcare.connect(otherAccount).registerPatient(
          otherAccount.address,
          "Test Patient",
          40,
          "Male"
        )
      ).to.be.revertedWith("Only registered doctors can perform this action");
    });

    it("Should increment doctor's patient count", async function () {
      const initialCount = (await healthcare.getDoctorDetails(doctor1.address))[2];
      
      await healthcare.connect(doctor1).registerPatient(
        otherAccount.address,
        "Test Patient",
        40,
        "Male"
      );
      
      const newCount = (await healthcare.getDoctorDetails(doctor1.address))[2];
      expect(newCount).to.equal(initialCount + 1);
    });
  });

  describe("Sensor Data Management", function () {
    it("Should allow doctor to update patient sensor data", async function () {
      const testData = "Heart rate: 72bpm, Blood pressure: 120/80";
      await healthcare.connect(doctor1).updateSensorData(patient1.address, testData);
      
      const patientDetails = await healthcare.getPatientDetails(patient1.address);
      expect(patientDetails[3]).to.equal(testData);
    });

    it("Should allow patient to update their own sensor data", async function () {
      const testData = "Heart rate: 75bpm, Blood pressure: 118/78";
      await healthcare.connect(patient1).updateSensorData(patient1.address, testData);
      
      const patientDetails = await healthcare.getPatientDetails(patient1.address);
      expect(patientDetails[3]).to.equal(testData);
    });

    it("Should emit SensorDataUpdated event", async function () {
      const testData = "Heart rate: 80bpm";
      await expect(
        healthcare.connect(doctor1).updateSensorData(patient1.address, testData)
        .to.emit(healthcare, "SensorDataUpdated")
        .withArgs(patient1.address, testData));
    });

    it("Should prevent unauthorized updates to sensor data", async function () {
      await expect(
        healthcare.connect(doctor2).updateSensorData(patient1.address, "Unauthorized data")
      ).to.be.revertedWith("Only doctor or patient can update data");
    });
  });

  describe("Data Retrieval", function () {
    it("Should return correct doctor details", async function () {
      const [name, email, patientCount] = await healthcare.getDoctorDetails(doctor1.address);
      
      expect(name).to.equal("Dr. Smith");
      expect(email).to.equal("dr.smith@example.com");
      expect(patientCount).to.be.gt(0);
    });

    it("Should return correct patient details", async function () {
      const [name, age, gender, sensorData, registeredBy] = await healthcare.getPatientDetails(patient1.address);
      
      expect(name).to.equal("John Doe");
      expect(age).to.equal(30);
      expect(gender).to.equal("Male");
      expect(sensorData).to.not.be.empty;
      expect(registeredBy).to.equal(doctor1.address);
    });

    it("Should return doctor's patient list", async function () {
      const patients = await healthcare.getDoctorPatients(doctor1.address);
      expect(patients).to.include(patient1.address);
      expect(patients).to.include(patient2.address);
    });

    it("Should revert when getting details of unregistered patient", async function () {
      await expect(
        healthcare.getPatientDetails(otherAccount.address)
      ).to.be.revertedWith("Patient not found");
    });

    it("Should revert when getting details of unregistered doctor", async function () {
      await expect(
        healthcare.getDoctorDetails(otherAccount.address)
      ).to.be.revertedWith("Doctor not found");
    });
  });
});