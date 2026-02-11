import 'babel-polyfill';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../../index';
import mochaAsync from '../../lib/mocha-async';
import credentials from '../../data/credentials.json';
import responseCodes from '../../data/response-codes.json';
import auth from '../../http-requests/lib/authorization';
import Project from '../../models/project';
import i18nUtil from '../../../utils/i18n.util';

import payload from '../../http-requests/lib/payloads';
import {getErrorResponseByKey,getErroResponseByErrorMessage,successResponseByEntity} from '../../common.reponse'
import {generateMatchingString,generateMinLengthString,generateMaxLengthString,generateRandomNumberString,generateRandomAlphabets} from '../../string.generator'
const project = new Project(credentials.validProject);
chai.config.includeStack = true;


describe("## CREATE AN Project", () => {
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

  it('Project Forgot Password :: SHOULD GET MAIL SENT SUCCESSFULLY', (done) => {
    const loginPostBody = payload.getPostLogin(project);
    console.log("LOGIN POST BODY::",loginPostBody);
    request(app)
      .post(`/api/auth/forgotPassword?email=test1@yopmail.com`)
      .send({entityType: "project"})
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        console.log("RES",res.body);
        expect(res.body).to.deep.equal(
          successResponseByEntity("mailSent")
        );
        done();
      })
      .catch(done);
  });

  it('Project Forgot Password :: SHOULD GET EMAIL ALREADY SENT', (done) => {
    request(app)
      .post(`/api/auth/forgotPassword?email=test1@yopmail.com`)
      .send({entityType: "project"})
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        console.log("RES",res.body);
        expect(res.body).to.deep.equal(
          getErrorResponseByKey("emailAlreadySent")
        );
        done();
      })
      .catch(done);
  });

  it('Project login ::SHOULD GET EMAIL NOT EXIST', (done) => {
    const loginPostBody = payload.getPostLogin(project);
    request(app)
      .post(`/api/auth/forgotPassword?email=${generateRandomAlphabets()}@yopmail.com`)
      .send({...loginPostBody, email:undefined ,password:undefined})
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        console.log("RES",res.body);
        expect(res.body).to.deep.equal(
          getErrorResponseByKey("emailNotExist")
        );
        done();
      })
      .catch(done);
  });

  it('Project login :: SHOULD GET INVALID LOGIN TYPE', (done) => {
    const loginPostBody = payload.getPostLogin(project);
    request(app)
      .post(`/api/auth/forgotPassword?email=${loginPostBody.email}`)
      .send({...loginPostBody, email:undefined ,password:undefined ,entityType: generateRandomAlphabets()})
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        expect(res.body).to.deep.equal(
          getErrorResponseByKey("invalidLoginType")
        );
        done();
      })
      .catch(done);
  });

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

