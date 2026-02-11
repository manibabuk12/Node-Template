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

      let totalleaves = await leavesModel.find({ active: true });
      leave.setId(totalleaves.length);
    })
  );

  it("## Should return the list of the leaves", (done) => {
    request(app)
      .get("/api/leaves")
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res) => {
        expect(res.body).to.have.property("leaves");
        expect(res.body.leaves).to.be.an("array");
        expect(res.body.leaves).to.not.have.length(0);
        done();
      })
      .catch(done);
  });

  it("## CHECK TOTAL RECORDS INCASE IF EXPORTTOCSV", (done) => {
    request(app)
      .get("/api/leaves?type=exportToCsv")
      .set({ Authorization: `Bearer ${authEmployee.getAccessToken()}` })
      .expect(httpStatus.OK)
      .then((res) => {
        expect(res.body).to.have.property("leaves");
        expect(res.body.leaves).to.be.an("array");
        expect(res.body.leaves).to.not.have.length(0);
        if (leave.getId() > 200) expect(res.body.leaves.length).to.equal(200);
        else expect(res.body.leaves.length).to.equal(leave.getId());
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
      .get("/api/leaves")

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
