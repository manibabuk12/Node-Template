import voteModel from "../models/vote.model";
import Vote from "../models/vote.model"
import Voter from "../models/voter.model"

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";
import partyModel from "../models/party.model";

let _ = require("lodash");
/**
 * set Vote variables
 * @returns {voteModel}
 */
const setCreateVoteVariables = async (req, vote) => {
  if (req.tokenInfo) {
    vote.createdBy = session.getSessionLoginID(req);
    vote.userId = session.getSessionLoginID(req);
    vote.userName = session.getSessionLoginName(req);
    vote.createdByName = session.getSessionLoginName(req);
    // vote.status = "Pending";
    vote.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  vote.created = Date.now();
  return vote;
};

/**
 * set Vote update variables
 * @returns {voteModel}
 */
const setUpdateVoteVariables = async (req, vote) => {
  if (req.tokenInfo) {
    vote.updatedBy = session.getSessionLoginID(req);
    vote.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  vote.updated = Date.now();
  return vote;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "assignedTo",
      secureApi: employee,
      searchField: "name",
      isMultiple: undefined,
    },
  ];
  for (let i of arrObj) {
    if (!i.isMultiple) {
      let query = {};
      query[i.searchField] = obj[i.bulkUploadField];
      query.active = true;
      obj[i.bulkUploadField] = await i.secureApi.findOne(query);
    } else {
      let resultarr = [];
      let searchFields = obj[i.bulkUploadField].split(",");
      for (let j of searchFields) {
        let query = { active: true };
        query[i.searchField] = j.trim();
        let findResult = await i.secureApi.findOne(query);
        if (findResult) resultarr.push(findResult);
      }
      obj[i.bulkUploadField] = resultarr;
    }
    if (obj && !obj[i.bulkUploadField])
      obj.reason = `${i.searchField} is not found`;
    console.log("AUTORELATE-->VAMSIII", obj[i.bulkUploadField]);
  }
  return obj;
};

/**
 * insert Employees bulk data
 * @returns {Employees}
 */
async function insertVoteData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let vote = new voteModel(obj[val]);
      vote = await setCreateVoteVariables(req, vote);
      let validateRes = await validateFields(req, vote);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.vote = await voteModel.saveData(vote);
        req.entityType = "vote";
        req.activityKey = "voteCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Vote" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, vote) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateVoteBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "voteName",
    "priority",
    "status",
    "estimatedTime",
    "workedHours",
    "serialNo",
    "comment",
  ];
  let unMatchedFields = _.difference(bulkuploadFields, excelHeaders);
  if (unMatchedFields && unMatchedFields.length > 0) {
    excelData = excelData.map((x) => ({ ...x, reason: "Headers not matched" }));
    req.duplicates = excelData;
    return {
      headersNotMatched: true,
      reason: `BulkUpload Fields (${unMatchedFields.join(
        ","
      )}) are Not Matched`,
    };
  }
  return { headersMatched: true };
};

const VotingAggreations = async (req, res) => {
  const results = await voteModel.aggregate([
    {
      $group: {
        _id: "$partyId",
        totalVotes: { $sum: 1 }
      }
    },
    { $sort: { totalVotes: -1 } },
  ])
  let updatedResult = []

  for(let item of results){
    let pary = await partyModel.findOne({_id : item._id})
    item.name = pary.name
    updatedResult.push(item)
  }
  return updatedResult[0];
  
}

const VotesForPartys = async (req, res) => {
  const result = await voteModel.aggregate([
    {
      $group: {
        _id: "$partyId",
        totalVotes: { $sum: 1 }
      }
    }
  ])
  let updatedResult = []

  for(let item of result){
    let pary = await partyModel.findOne({_id : item._id})
    item.name = pary.name
    updatedResult.push(item)
  }
  return updatedResult;
}

const totalVotesCount = async (req, res) => {
  const successfullVotes = await voteModel.countDocuments();
  const totalVotes = await Voter.countDocuments();
  const percentage = (successfullVotes * 100) / totalVotes;
  return percentage;

}


async function areaViseVotes(req, res) {
  let pipeline = [
    {
      $match: { active: true }
    },
    {
      $group: {
        _id: "$area", totalCount: {
          $sum: 1
        }
      }
    }
  ]

  let result = await Voter.aggregate(pipeline)
  res.json({ responseJson: result })
}


async function voteAndConstituencyWon(req, res) {
let pipeline = [
  {
    $group: {
      _id: "$candidateId",
      totalVotes: {
        $sum: 1
      }
    }
  },
  {
    $lookup: {
      from: "candidates",
      localField: "_id",
      foreignField: "_id",
      as: "candidate"
    }
  },
  {
    $lookup: {
      from: "partys",
      localField: "candidate.partyId",
      foreignField: "_id",
      as: "partys"
    }
  },
  {
    $lookup: {
      from: "constituencys",
      localField: "candidate.constituencyId",
      foreignField: "_id",
      as: "constituency"
    }
  },
  {
    $sort: {
      totalVotes: -1
    }
  },
  {
    $group: {
      _id: "$candidate.constituencyId",
      constituencyName: {
        $first: "$constituency.name"
      },
      candidateName: {
        $first: "$candidate.name"
      },
      partyName: {
        $first: "$partys.name"
      },
      winnerParty: {
        $first: "$candidate.partyId"
      },
      winnerVotes: {
        $first: "$totalVotes"
      }
    }
  }
]

  let result = await Vote.aggregate(pipeline)

  res.json({ responseJson: result })
}


export default {
  setCreateVoteVariables,
  setUpdateVoteVariables,
  insertVoteData,
  validateFields,
  validateVoteBulkFields,
  VotingAggreations,
  VotesForPartys,
  totalVotesCount,
  areaViseVotes,
  voteAndConstituencyWon
};
