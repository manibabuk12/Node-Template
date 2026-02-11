import fake from '../lib/fake';
import serviceUtill from '../../utils/service.util';

function Leave(options = {}) {var email = options.email || fake.email();
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
var leaveType = options.leaveType || fake.name();
this.getLeaveType = function getLeaveType() {
  return leaveType;
};
var status = options.status || fake.name();
this.getStatus = function getStatus() {
  return status;
};
var reason = options.reason || fake.name();
this.getReason = function getReason() {
  return reason;
};
var startDate = options.startDate || fake.date();
this.getStartDate = function getStartDate() {
  return startDate;
};
var endDate = options.endDate || fake.date();
this.getEndDate = function getEndDate() {
  return endDate;
};
var numberofDays = options.numberofDays || fake.number();
this.getNumberofDays = function getNumberofDays() {
  return numberofDays;
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
leaveType,
status,
reason,
startDate,
endDate,
numberofDays,
created,
updated,
}; }}

export default Leave;