import ValidationRules from "./ValidationRules.js";
export default function getDefaultRoutes(req) {
  return [
    {
      name: "register",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("email", "Email", "email", 10, 100),
          new ValidationRules("pass", "Password", "string", 6, 30),
          new ValidationRules("name", "Name", "string", 2, 50),
        ];
      },
    },
    {
      name: "login",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("email", "Email", "email", 10, 100),
          new ValidationRules("pass", "Password", "string", 6, 30),
        ];
      },
    },
    {
      name: "activateAccount",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body?.activationToken,
      validationRules: () => {
        return [
          new ValidationRules(
            "activationToken",
            "Activation Token",
            "string",
            10,
            100
          ),
        ];
      },
    },
    {
      name: "closeAccount",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.get("Session-Token"),
      validationRules: () => {
        return [
          new ValidationRules(
            "sessionToken",
            "Session Token",
            "string",
            20,
            100
          ),
        ];
      },
    },
    {
      name: "requestPasswordReset",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body?.email,
      validationRules: () => {
        return [new ValidationRules("email", "Email", "email", 10, 100)];
      },
    },
    {
      name: "updatePasswordWithToken",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules(
            "resetToken",
            "Password Reset Token",
            "string",
            10,
            100
          ),
          new ValidationRules("pass", "Password", "string", 6, 30),
        ];
      },
    },
    {
      name: "getUser",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "GET",
      validationDataSource: req?.get("Session-Token"),
      validationRules: () => {
        return [
          new ValidationRules(
            "sessionToken",
            "Session Token",
            "string",
            20,
            100
          ),
        ];
      },
    },
    {
      name: "getRefreshToken",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body?.sessionToken,
      validationRules: () => {
        return [
          new ValidationRules(
            "sessionToken",
            "Session Token",
            "string",
            20,
            100
          ),
        ];
      },
    },
  ];
}
