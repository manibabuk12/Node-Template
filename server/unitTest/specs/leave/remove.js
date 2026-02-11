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
import Leave from '../../models/leave';
import Employee from '../../models/employee';
const authEmployee = new Employee(credentials.validEmployee);
const leave = new Leave();
const createpostBody = payload.getPostBody(leave);

import leavesModel from '../../../models/leave.model';

import {getErrorResponseByKey,getErroResponseByErrorMessage} from '../../common.reponse'
import {generateMatchingString,generateMinLengthString,generateMaxLengthString,generateRandomNumberString,generateRandomAlphabets} from '../../string.generator'

// inject promise to mocha
chai.config.includeStack = true;
chai.use(chaiAsPromised);describe("## Check leave creation", () => {
  beforeEach(
    mochaAsync(async () => {
      // login leave and get access token
      await auth.getAccessToken(authEmployee);
    })
  );

  it("## Check leave creation", (done) => {
    request(app)
      .post("/api/leaves")
      .send({ ...createpostBody })
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "leaveCreate";
        expect(res.body).to.have.property("leaveId");
        expect(res.body.respCode).to.equal(responseCodes.create);
        leave.setId(res.body.leaveId);
        done();
      })
      .catch(done);
  });

  it("## Check Passing Wrong ParamsId", (done) => {
    request(app)
      .delete(`/api/leaves/${generateRandomNumberString()}?response=true`)
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "leaveDelete";
        expect(res.body).to.deep.equal(getErrorResponseByKey("idNotFound"));
        done();
      })
      .catch(done);
  });

  it("## Should get sucessfully deleted message", (done) => {
    request(app)
      .delete(`/api/leaves/${leave.getId()}?response=true`)
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "leaveDelete";
        expect(res.body).to.have.property("leaveId");
        expect(res.body.respCode).to.equal(responseCodes.delete);
        done();
      })
      .catch(done);
  });
});
describe("## TEST WITHOUT PASSING TOKEN", () => {
  beforeEach(
    mochaAsync(async () => {
      // login leave and get access token
      await auth.getAccessToken(authEmployee);
    })
  );

  it("WITHOUT TOKEN PASSED", (done) => {
    request(app)
      .delete(`/api/leaves/${leave.getId()}?response=true`)

      .expect(httpStatus.OK)
      .then((res, req = {}) => {
        req.i18nKey = "leaveCreate";
        expect(res.body).to.deep.equal(
          getErrorResponseByKey("noPermissionErr")
        );
        done();
      })
      .catch(done);
  });
});
