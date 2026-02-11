const config = {
  activityConfig: {
    settingsCreate: {
      context: 'SETTINGS',
      contextType: 'CREATE',
      desc: 'Settings created',
      key: '101'
    },
    settingsUpdate: {
      context: 'SETTINGS',
      contextType: 'UPDATE',
      desc: 'Settings updated',
      key: '102'
    },
    settingsDelete: {
      context: 'SETTINGS',
      contextType: 'DELETE',
      desc: 'Settings deleted',
      key: '103'
    },
    employeeCreate: {
      context: 'EMPLOYEE',
      contextType: 'CREATE',
      desc: 'Employee created',
      key: '104'
    },
    employeeUpdate: {
      context: 'EMPLOYEE',
      contextType: 'UPDATE',
      desc: 'Employee Updated',
      key: '105'
    },
    employeeDelete: {
      context: 'EMPLOYEE',
      contextType: 'DELETE',
      desc: 'Employee deleted',
      key: '106'
    },
    employeeLogoutSuccess: {
      context: 'EMPLOYEE',
      contextType: 'LOGOUT',
      desc: 'Employee logout',
      key: '107'
    },
    employeeLoginSuccess: {
      context: 'EMPLOYEE',
      contextType: 'LOGIN',
      desc: 'Employee login',
      key: '108'
    },
    employeeChangePassword: {
      context: 'EMPLOYEE',
      contextType: 'CHANGEPASSWORD',
      desc: 'EMPLOYEE CHANGEPASSWORD',
      key: '109'
    },
    employeeForgotPassword: {
      context: 'EMPLOYEE',
      contextType: 'FORGOTPASSWORD',
      desc: 'EMPLOYEE FORGOTPASSWORD',
      key: '110'
    },
    doctorCreate: {
      context: 'DOCTOR',
      contextType: 'CREATE',
      desc: 'Doctor created',
      key: '111'
    },
    doctorUpdate: {
      context: 'DOCTOR',
      contextType: 'UPDATE',
      desc: 'Doctor Updated',
      key: '112'
    },
    doctorDelete: {
      context: 'DOCTOR',
      contextType: 'DELETE',
      desc: 'Doctor deleted',
      key: '113'
    },
    doctorLogoutSuccess: {
      context: 'DOCTOR',
      contextType: 'LOGOUT',
      desc: 'Doctor logout',
      key: '114'
    },
    doctorLoginSuccess: {
      context: 'DOCTOR',
      contextType: 'LOGIN',
      desc: 'Doctor login',
      key: '115'
    },
    doctorChangePassword: {
      context: 'DOCTOR',
      contextType: 'CHANGEPASSWORD',
      desc: 'Doctor CHANGEPASSWORD',
      key: '116'
    },
    doctorForgotPassword: {
      context: 'DOCTOR',
      contextType: 'FORGOTPASSWORD',
      desc: 'Doctor FORGOTPASSWORD',
      key: '117'
    },
    patientCreate: {
      context: 'PATIENT',
      contextType: 'CREATE',
      desc: 'Patient created',
      key: '118'
    },
    patientUpdate: {
      context: 'PATIENT',
      contextType: 'UPDATE',
      desc: 'Patient Updated',
      key: '119'
    },
    patientDelete: {
      context: 'PATIENT',
      contextType: 'DELETE',
      desc: 'Patient deleted',
      key: '120'
    },
    patientLogoutSuccess: {
      context: 'PATIENT',
      contextType: 'LOGOUT',
      desc: 'Patient logout',
      key: '121'
    },
    patientLoginSuccess: {
      context: 'PATIENT',
      contextType: 'LOGIN',
      desc: 'Patient login',
      key: '122'
    },
    patientChangePassword: {
      context: 'EPATIENTMPLOYEE',
      contextType: 'CHANGEPASSWORD',
      desc: 'Patient CHANGEPASSWORD',
      key: '123'
    },
    patientForgotPassword: {
      context: 'PATIENT',
      contextType: 'FORGOTPASSWORD',
      desc: 'Patient FORGOTPASSWORD',
      key: '124'
    },
    roleCreate: {
      context: 'ROLE',
      contextType: 'CREATE',
      desc: 'Role created',
      key: '125'
    },
    roleUpdate: {
      context: 'ROLE',
      contextType: 'UPDATE',
      desc: 'Role updated',
      key: '126'
    },
    roleDelete: {
      context: 'ROLE',
      contextType: 'DELETE',
      desc: 'Role deleted',
      key: '127'
    },
    templatesCreate: {
      context: 'TEMPLATE',
      contextType: 'CREATE',
      desc: 'Templates created',
      key: '128'
    },
    templatesUpdate: {
      context: 'TEMPLATE',
      contextType: 'UPDATE',
      desc: 'Templates Updated',
      key: '129'
    },
    templatesDelete: {
      context: 'TEMPLATE',
      contextType: 'DELETE',
      desc: 'Templates deleted',
      key: '130'
    },
    otpSent:{
      context:"OTP",
      contextType:"SENT",
      desc:"Send OTP",
      key:"131"
  },
  otpVerificationSuccess:{
      context:"OTP",
      contextType:"VERIFICATION_SUCCESS",
      desc:"Otp Verified Successfully.",
      key:"132"
  },
  otpVerficationFailed:{
      context:"OTP",
      contextType:"VERIFICATION FAILED",
      desc:"INVALID OTP",
      key:"134",
  },
  otpExpires:{
      context:"OTP",
      contextType:"OTP EXPIRES",
      desc:"OTP EXPIRES",
      key:"135"
  },
  failedToSentOtp:{
      context:"OTP",
      contextType:"FAILED TO SENT OTP",
      desc:"FAILED TO SENT OTP",
      key:"136"
  },
  ticketCreate: {
      context: 'TICKET',
      contextType: 'CREATE',
      desc: 'Ticket created',
      key: '137'
    },
  ticketUpdate: {
      context: 'TICKET',
      contextType: 'UPDATE',
      desc: 'Ticket updated',
      key: '138'
    },
  ticketDelete: {
      context: 'TICKET',
      contextType: 'DELETE',
      desc: 'Ticket deleted',
      key: '139'
    },
  
employeeRegister : {
    context: 'EMPLOYEE',
    contextType: 'REGISTER',
    desc: 'Employee Registerd',
    key: '140'
}

,
employeeMultidelete : {
    context: 'EMPLOYEE',
    contextType: 'MULTIDELETE',
    desc: 'Employee Multideleted',
    key: '141'
}

,
employeeGet : {
    context: 'EMPLOYEE',
    contextType: 'GET',
    desc: 'Employee Getd',
    key: '142'
}

,
employeeList : {
    context: 'EMPLOYEE',
    contextType: 'LIST',
    desc: 'Employee Listd',
    key: '143'
}

,
employeeCreate : {
    context: 'EMPLOYEE',
    contextType: 'CREATE',
    desc: 'Employee Created',
    key: '144'
}

,
employeeUpdate : {
    context: 'EMPLOYEE',
    contextType: 'UPDATE',
    desc: 'Employee Updated',
    key: '145'
}

,
employeeDelete : {
    context: 'EMPLOYEE',
    contextType: 'REMOVE',
    desc: 'Employee Removed',
    key: '146'
}

,
employeeLoginSuccess : {
    context: 'EMPLOYEE',
    contextType: 'LOGINSUCCESS',
    desc: 'Employee LoginSuccessd',
    key: '147'
}

,
employeeChangePassword : {
    context: 'EMPLOYEE',
    contextType: 'CHANGEPASSWORD',
    desc: 'Employee ChangePasswordd',
    key: '148'
}

,
employeeForgotPassword : {
    context: 'EMPLOYEE',
    contextType: 'FORGOTPASSWORD',
    desc: 'Employee ForgotPasswordd',
    key: '149'
}

,
employeeLogoutSuccess : {
    context: 'EMPLOYEE',
    contextType: 'LOGOUTSUCCESS',
    desc: 'Employee LogoutSuccessd',
    key: '150'
}

,
employeeRegister : {
    context: 'EMPLOYEE',
    contextType: 'REGISTER',
    desc: 'Employee Registerd',
    key: '151'
}

,
doctorRegister : {
    context: 'DOCTOR',
    contextType: 'REGISTER',
    desc: 'Doctor Registerd',
    key: '152'
}

,
doctorMultidelete : {
    context: 'DOCTOR',
    contextType: 'MULTIDELETE',
    desc: 'Doctor Multideleted',
    key: '153'
}

,
doctorGet : {
    context: 'DOCTOR',
    contextType: 'GET',
    desc: 'Doctor Getd',
    key: '154'
}

,
doctorList : {
    context: 'DOCTOR',
    contextType: 'LIST',
    desc: 'Doctor Listd',
    key: '155'
}

,
doctorCreate : {
    context: 'DOCTOR',
    contextType: 'CREATE',
    desc: 'Doctor Created',
    key: '156'
}

,
doctorUpdate : {
    context: 'DOCTOR',
    contextType: 'UPDATE',
    desc: 'Doctor Updated',
    key: '157'
}

,
doctorDelete : {
    context: 'DOCTOR',
    contextType: 'REMOVE',
    desc: 'Doctor Removed',
    key: '158'
}

,
doctorLoginSuccess : {
    context: 'DOCTOR',
    contextType: 'LOGINSUCCESS',
    desc: 'Doctor LoginSuccessd',
    key: '159'
}

,
doctorChangePassword : {
    context: 'DOCTOR',
    contextType: 'CHANGEPASSWORD',
    desc: 'Doctor ChangePasswordd',
    key: '160'
}

,
doctorForgotPassword : {
    context: 'DOCTOR',
    contextType: 'FORGOTPASSWORD',
    desc: 'Doctor ForgotPasswordd',
    key: '161'
}

,
doctorLogoutSuccess : {
    context: 'DOCTOR',
    contextType: 'LOGOUTSUCCESS',
    desc: 'Doctor LogoutSuccessd',
    key: '162'
}

,
doctorRegister : {
    context: 'DOCTOR',
    contextType: 'REGISTER',
    desc: 'Doctor Registerd',
    key: '163'
}

,

patientRegister : {
    context: 'PATIENT',
    contextType: 'REGISTER',
    desc: 'Patient Registerd',
    key: '164'
}

,
patientMultidelete : {
    context: 'PATIENT',
    contextType: 'MULTIDELETE',
    desc: 'Patient Multideleted',
    key: '165'
}

,
patientGet : {
    context: 'PATIENT',
    contextType: 'GET',
    desc: 'Patient Getd',
    key: '166'
}

,
patientList : {
    context: 'PATIENT',
    contextType: 'LIST',
    desc: 'Patient Listd',
    key: '167'
}

,
patientCreate : {
    context: 'PATIENT',
    contextType: 'CREATE',
    desc: 'Patient Created',
    key: '168'
}

,
patientUpdate : {
    context: 'PATIENT',
    contextType: 'UPDATE',
    desc: 'Patient Updated',
    key: '169'
}

,
patientDelete : {
    context: 'PATIENT',
    contextType: 'REMOVE',
    desc: 'Patient Removed',
    key: '170'
}

,
patientLoginSuccess : {
    context: 'PATIENT',
    contextType: 'LOGINSUCCESS',
    desc: 'Patient LoginSuccessd',
    key: '171'
}

,
patientChangePassword : {
    context: 'PATIENT',
    contextType: 'CHANGEPASSWORD',
    desc: 'Patient ChangePasswordd',
    key: '172'
}

,
patientForgotPassword : {
    context: 'PATIENT',
    contextType: 'FORGOTPASSWORD',
    desc: 'Patient ForgotPasswordd',
    key: '173'
}

,
patientLogoutSuccess : {
    context: 'PATIENT',
    contextType: 'LOGOUTSUCCESS',
    desc: 'Patient LogoutSuccessd',
    key: '174'
}

,
patientRegister : {
    context: 'PATIENT',
    contextType: 'REGISTER',
    desc: 'Patient Registerd',
    key: '175'
}

,
projectRegister : {
    context: 'PROJECT',
    contextType: 'REGISTER',
    desc: 'Project Registerd',
    key: '176'
}

,
projectMultidelete : {
    context: 'PROJECT',
    contextType: 'MULTIDELETE',
    desc: 'Project Multideleted',
    key: '177'
}

,
projectGet : {
    context: 'PROJECT',
    contextType: 'GET',
    desc: 'Project Getd',
    key: '178'
}

,
projectList : {
    context: 'PROJECT',
    contextType: 'LIST',
    desc: 'Project Listd',
    key: '179'
}

,
projectCreate : {
    context: 'PROJECT',
    contextType: 'CREATE',
    desc: 'Project Created',
    key: '180'
}

,
projectUpdate : {
    context: 'PROJECT',
    contextType: 'UPDATE',
    desc: 'Project Updated',
    key: '181'
}

,
projectDelete : {
    context: 'PROJECT',
    contextType: 'REMOVE',
    desc: 'Project Removed',
    key: '182'
}

,
projectLoginSuccess : {
    context: 'PROJECT',
    contextType: 'LOGINSUCCESS',
    desc: 'Project LoginSuccessd',
    key: '183'
}

,
projectChangePassword : {
    context: 'PROJECT',
    contextType: 'CHANGEPASSWORD',
    desc: 'Project ChangePasswordd',
    key: '184'
}

,
projectForgotPassword : {
    context: 'PROJECT',
    contextType: 'FORGOTPASSWORD',
    desc: 'Project ForgotPasswordd',
    key: '185'
}

,
projectLogoutSuccess : {
    context: 'PROJECT',
    contextType: 'LOGOUTSUCCESS',
    desc: 'Project LogoutSuccessd',
    key: '186'
}

,
projectRegister : {
    context: 'PROJECT',
    contextType: 'REGISTER',
    desc: 'Project Registerd',
    key: '187'
}

,
taskMultidelete : {
    context: 'TASK',
    contextType: 'MULTIDELETE',
    desc: 'Task Multideleted',
    key: '188'
}

,
taskGet : {
    context: 'TASK',
    contextType: 'GET',
    desc: 'Task Getd',
    key: '189'
}

,
taskList : {
    context: 'TASK',
    contextType: 'LIST',
    desc: 'Task Listd',
    key: '190'
}

,
taskCreate : {
    context: 'TASK',
    contextType: 'CREATE',
    desc: 'Task Created',
    key: '191'
}

,
taskUpdate : {
    context: 'TASK',
    contextType: 'UPDATE',
    desc: 'Task Updated',
    key: '192'
}

,
taskDelete : {
    context: 'TASK',
    contextType: 'REMOVE',
    desc: 'Task Removed',
    key: '193'
}

,
hospitalMultidelete : {
    context: 'TASK',
    contextType: 'MULTIDELETE',
    desc: 'Task Multideleted',
    key: '194'
}

,
hospitalGet : {
    context: 'TASK',
    contextType: 'GET',
    desc: 'Task Getd',
    key: '195'
}

,
hospitalList : {
    context: 'TASK',
    contextType: 'LIST',
    desc: 'Task Listd',
    key: '196'
}

,
hospitalCreate : {
    context: 'TASK',
    contextType: 'CREATE',
    desc: 'Task Created',
    key: '197'
}

,
hospitalUpdate : {
    context: 'TASK',
    contextType: 'UPDATE',
    desc: 'Task Updated',
    key: '198'
}

,
hospitalDelete : {
    context: 'TASK',
    contextType: 'REMOVE',
    desc: 'Task Removed',
    key: '199'
}

,

prescriptionMultidelete : {
    context: 'PRESCRIPTION',
    contextType: 'MULTIDELETE',
    desc: 'Prescription Multideleted',
    key: '200'
}

,
prescriptionGet : {
    context: 'PRESCRIPTION',
    contextType: 'GET',
    desc: 'Prescription Getd',
    key: '201'
}

,
prescriptionList : {
    context: 'PRESCRIPTION',
    contextType: 'LIST',
    desc: 'Prescription Listd',
    key: '202'
}

,
prescriptionCreate : {
    context: 'PRESCRIPTION',
    contextType: 'CREATE',
    desc: 'Prescription Created',
    key: '203'
}

,
prescriptionUpdate : {
    context: 'PRESCRIPTION',
    contextType: 'UPDATE',
    desc: 'Prescription Updated',
    key: '204'
}

,
prescriptionDelete : {
    context: 'PRESCRIPTION',
    contextType: 'REMOVE',
    desc: 'Prescription Removed',
    key: '205'
}

,
reportMultidelete : {
    context: 'REPORT',
    contextType: 'MULTIDELETE',
    desc: 'Report Multideleted',
    key: '206'
}

,
reportGet : {
    context: 'REPORT',
    contextType: 'GET',
    desc: 'Report Getd',
    key: '207'
}

,
reportList : {
    context: 'REPORT',
    contextType: 'LIST',
    desc: 'Report Listd',
    key: '208'
}

,
reportCreate : {
    context: 'REPORT',
    contextType: 'CREATE',
    desc: 'Report Created',
    key: '209'
}

,
reportUpdate : {
    context: 'REPORT',
    contextType: 'UPDATE',
    desc: 'Report Updated',
    key: '210'
}

,
reportDelete : {
    context: 'REPORT',
    contextType: 'REMOVE',
    desc: 'Report Removed',
    key: '211'
}

,
leaveMultidelete : {
    context: 'LEAVE',
    contextType: 'MULTIDELETE',
    desc: 'Leave Multideleted',
    key: '212'
}

,
leaveGet : {
    context: 'LEAVE',
    contextType: 'GET',
    desc: 'Leave Getd',
    key: '213'
}

,
leaveList : {
    context: 'LEAVE',
    contextType: 'LIST',
    desc: 'Leave Listd',
    key: '214'
}

,
leaveCreate : {
    context: 'LEAVE',
    contextType: 'CREATE',
    desc: 'Leave Created',
    key: '215'
}

,
leaveUpdate : {
    context: 'LEAVE',
    contextType: 'UPDATE',
    desc: 'Leave Updated',
    key: '216'
}

,
leaveDelete : {
    context: 'LEAVE',
    contextType: 'REMOVE',
    desc: 'Leave Removed',
    key: '217'
},

agentCreate: {
      context: 'AGENT',
      contextType: 'CREATE',
      desc: 'Agent created',
      key: '218'
    },
agentUpdate: {
      context: 'AGENT',
      contextType: 'UPDATE',
      desc: 'Agent Updated',
      key: '219'
    },
    agentDelete: {
      context: 'AGENT',
      contextType: 'DELETE',
      desc: 'Agent deleted',
      key: '220'
    },
    agentLogoutSuccess: {
      context: 'AGENT',
      contextType: 'LOGOUT',
      desc: 'Agent logout',
      key: '221'
    },
    agentLoginSuccess: {
      context: 'AGENT',
      contextType: 'LOGIN',
      desc: 'Agent login',
      key: '222'
    },
    agentChangePassword: {
      context: 'AGENT',
      contextType: 'CHANGEPASSWORD',
      desc: 'AGENT CHANGEPASSWORD',
      key: '223'
    },
    agentForgotPassword: {
      context: 'AGENT',
      contextType: 'FORGOTPASSWORD',
      desc: 'AGENT FORGOTPASSWORD',
      key: '224'
    },
agentRegister : {
    context: 'AGENT',
    contextType: 'REGISTER',
    desc: 'Agent Registerd',
    key: '225'
}

,
agentMultidelete : {
    context: 'AGENT',
    contextType: 'MULTIDELETE',
    desc: 'Agent Multideleted',
    key: '226'
}

,
agentGet : {
    context: 'AGENT',
    contextType: 'GET',
    desc: 'Agent Getd',
    key: '227'
}

,
agentList : {
    context: 'AGENT',
    contextType: 'LIST',
    desc: 'Agent Listd',
    key: '228'
}

,
agentCreate : {
    context: 'AGENT',
    contextType: 'CREATE',
    desc: 'Agent Created',
    key: '229'
}

,
agentUpdate : {
    context: 'AGENT',
    contextType: 'UPDATE',
    desc: 'Agent Updated',
    key: '230'
}

,
agentDelete : {
    context: 'AGENT',
    contextType: 'REMOVE',
    desc: 'Agent Removed',
    key: '231'
}

,
agentLoginSuccess : {
    context: 'AGENT',
    contextType: 'LOGINSUCCESS',
    desc: 'Agent LoginSuccessd',
    key: '232'
}

,
agentChangePassword : {
    context: 'AGENT',
    contextType: 'CHANGEPASSWORD',
    desc: 'Agent ChangePasswordd',
    key: '233'
}

,
agentForgotPassword : {
    context: 'AGENT',
    contextType: 'FORGOTPASSWORD',
    desc: 'Agent ForgotPasswordd',
    key: '234'
}

,
agentLogoutSuccess : {
    context: 'AGENT',
    contextType: 'LOGOUTSUCCESS',
    desc: 'Agent LogoutSuccessd',
    key: '235'
}

,
agentRegister : {
    context: 'AGENT',
    contextType: 'REGISTER',
    desc: 'Agent Registerd',
    key: '236'
},

partyMultidelete : {
    context: 'PARTY',
    contextType: 'MULTIDELETE',
    desc: 'Party Multideleted',
    key: '237'
}

,
partyGet : {
    context: 'PARTY',
    contextType: 'GET',
    desc: 'Party Getd',
    key: '238'
}

,
partyList : {
    context: 'PARTY',
    contextType: 'LIST',
    desc: 'Party Listd',
    key: '239'
}

,
partyCreate : {
    context: 'PARTY',
    contextType: 'CREATE',
    desc: 'Party Created',
    key: '240'
}

,
partyUpdate : {
    context: 'PARTY',
    contextType: 'UPDATE',
    desc: 'Party Updated',
    key: '241'
}

,
partyDelete : {
    context: 'PARTY',
    contextType: 'REMOVE',
    desc: 'Party Removed',
    key: '242'
},

candidateMultidelete : {
    context: 'CANDIDATE',
    contextType: 'MULTIDELETE',
    desc: 'Candidate Multideleted',
    key: '243'
}

,
candidateGet : {
    context: 'CANDIDATE',
    contextType: 'GET',
    desc: 'Candidate Getd',
    key: '244'
}

,
candidateList : {
    context: 'CANDIDATE',
    contextType: 'LIST',
    desc: 'Candidate Listd',
    key: '245'
}

,
candidateCreate : {
    context: 'CANDIDATE',
    contextType: 'CREATE',
    desc: 'Candidate Created',
    key: '246'
}

,
candidateUpdate : {
    context: 'CANDIDATE',
    contextType: 'UPDATE',
    desc: 'Candidate Updated',
    key: '247'
}

,
candidateDelete : {
    context: 'CANDIDATE',
    contextType: 'REMOVE',
    desc: 'Candidate Removed',
    key: '248'
},

voterMultidelete : {
    context: 'VOTER',
    contextType: 'MULTIDELETE',
    desc: 'Voter Multideleted',
    key: '249'
}

,
voterGet : {
    context: 'VOTER',
    contextType: 'GET',
    desc: 'Voter Getd',
    key: '250'
}

,
voterList : {
    context: 'VOTER',
    contextType: 'LIST',
    desc: 'Voter Listd',
    key: '251'
}

,
voterCreate : {
    context: 'VOTER',
    contextType: 'CREATE',
    desc: 'Voter Created',
    key: '252'
}

,
voterUpdate : {
    context: 'VOTER',
    contextType: 'UPDATE',
    desc: 'Voter Updated',
    key: '253'
}

,
voterDelete : {
    context: 'VOTER',
    contextType: 'REMOVE',
    desc: 'Voter Removed',
    key: '254'
},

electionMultidelete : {
    context: 'ELECTION',
    contextType: 'MULTIDELETE',
    desc: 'Election Multideleted',
    key: '256'
}

,
electionGet : {
    context: 'ELECTION',
    contextType: 'GET',
    desc: 'Election Getd',
    key: '257'
}

,
electionList : {
    context: 'ELECTION',
    contextType: 'LIST',
    desc: 'Election Listd',
    key: '258'
}

,
electionCreate : {
    context: 'ELECTION',
    contextType: 'CREATE',
    desc: 'Election Created',
    key: '259'
}

,
electionUpdate : {
    context: 'ELECTION',
    contextType: 'UPDATE',
    desc: 'Election Updated',
    key: '260'
}

,
electionDelete : {
    context: 'ELECTION',
    contextType: 'REMOVE',
    desc: 'Election Removed',
    key: '261'
},

voteMultidelete : {
    context: 'VOTE',
    contextType: 'MULTIDELETE',
    desc: 'Vote Multideleted',
    key: '262'
}

,
voteGet : {
    context: 'VOTE',
    contextType: 'GET',
    desc: 'Vote Getd',
    key: '263'
}

,
voteList : {
    context: 'VOTE',
    contextType: 'LIST',
    desc: 'Vote Listd',
    key: '264'
}

,
voteCreate : {
    context: 'VOTE',
    contextType: 'CREATE',
    desc: 'Vote Created',
    key: '265'
}

,
voteUpdate : {
    context: 'VOTE',
    contextType: 'UPDATE',
    desc: 'Vote Updated',
    key: '266'
}

,
voteDelete : {
    context: 'VOTE',
    contextType: 'REMOVE',
    desc: 'Vote Removed',
    key: '267'
},

constituencyMultidelete : {
    context: 'CONSTITUENCY',
    contextType: 'MULTIDELETE',
    desc: 'Constituency Multideleted',
    key: '268'
}

,
constituencyGet : {
    context: 'CONSTITUENCY',
    contextType: 'GET',
    desc: 'Constituency Getd',
    key: '269'
}

,
constituencyList : {
    context: 'CONSTITUENCY',
    contextType: 'LIST',
    desc: 'Constituency Listd',
    key: '270'
}

,
constituencyCreate : {
    context: 'CONSTITUENCY',
    contextType: 'CREATE',
    desc: 'Constituency Created',
    key: '271'
}

,
constituencyUpdate : {
    context: 'CONSTITUENCY',
    contextType: 'UPDATE',
    desc: 'Constituency Updated',
    key: '272'
}

,
constituencyDelete : {
    context: 'CONSTITUENCY',
    contextType: 'REMOVE',
    desc: 'Constituency Removed',
    key: '273'
}
  },
};

export default config;
