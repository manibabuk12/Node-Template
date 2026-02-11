/**Model*/
import filterModel from "../models/filters.model";
/**Util*/
import sessionUtil from '../utils/session.util';

/**
 * set Filter variables
 * @returns {filterModel}
 */
const setCreateFilterVaribles = async (req, filter) => {
	if (req.tokenInfo) {
		filter.createdBy = sessionUtil.getSessionLoginID(req);
		filter.createdByName = sessionUtil.getSessionLoginName(req);
	}
	filter.created = Date.now();
	return filter;
};

/**
 * set Filter update variables
 * @returns {filterModel}
 */
const setUpdateFilterVaribles = async (req, filter) => {
	filter.updated = Date.now();
	if (req.tokenInfo) {
		filter.updatedByName = sessionUtil.getSessionLoginName(req);
		filter.updatedBy = sessionUtil.getSessionLoginID(req);
	}
	return filter;
};

export default {
	setCreateFilterVaribles,
	setUpdateFilterVaribles,
};
