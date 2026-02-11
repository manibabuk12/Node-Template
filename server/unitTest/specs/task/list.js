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
import Task from '../../models/task';
import Employee from '../../models/employee';
const authEmployee = new Employee(credentials.validEmployee);
const task = new Task();
const createpostBody = payload.getPostBody(task);

import tasksModel from '../../../models/task.model';

import {getErrorResponseByKey,getErroResponseByErrorMessage} from '../../common.reponse'
import {generateMatchingString,generateMinLengthString,generateMaxLengthString,generateRandomNumberString,generateRandomAlphabets} from '../../string.generator'

// inject promise to mocha
chai.config.includeStack = true;
chai.use(chaiAsPromised);describe("## Check task creation", () => {
  beforeEach(
    mochaAsync(async () => {
      // login task and get access token
      await auth.getAccessToken(authEmployee);

      let totaltasks = await tasksModel.find({ active: true });
      task.setId(totaltasks.length);
    })
  );

  it("## Should return the list of the tasks", (done) => {
    request(app)
      .get("/api/tasks")
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res) => {
        expect(res.body).to.have.property("tasks");
        expect(res.body.tasks).to.be.an("array");
        expect(res.body.tasks).to.not.have.length(0);
        done();
      })
      .catch(done);
  });

  it("## CHECK TOTAL RECORDS INCASE IF EXPORTTOCSV", (done) => {
    request(app)
      .get("/api/tasks?type=exportToCsv")
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res) => {
        expect(res.body).to.have.property("tasks");
        expect(res.body.tasks).to.be.an("array");
        expect(res.body.tasks).to.not.have.length(0);
        if (task.getId() > 200) expect(res.body.tasks.length).to.equal(200);
        else expect(res.body.tasks.length).to.equal(task.getId());
        done();
      })
      .catch(done);
  });
});
describe("## TEST WITHOUT PASSING TOKEN", () => {
  beforeEach(
    mochaAsync(async () => {
      // login task and get access token
      await auth.getAccessToken(authEmployee);
    })
  );

  it("WITHOUT TOKEN PASSED", (done) => {
    request(app)
      .get("/api/tasks")

      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "taskCreate";
        expect(res.body).to.deep.equal(
          getErrorResponseByKey("noPermissionErr")
        );
        done();
      })
      .catch(done);
  });
});
