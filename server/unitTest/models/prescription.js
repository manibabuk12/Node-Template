import fake from '../lib/fake';
import serviceUtill from '../../utils/service.util';

function Prescription(options = {}) {var email = options.email || fake.email();
var password = options.password || "User1234$";
var changePassword = options.changePassword || "user@123"
var entityType = options.entityType || "user";
var accessToken = options.accessToken || "";
var newPhone = options.newPhone || fake.phone({ formatted: false });
var newFirstName = options.firstName || fake.name();
var newLastName = options.lastName || fake.name();
var newEmail = options.email || fake.email();
var id = options.employeeId || "";

this.getId = function getId() {
  return id;
};

this.setId = function setId(newId) {
  id = newId;
}

this.getEntityType = function getEntityType() {
  return entityType;
};

this.getNewPhone = function getNewPhone() {
  return newPhone;
};

this.getAccessToken = function getAccessToken() {
  return accessToken;
};

this.getPassword = function getPassword() {
  return password;
};
this.getChangePassword = function getChangePassword() {
  return changePassword
};

this.setAccessToken = function setAccessToken(newAccessToken) {
  accessToken = newAccessToken;
};

var email = options.email || fake.name();
this.getEmail = function getEmail() {
  return email;
};

this.getEnmail = function getEnmail() {
  return serviceUtill.encodeString(email);
};
var prescriptionName = options.prescriptionName || fake.name();
this.getPrescriptionName = function getPrescriptionName() {
  return prescriptionName;
};
var priority = options.priority || fake.name();
this.getPriority = function getPriority() {
  return priority;
};
var status = options.status || fake.name();
this.getStatus = function getStatus() {
  return status;
};
var estimatedTime = options.estimatedTime || fake.name();
this.getEstimatedTime = function getEstimatedTime() {
  return estimatedTime;
};
var workedHours = options.workedHours || fake.name();
this.getWorkedHours = function getWorkedHours() {
  return workedHours;
};
var serialNo = options.serialNo || fake.name();
this.getSerialNo = function getSerialNo() {
  return serialNo;
};
var comment = options.comment || fake.name();
this.getComment = function getComment() {
  return comment;
};
var created = options.created || fake.date();
this.getCreated = function getCreated() {
  return created;
};
var updated = options.updated || fake.date();
this.getUpdated = function getUpdated() {
  return updated;
};

this.getfields = function getfields() { 
return {
prescriptionName,
priority,
status,
estimatedTime,
workedHours,
serialNo,
comment,
created,
updated,
}; }}

export default Prescription;