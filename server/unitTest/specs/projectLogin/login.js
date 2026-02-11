import 'babel-polyfill';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../../index';

import auth from '../../http-requests/lib/authorization';
import chaiAsPromised from 'chai-as-promised';
import mochaAsync from '../../lib/mocha-async';

import credentials from '../../data/credentials.json';
import responseCodes from '../../data/response-codes.json';

import Project from '../../models/project';
import i18nUtil from '../../../utils/i18n.util';

import payload from '../../http-requests/lib/payloads';
import {getErrorResponseByKey,getErroResponseByErrorMessage} from '../../common.reponse'
import {generateMatchingString,generateMinLengthString,generateMaxLengthString,generateRandomNumberString,generateRandomAlphabets} from '../../string.generator'
const project = new Project(credentials.validProject);
chai.config.includeStack = true;

describe('## Check project login', () => {
  it('Project login :: should get valid Bearer token', (done) => {
    const loginPostBody = payload.getPostLogin(project);
    console.log("LOGIN POST BODY::",loginPostBody);
    request(app)
      .post('/api/auth/login')
      .send(loginPostBody)
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        // check access token
        req.i18nKey = 'loginSuccessMessage';
        expect(res.body).to.have.property('respCode');
        expect(res.body.respCode).to.equal(responseCodes.sucess);
        expect(res.body).to.have.property('respMessage');
        expect(res.body.respMessage).to.equal(i18nUtil.getI18nMessage(req.i18nKey));
        expect(res.body).to.have.property('accessToken');
        expect(res.body).to.have.property('refreshToken');
        done();
      })
      .catch(done);
  });
});

describe('##CHECK INVALID LOGIN TYPE', () => {
    it('Project Login :: SHOULD RETURN INVALID LOGIN TYPE', (done) => {
      const loginPostBody = payload.getPostLogin(project);
      console.log("LOGIN POST BODY::",loginPostBody);
      request(app)
        .post('/api/auth/login')
        .send({...loginPostBody,entityType: generateRandomAlphabets()})
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          console.log("RES",res.body);
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("invalidLoginType")
          );
          done();
        })
        .catch(done);
    });
});

describe('## INVALID EMAIL', () => {
    it('Project login ::SHOULD GET EMAIL DOES NOT EXIST', (done) => {
      const loginPostBody = payload.getPostLogin(project);
      request(app)
        .post('/api/auth/login')
        .send({...loginPostBody,email: `${generateRandomAlphabets()}@yopmail.com`})
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("invalidEmail")
          );
          done();
        })
        .catch(done);
    });
});

describe('## INVALID PASSWORD', () => {
    it('Project login ::SHOULD GET INVALID PASSWORD', (done) => {
      const loginPostBody = payload.getPostLogin(project);
      request(app)
        .post('/api/auth/login')
        .send({...loginPostBody,password: `${generateRandomAlphabets()}`})
        .expect(httpStatus.OK)
        .then((res, req = {}) => {
          expect(res.body).to.deep.equal(
            getErrorResponseByKey("invalidPassword")
          );
          done();
        })
        .catch(done);
    });
});

describe("## ROLE PERMISSIONS NOT FOUND", () => {
  beforeEach(
    mochaAsync(async () => {
      await auth.getAccessToken(project);
    })
  );

  it("## CREATE Project WITH NO ROLE", (done) => {
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

  it('Project login ::SHOULD GET ROLE PERMISSIONS NOT FOUND', (done) => {
    request(app)
      .post('/api/auth/login')
      .send({email: "test1@yopmail.com" , password:"Test1234$",entityType:"project"})
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = 'loginSuccessMessage';
        expect(res.body).to.deep.equal(
          getErrorResponseByKey("rolePermissionsNotFound")
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

