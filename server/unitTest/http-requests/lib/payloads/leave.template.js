function LeavePayload() {
  return {
    getPostLeave(leave) {
      let {
        leaveType,
        status,
        reason,
        startDate,
        endDate,
        numberofDays,
        created,
        updated,
      } = leave.getfields();
      return {
        leaveType,
        status,
        reason,
        startDate,
        endDate,
        numberofDays,
        created,
        updated,
      };
    },
  };
}

export default LeavePayload;
