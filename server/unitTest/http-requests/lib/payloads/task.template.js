function TaskPayload() {
  return {
    getPostTask(task) {
      let {
        taskName,
        priority,
        status,
        estimatedTime,
        workedHours,
        serialNo,
        comment,
        created,
        updated,
      } = task.getfields();
      return {
        taskName,
        priority,
        status,
        estimatedTime,
        workedHours,
        serialNo,
        comment,
        created,
        updated,
      };
    },
  };
}

export default TaskPayload;
