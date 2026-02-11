import Vote from "../models/vote.model.js";
import Election from "../models/election.model.js";
import Voter from "../models/voter.model.js";
import Candidate from "../models/candidate.model.js";
 
export const validateVote = async (req, res, next) => {
  const { electionId, voterId, candidateId } = req.body;
 
  const election = await Election.findById(electionId);
  if (!election) {
    return res.status(404).json({ message: "Election not found" });
  }
 
  if (election.status !== "ONGOING") {
    return res.status(403).json({ message: "Voting not allowed" });
  }
 
  const voter = await Voter.findById(voterId);
  if (!voter) {
    return res.status(404).json({ message: "Voter not found" });
  }
 
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }
 
  if (voter.constituencyId.toString() !== candidate.constituencyId.toString()) {
    return res.status(400).json({
      message: "Voter and candidate constituency mismatch"
    });
  }
 
  if (voter.constituencyId.toString() !== election.constituencyId.toString()) {
    return res.status(400).json({
      message: "Voter not in election constituency"
    });
  }
 
  const voted = await Vote.findOne({
    electionId,
    voterId
  });
 
  if (voted) {
    return res.status(409).json({ message: "Duplicate vote" });
  }
 
  req.voteMeta = {
    partyId: candidate.partyId,
    constituencyId: candidate.constituencyId
  };
 
  next();
};