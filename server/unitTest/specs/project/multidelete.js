import 'babel-polyfill';
import request from 'supertest-as-promised';
import chaiAsPromised from 'chai-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../../index';

import auth from '../../http-requests/lib/authorization';
import mochaAsync from '../../lib/mocha-async';

// load credentials
import credentials from '../../data/credentials.json';
import responseCodes from '../../data/response-codes.json';

import i18nUtil from '../../../utils/i18n.util';

// load payload module
import payload from '../../http-requests/lib/payloads/';
import Project from '../../models/project';
import Employee from '../../models/employee';
const authEmployee = new Employee(credentials.validEmployee);
const project = new Project();
const createpostBody = payload.getPostBody(project);

import projectsModel from '../../../models/project.model';

import {getErrorResponseByKey,getErroResponseByErrorMessage} from '../../common.reponse'
import {generateMatchingString,generateMinLengthString,generateMaxLengthString,generateRandomNumberString,generateRandomAlphabets} from '../../string.generator'

// inject promise to mocha
chai.config.includeStack = true;
chai.use(chaiAsPromised);describe("## Check project creation", () => {
  beforeEach(
    mochaAsync(async () => {
      // login project and get access token
      await auth.getAccessToken(authEmployee);
    })
  );

  it("## CREATE project", (done) => {
    request(app)
      .post("/api/projects")
      .send({ ...createpostBody })
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
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

  it("## Check project Multidelete", (done) => {
    request(app)
      .post("/api/projects/multiDelete")
      .send({ selectedIds: [project.getId()] })
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "projectDelete";
        expect(res.body.respCode).to.equal(responseCodes.delete);
        project.setId(res.body.projectId);
        done();
      })
      .catch(done);
  });
});
describe("## TEST WITHOUT PASSING TOKEN", () => {
  beforeEach(
    mochaAsync(async () => {
      // login project and get access token
      await auth.getAccessToken(authEmployee);
    })
  );

  it("WITHOUT TOKEN PASSED", (done) => {
    request(app)
      .post("/api/projects")
      .send(createpostBody)
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "projectCreate";
        expect(res.body).to.deep.equal(
          getErrorResponseByKey("noPermissionErr")
        );
        done();
      })
      .catch(done);
  });
});
