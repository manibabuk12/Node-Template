import Party from "../models/party.model.js"

export const validateCreateParty = async (req,res,next) => {
    const {name, symbol} =  req.body;

    if(!name || !symbol){
        return res.status(400).json({message:"Name and symbol not found"});
    } 

    const exists = await Party.findOne({
        $or:[{name},{symbol}]
    });

    if(exists){
        return res.status(409).json({message:"Party already exist"})
    }
    next();
}