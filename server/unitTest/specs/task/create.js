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
    })
  );

  it("## Check task creation", (done) => {
    request(app)
      .post("/api/tasks")
      .send({ ...createpostBody })
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "taskCreate";
        expect(res.body).to.have.property("taskId");
        expect(res.body.respCode).to.equal(responseCodes.create);
        task.setId(res.body.taskId);
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
      .post("/api/tasks")
      .send(createpostBody)
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
