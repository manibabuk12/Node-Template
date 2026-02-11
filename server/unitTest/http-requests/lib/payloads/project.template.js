function ProjectPayload() {
  return {
    getLoginProject(project) {
      return {
        email: project.getEmail(),
        password: project.getPassword(),
        entityType: project.getEntityType(),
      };
    },

    getPostProject(project) {
      let { name, startDate, endDate, teamSize, created, updated, email } =
        project.getfields();
      return {
        name,
        startDate,
        endDate,
        teamSize,
        created,
        updated,
        email,
      };
    },
  };
}

export default ProjectPayload;
