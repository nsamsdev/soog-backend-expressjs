import ValidationRules from "../../helpers/ValidationRules.js";
export default function getRoutes(req) {
  return [
    {
      name: "addProject",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("title", "Title", "string", 10, 50),
          new ValidationRules("description", "Description", "string", 50, 10000),
          new ValidationRules("goLiveDate", "Live Date", "date", 10, 100),
        ];
      },
    },

    {
      name: "updateAdminDetails",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("name", "Name", "string", 1, 50),
          new ValidationRules("email", "Email", "string", 10, 100),
        ];
      },
    },

    {
      name: "getJournals",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "GET",
      validationDataSource: null,
      validationRules: () => {
        return [];
      },
    },
    {
      name: "deleteJournalPost",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body?.postId,
      validationRules: () => {
        return [new ValidationRules("postId", "Post ID", "number", 1, 50)];
      },
    },
    {
      name: "addJournalPost",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules(
            "importance",
            "Importance Level",
            "string",
            4,
            20
          ),
          new ValidationRules("description", "description", "string", 50, 500),
        ];
      },
    },
    {
      name: "addAction",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("originName", "Origin Name", "string", 1, 50),
          new ValidationRules("originId", "Origin ID", "number", 1, 50),
          new ValidationRules("actionType", "Action Type", "string", 5, 20),
          new ValidationRules(
            "actionContent",
            "Action Content",
            "string",
            50,
            1000
          ),
        ];
      },
    },

    {
      name: "getTicket",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "GET",
      validationDataSource: req?.query?.ticketId,
      validationRules: () => {
        return [new ValidationRules("ticketId", "Ticket ID", "string", 1, 50)];
      },
    },

    {
      name: "deleteUser",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "POST",
      validationDataSource: req?.body?.userId,
      validationRules: () => {
        return [new ValidationRules("userId", "User ID", "number", 1, 50)];
      },
    },
    {
      name: "updateUser",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("userId", "User ID", "number", 1, 50),
          new ValidationRules("name", "Name", "string", 2, 50),
          new ValidationRules("email", "Email", "string", 10, 100),
          new ValidationRules(
            "canCreateProject",
            "Project creation",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canUpdateProject",
            "Updating a project",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canDeleteProject",
            "Deleting a project",
            "number",
            1,
            20
          ),
          new ValidationRules("canCreateTask", "Create tasks", "number", 1, 20),
          new ValidationRules("canEditTask", "Editing tasks", "number", 1, 20),
          new ValidationRules(
            "canDeleteTask",
            "Deleting a task",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canCreateJournal",
            "Creating a journal",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canDeleteJournal",
            "Deleting a journal",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canUploadFile",
            "Uploading Files",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canDeleteFile",
            "Deleting Files",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canRequestSupport",
            "Requesting Support",
            "number",
            1,
            20
          ),
          new ValidationRules(
            "canViewDashboard",
            "Viewing dashboard",
            "number",
            1,
            20
          ),
        ];
      },
    },
    {
      name: "getUserById",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "GET",
      validationDataSource: req?.query?.userId,
      validationRules: () => {
        return [new ValidationRules("userId", "User ID", "string", 1, 20)];
      },
    },
    {
      name: "getTickets",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "GET",
      validationDataSource: null,
      validationRules: () => {
        return [];
      },
    },
    {
      name: "addTicket",
      isProtected: true,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("title", "Title", "string", 5, 150),
          new ValidationRules(
            "description",
            "Issue Details/Description",
            "string",
            50,
            1000
          ),
          new ValidationRules("importance", "Importance", "string", 5, 20),
        ];
      },
    },
    {
      name: "getAllUsers",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "GET",
      validationDataSource: null,
      validationRules: () => {
        return [];
      },
    },
    {
      name: "validateSubscriptionPayment",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "POST",
      validationDataSource: req?.body?.subscriptionId,
      validationRules: () => {
        return [
          new ValidationRules(
            "subscriptionId",
            "Subscription ID",
            "string",
            5,
            150
          ),
        ];
      },
    },
    {
      name: "paypalWebhook",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("id", "ID", "string", 5, 100),
          new ValidationRules("event_type", "Event Type", "string", 10, 100),
          new ValidationRules(
            "resource_type",
            "Resource Type",
            "string",
            10,
            100
          ),
          new ValidationRules(
            "create_time",
            "Creation Time",
            "string",
            10,
            100
          ),
        ];
      },
    },

    {
      name: "activateMembership",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "POST",
      validationDataSource: req?.body?.membershipId,
      validationRules: () => {
        return [
          new ValidationRules("membershipId", "Membership ID", "number", 1, 10),
        ];
      },
    },
    {
      name: "getAvailableMemberships",
      isProtected: false,
      isAdminOnly: false,
      httpMethod: "GET",
      validationDataSource: null,
      validationRules: () => {
        return [];
      },
    },
    {
      name: "addUser",
      isProtected: true,
      isAdminOnly: true,
      httpMethod: "POST",
      validationDataSource: req?.body,
      validationRules: () => {
        return [
          new ValidationRules("name", "Name", "string", 2, 100),
          new ValidationRules("email", "Email", "email", 10, 100),
        ];
      },
    },
    {
      name: "getMembership",
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
  ];
}
