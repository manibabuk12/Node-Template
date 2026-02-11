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

      let totalprojects = await projectsModel.find({ active: true });
      project.setId(totalprojects.length);
    })
  );

  it("## Should return the list of the projects", (done) => {
    request(app)
      .get("/api/projects")
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res) => {
        expect(res.body).to.have.property("projects");
        expect(res.body.projects).to.be.an("array");
        expect(res.body.projects).to.not.have.length(0);
        done();
      })
      .catch(done);
  });

  it("## CHECK TOTAL RECORDS INCASE IF EXPORTTOCSV", (done) => {
    request(app)
      .get("/api/projects?type=exportToCsv")
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res) => {
        expect(res.body).to.have.property("projects");
        expect(res.body.projects).to.be.an("array");
        expect(res.body.projects).to.not.have.length(0);
        if (project.getId() > 200)
          expect(res.body.projects.length).to.equal(200);
        else expect(res.body.projects.length).to.equal(project.getId());
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
      .get("/api/projects")

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
