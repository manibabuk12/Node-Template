import Party from "../models/party.model.js";
import Constituency from "../models/constituency.model.js"

export const validateCreateCandidate = async (req, res, next) =>{
    const {age, partyId, constituencyId} = req.body;

    if(age < 18){
        return res.status(400).json({message:"Candidate must be 18+"});
    }

    if(!await Party.findById(partyId)){
        return res.status(400).json({message:"Invalid Party"})
    }

    if(!await Constituency.findById(constituencyId)){
        return res.status(400).json({message:"Invalid constituency"})
    }
    next();
}