function EmployeePayload() {
  return {
    getLoginEmployee(employee) {
      return {
        email: employee.getEmail(),
        password: employee.getPassword(),
        entityType: employee.getEntityType(),
      };
    },

    getPostEmployee(employee) {
      let {
        name,
        email,
        address,
        role,
        phone,
        created,
        updated,
        aadhar,
        dateOFBirth,
        gender,
        status,
      } = employee.getfields();
      return {
        name,
        email,
        address,
        role,
        phone,
        created,
        updated,
        aadhar,
        dateOFBirth,
        gender,
        status,
      };
    },
  };
}

export default EmployeePayload;
