const mailConfig = {
  mailSettings: {
    adminUrl : 'http://admin.goldenfriday.dosystemsinc.com',
userUrl : 'http://user.goldenfriday.dosystemsinc.com',
serverUrl : 'http://localhost:3194',

    websiteName: 'project',
    mailType: 'smtp',
    activateMails: true,
    from: 'projectname <email>',
    smtpOptions:{
        },
    gmailOptions: {
      service: 'Gmail',
      auth: {
        user: 'email', // Your email id
        pass: 'password' // Your password
      }
    },
    sesEmailSettings: {
      key: 'xxxxxxxxxxxxxx',
      secret: 'xxxxxxxxxxxxxxxxxxxxxx'
    }
  }
};

export default mailConfig;