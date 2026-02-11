import Election from "../models/election.model.js";

export const validateStartElection = async (req, res, next) => {
    const election = await Election.findById(req.params.id);

    if(!election){
        return res.status(400).json({message:"Election not found"})
    }

    if(res.status !== "UPCOMING"){
        return res.status(400).json({message:"Election already started"});
    }

    const active = await Election.findOne({
        constituencyId: election.constituencyId,
        status:"ONGOING"
    });

    if(active){
        return res.status(409).json({message:"Election already started"});
    }

    req.election = election;
    next();
}