import otpVerficationModel from '../models/otpVerification.model';
import twilio, { Twilio } from "twilio";
import Nexmo from "nexmo";
import { TaskQueueRealTimeStatisticsContextImpl } from "twilio/lib/rest/taskrouter/v1/workspace/taskQueue/taskQueueRealTimeStatistics";

// /**
//  * 
//  * @Sid =>  AC9531c551830249ed217df91debdc84a2
//  * @AuthToken => ce00b422e4d138a2b0eabbb51cc64ad9
//  */

const region = "ap1";
const baseUrl = `https://api.${region}.twilio.com`;

async function sendSMS({smsProvider,...otpObj}) {
	if(smsProvider && smsProvider === "twilio"){
		return await twilioSmsService(otpObj);
	}
	else{
		return await nexmoSmsService(otpObj);
	}
};


async function createOtpVerification(otpModelObj){
	let createOtpVerfication = new otpVerficationModel(otpModelObj);
	await otpVerficationModel.saveData(createOtpVerfication);
}

async function nexmoSmsService({to,message}){
	const nexmo = new Nexmo({
		apiKey: "c2029d7f",
		apiSecret: "r0VWQxuqJRyp4CdC"
	});
	return new Promise((resolve, reject) => {
		nexmo.message.sendSms(
			"+919849467662",        // place your nexmo phone number here.
			`+91${to}`,          //phone number you want to send.
			 message,     //write the message you want to send.
			(err, result) => {
				if (err) {
					console.log("ERR",err)
					reject(err);
				} else {
					console.log("Message sent successfully.");
					console.log(result)
					if (result.messages[0]['status'] === "0") {
						resolve({
							success: 'OK'
						});
					}
				}
		})
	})
}

async function twilioSmsService({from,to,message}){
	const twilioClient = new Twilio("AC9531c551830249ed217df91debdc84a2","ce00b422e4d138a2b0eabbb51cc64ad9",{ api: { baseUrl: baseUrl } });
    return new Promise((resolve,reject) => {
        twilioClient.messages.create({
            body:message,
            from:"+919849467662",
            to:`+91${to}`
        },(err,result)=>{
            if(err){
                console.log("ERR",err);
                reject({
                    failed:true
                })
            }
            else{
                resolve({
                    success:true
                })
                console.log("Sms sent successfully")
                return true;
            }
        })
    })
}


export default {
	sendSMS,
	createOtpVerification
}