import Voter from "../models/voter.model.js"
import Constituency from "../models/constituency.model.js"

export const validateRigisterVoter = async (req, res, next) =>{
    const {age, voterId, constituencyId, area} = req.body;

    if(age < 18){
        return res.status(400).json({message:"Voter must be 18+"});
    }

    if(await Voter.findById(voterId)){
        return res.status(409).json({message:"Voter ID already exist"})
    }

    const constituency = await Constituency.findById(constituencyId);

    if(!constituency){
        return res.status(400).json({message:"Invalid constituency"})
    }

    if(!constituency.areas.includes(area)){
        return res.status(400).json({message:"Area not in constituency"})
    }
    next();
}
