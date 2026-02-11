import 'babel-polyfill';
import request from 'supertest-as-promised';
import mochaAsync from '../../lib/mocha-async';
import httpStatus from 'http-status';
import chaiAsPromised from 'chai-as-promised';
import chai, { expect } from 'chai';
import app from '../../../index';
import auth from '../../http-requests/lib/authorization';

import credentials from '../../data/credentials.json';
import responseCodes from '../../data/response-codes.json';

import Project from '../../models/project';
import i18nUtil from '../../../utils/i18n.util';

import payload from '../../http-requests/lib/payloads';
import {getErrorResponseByKey,getErroResponseByErrorMessage,successResponseByEntity} from '../../common.reponse'
import {generateMatchingString,generateMinLengthString,generateMaxLengthString,generateRandomNumberString,generateRandomAlphabets} from '../../string.generator'
const project = new Project(credentials.validProject);
chai.config.includeStack = true;

const changePasswordBody={
    "entityType":"project",
    "currentPassword":"Test1234$",
    "newPassword":"TestChanged1234$",
    "confirmPassword":"TestChanged1234$"
}

const newPasswordNotProvided ={
    errors: [
      {
        msg: 'please provide newPassword in body',
        param: 'newPassword',
        location: 'body'
      }
    ]
  }
  

chai.use(chaiAsPromised);describe("## Check project creation", () => {
    beforeEach(
      mochaAsync(async () => {
        await auth.getAccessToken(project);
      })
    );
  
    it("## Check project creation", (done) => {
      request(app)
        .post("/api/projects")
        .send({ ...{name:"Test", email: "test1@yopmail.com", password:"Test1234$"} })
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          req.i18nKey = "projectCreate";
          expect(res.body).to.have.property("projectId");
          expect(res.body.respCode).to.equal(responseCodes.create);
          project.setId(res.body.projectId);
          done();
        })
        .catch(done);
    });
});


describe('## INVALID LOGIN TYPE', () => {
    it('Project ChangePassword :: SHOULD GET INVALID LOGIN TYPE', (done) => {
      request(app)
        .post(`/api/auth/changePassword?_id=${project.getId()}`)
        .send({...changePasswordBody, entityType : generateRandomAlphabets()})
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("invalidLoginType")
          );
          done();
        })
        .catch(done);
    });
});

describe('## DETAILS NOT FOUND', () => {
    it('Project ChangePassword :: SHOULD GET DETAILS NOT FOUND', (done) => {
      request(app)
        .post(`/api/auth/changePassword?adminReset=true&&_id=${project.getId()+123}`)
        .send({...changePasswordBody})
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("detailsNotFound")
          );
          done();
        })
        .catch(done);
    });
});

describe('## UPDATING SAME PASSWORD', () => {
    it('Project ChangePassword :: SHOULD GET CURRENT PASSWORD IS SAME AS OLD PASSWORD', (done) => {
      request(app)
        .post(`/api/auth/changePassword?adminReset=true&&_id=${project.getId()}`)
        .send({...changePasswordBody,newPassword:"Test1234$"})
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("currentOldSameMsg")
          );
          done();
        })
        .catch(done);
    });
});

describe('## NEW PASSWORD AND CONFIRM PASSWORDS ARE NOT MATCHED', () => {
    it('Project ChangePassword :: SHOULD GET New password and confirm password not matched.', (done) => {
      request(app)
        .post(`/api/auth/changePassword?adminReset=true&&_id=${project.getId()}`)
        .send({...changePasswordBody,confirmPassword:"fake"})
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("passwordsNotMatched")
          );
          done();
        })
        .catch(done);
    });
});

describe('## CURRENT PASSWORD IS INCORRECT', () => {
    it('Project ChangePassword :: SHOULD GET CURRENT PASSWORD IS INCORRECT', (done) => {
      request(app)
        .post(`/api/auth/changePassword?adminReset=true&&_id=${project.getId()}`)
        .send({...changePasswordBody,currentPassword:"fake"})
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("currentPasswordError")
          );
          done();
        })
        .catch(done);
    });
});

describe('## NEW PASSWORD IS REQUIRED', () => {
    it('Project ChangePassword :: SHOULD GET NEW PASSWORD IS REQUIRED', (done) => {
      request(app)
        .post(`/api/auth/changePassword?adminReset=true&&_id=${project.getId()}`)
        .send({...changePasswordBody,newPassword:undefined})
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(newPasswordNotProvided);
          done();
        })
        .catch(done);
    });
});

describe('## CHANGE PASSWORD SUCCESSFULLY', () => {
    it('Project ChangePassword :: SHOULD GET PASSWORD CHANGED SUCCESSFULLY', (done) => {
      request(app)
        .post(`/api/auth/changePassword?adminReset=true&&_id=${project.getId()}`)
        .send({...changePasswordBody})
        .set({ Authorization: `Bearer ${project.getAccessToken()}` })
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          console.log("RES",res.body);
          expect(res.body).to.deep.equal(
            successResponseByEntity("passwordSuccess")
          );
          done();
        })
        .catch(done);
    });
});

describe('## DELETE THE Project', () => {
    it('Project ChangePassword :: DELETE Project', (done) => {
      request(app)
      .delete(`/api/projects/${project.getId()}?response=true`)
      .set({ Authorization: `Bearer ${project.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "projectDelete";
        expect(res.body).to.have.property("projectId");
        expect(res.body.respCode).to.equal(responseCodes.delete);
        done();
      })
      .catch(done);
    });
});