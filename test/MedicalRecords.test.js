const MedicalRecords = artifacts.require("MedicalRecords");

contract("MedicalRecords", accounts => {
  // Hardcoded accounts from Ganache
  const doctor1 = accounts[0]; // Will be our first registered doctor (record owner)
  const doctor2 = accounts[1]; // Another registered doctor
  const nonRegistered = accounts[2]; // This account remains non-registered for testing

  it("should register a doctor", async () => {
    const instance = await MedicalRecords.deployed();
    // Register doctor1
    const result = await instance.registerDoctor("Dr. Alice", { from: doctor1 });
    
    // Verify registration by checking state variable
    const isRegistered = await instance.isRegisteredDoctor(doctor1);
    assert.equal(isRegistered, true, "Doctor1 should be registered");
    
    // Check that the event was emitted
    const event = result.logs[0];
    assert.equal(event.event, "DoctorRegistered", "DoctorRegistered event should be emitted");
    assert.equal(event.args.doctorAddress, doctor1, "The event should record doctor1's address");
    assert.equal(event.args.doctorName, "Dr. Alice", "The event should record the doctor's name");
  });

  it("should not allow re-registration", async () => {
    const instance = await MedicalRecords.deployed();
    try {
      // Attempt to register doctor1 again
      await instance.registerDoctor("Dr. Alice", { from: doctor1 });
      assert.fail("Re-registration should fail");
    } catch (error) {
      assert.include(error.message, "Doctor already registered", "Expected error message for re-registration");
    }
  });

  it("should allow a registered doctor to upload a medical record", async () => {
    const instance = await MedicalRecords.deployed();
    const fileHash = "0x123456789abcdef"; // Example SHA-256 hash
    const cloudUrl = "https://cloudstorage.example.com/report.pdf";
    
    // Doctor1 uploads a record
    const result = await instance.uploadMedicalRecord(fileHash, cloudUrl, { from: doctor1 });
    
    // Check that the MedicalRecordUploaded event is emitted
    const event = result.logs[0];
    assert.equal(event.event, "MedicalRecordUploaded", "MedicalRecordUploaded event should be emitted");
    const recordId = event.args.recordId.toNumber();
    
    // Verify the stored record
    const record = await instance.getMedicalRecord(recordId, { from: doctor1 });
    assert.equal(record.fileHash, fileHash, "The file hash should match");
    assert.equal(record.cloudUrl, cloudUrl, "The cloud URL should match");
  });

  it("should not allow a non-registered doctor to upload a medical record", async () => {
    const instance = await MedicalRecords.deployed();
    const fileHash = "0xabcdef123456789";
    const cloudUrl = "https://cloudstorage.example.com/report2.pdf";
    try {
      // Non-registered doctor attempts to upload a record
      await instance.uploadMedicalRecord(fileHash, cloudUrl, { from: nonRegistered });
      assert.fail("Non-registered doctor should not be able to upload a record");
    } catch (error) {
      assert.include(error.message, "Only registered doctors", "Expected error for non-registered doctor upload");
    }
  });

  it("should allow doctor2 to request access to doctor1's record", async () => {
    const instance = await MedicalRecords.deployed();
    
    // First, register doctor2
    await instance.registerDoctor("Dr. Bob", { from: doctor2 });
    
    // Doctor2 requests access for record with recordId 1 (created earlier by doctor1)
    const result = await instance.requestAccess(1, { from: doctor2 });
    
    // Check the AccessRequested event
    const event = result.logs[0];
    assert.equal(event.event, "AccessRequested", "AccessRequested event should be emitted");
    assert.equal(event.args.recordId.toNumber(), 1, "Record id should be 1");
    assert.equal(event.args.requester, doctor2, "Requester should be doctor2");
  });

  it("should allow doctor1 to grant access to doctor2", async () => {
    const instance = await MedicalRecords.deployed();
    
    // Doctor1 (owner of record 1) grants access to doctor2
    const result = await instance.grantAccess(1, doctor2, { from: doctor1 });
    
    // Check the AccessGranted event
    const event = result.logs[0];
    assert.equal(event.event, "AccessGranted", "AccessGranted event should be emitted");
    assert.equal(event.args.recordId.toNumber(), 1, "Record id should be 1");
    assert.equal(event.args.grantedTo, doctor2, "Access should be granted to doctor2");
    
    // Verify that doctor2 can now view the record
    const record = await instance.getMedicalRecord(1, { from: doctor2 });
    assert.equal(record.fileHash, "0x123456789abcdef", "Doctor2 should now have access to the record");
  });

  it("should allow doctor1 to revoke access from doctor2", async () => {
    const instance = await MedicalRecords.deployed();
    
    // Doctor1 revokes access for doctor2 from record 1
    const result = await instance.revokeAccess(1, doctor2, { from: doctor1 });
    
    // Check the AccessRevoked event
    const event = result.logs[0];
    assert.equal(event.event, "AccessRevoked", "AccessRevoked event should be emitted");
    assert.equal(event.args.recordId.toNumber(), 1, "Record id should be 1");
    assert.equal(event.args.revokedFrom, doctor2, "Access should be revoked from doctor2");
    
    // Ensure that doctor2 can no longer access the record
    try {
      await instance.getMedicalRecord(1, { from: doctor2 });
      assert.fail("Doctor2 should not have access after revocation");
    } catch (error) {
      assert.include(error.message, "Access not granted", "Expected error when accessing revoked record");
    }
  });
});