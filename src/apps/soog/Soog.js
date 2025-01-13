import { StatusCodes } from "../../helpers/StatusCodes.js";
import AppResponser from "../../helpers/AppResponser.js";
import SendMail from "../../helpers/SendMail.js";
import SoogMessages from "./SoogMessages.js";
import User from "./db/models/User.js";
import Token from "./db/models/Token.js";
import Membership from "./db/models/Membership.js";
import File from "./db/models/File.js";
import FileAttachment from "./db/models/FileAttachment.js";
import Journal from "./db/models/Journal.js";
import Notification from "./db/models/Notification.js";
import Project from "./db/models/Project.js";
import Task from "./db/models/Task.js";
import Action from "./db/models/Action.js";
import { MembershipLevels } from "./modules/MembershipLevels.js";
import ValidationRules from "../../helpers/ValidationRules.js";
import CustomError from "../../helpers/CustomError.js";
import { Op, where } from "sequelize";
import randomstring from "randomstring";
import getRoutes from "./Routes.js";
import Hasher from "../../helpers/Hasher.js";
import PayPalPayments from "../../helpers/PayPalPayments.js";
import Ticket from "./db/models/Ticket.js";
import { query } from "express";
import CloudinaryUpload from "../../helpers/CloudinaryUpload.js";

export default class Soog extends AppResponser {
  constructor(req, res) {
    super(
      res,
      req,
      new SoogMessages(),
      [User, Token],
      new SendMail(
        process.env.SOOG_SMTP_HOST,
        process.env.SOOG_SMTP_PORT,
        process.env.SOOG_SMTP_USER,
        process.env.SOOG_SMTP_PASS,
        process.env.SOOG_SMTP_FROM
      ),
      process.env.SOOG_ACTIVATION_LINK,
      process.env.SOOG_RESET_LINK,
      "SOOG.UK Password Reset",
      "SOOG.UK Account Activation"
    );
  }

  async getUser() {
    const user = this.user;

    const cleanUser = user.toJSON();

    delete cleanUser.pass;
    delete cleanUser.isDeleted;

    const appendMembershipAndreturnResponse = async (userObject) => {
      userObject.membership = await this.#getMembershipLocal(user, false);
      return userObject;
    };

    return await super.getUser(appendMembershipAndreturnResponse);
  }

  async getMembership() {
    const user = this.user;

    var membership = null;

    if (user.isAdmin == 1) {
      membership = await Membership.findOne({
        where: {
          adminUserId: user.id,
        },
      });
    } else {
      //look up user in teams by team members first

      membership = await Membership.findOne({
        where: {
          adminUserId: user.adminUserId,
        },
      });
    }

    if (membership === null) {
      throw new CustomError(
        user.isAdmin == 1
          ? "You dont have an active membership yet! Please activate one"
          : "No active membership yet, please contact your admin to activate a membership",
        StatusCodes.NOTFOUND
      );
    }

    const objMembership = membership.toJSON();

    delete objMembership.adminUserId;

    objMembership.details = MembershipLevels.findById(
      objMembership.membershipLevel
    );

    return {
      membership: objMembership,
    };
  }

  async #getMembershipLocalById(userId) {
    let membership = null;

    const user = await User.findByPk(userId);

    if (user === null) {
      throw new CustomError("User not found", StatusCodes.NOTFOUND);
    }

    if (user.isAdmin == 1) {
      membership = await Membership.findOne({
        where: {
          adminUserId: user.id,
        },
      });
    } else {
      //look up user in teams by team members first

      membership = await Membership.findOne({
        where: {
          adminUserId: user.adminUserId,
        },
      });
    }

    if (membership === null) {
      return null;
    }

    const objMembership = membership.toJSON();

    objMembership.details = MembershipLevels.findById(
      objMembership.membershipLevel
    );

    return objMembership;
  }

  async #getMembershipLocal(user, throwError = true) {
    let membership = null;
    let objMembership = null;

    if (user.isAdmin == 1) {
      membership = await Membership.findOne({
        where: {
          adminUserId: user.id,
        },
      });
    } else {
      //look up user in teams by team members first

      membership = await Membership.findOne({
        where: {
          adminUserId: user.adminUserId,
        },
      });
    }

    if (throwError && membership === null) {
      throw new CustomError(
        user.isAdmin == 1
          ? "You dont have an active membership yet! Please activate one"
          : "No active membership yet, please contact your admin to activate a membership",
        StatusCodes.NOTFOUND
      );
    } else if (membership !== null && typeof membership?.toJSON == "function") {
      objMembership = membership.toJSON();

      delete objMembership.adminUserId;

      objMembership.details = MembershipLevels.findById(
        objMembership.membershipLevel
      );
    }

    return objMembership;
  }

  async addUser() {
    const user = this.user.toJSON();
    const name = this.req?.body?.name;
    const email = this.req?.body?.email;

    //assign membership
    user.membership = await this.#getMembershipLocalById(user.id);

    if (
      (await User.count({
        where: {
          email: email.trim(),
        },
      })) != 0
    ) {
      throw new CustomError("Email already exists", StatusCodes.BAD_REQUEST);
    }

    if (
      (await User.count({
        where: {
          adminUserId: user.id,
        },
      })) +
        1 >=
      user.membership.details.maxUsers
    ) {
      throw new CustomError(
        "You have reached the limit of your membership for this operation",
        StatusCodes.BAD_REQUEST
      );
    }

    const newUser = await User.create({
      adminUserId: user.id,
      name: name.trim(),
      isActivated: 1,
      email: email.trim(),
      isAdmin: 0,
      pass: new Hasher(/* randomstring.generate() */ "test123", true).getHash(),
      canDeleteProject: 0,
      canDeleteTask: 0,
      canDeleteJournal: 0,
      canUploadFile: 0,
      canDeleteFile: 0,
      canRequestSupport: 0,
      canViewDashboard: 0,
      canArchive: 0,
    });

    //notify user and send notification reset email
    await this.requestPasswordReset();

    return {
      user: newUser.toJSON(),
      message: "User added successfully",
    };
  }

  async getAvailableMemberships() {
    const allMemberships = MembershipLevels.getAll();
    return {
      memberships: allMemberships,
    };
  }

  async activateMembership() {
    const user = this.user;

    const membershipId = this.req?.body?.membershipId;

    const allMemberships = MembershipLevels.getAll();

    const membershipFound = allMemberships.find(
      (mem) => mem.id == membershipId
    );

    if (typeof membershipFound == "undefined") {
      throw new CustomError(
        "Membership type not found",
        StatusCodes.BAD_REQUEST
      );
    }

    //new membership
    if (membershipFound.id == 1) {
      //free membership, no need for payment

      const currentMembership = await Membership.findOne({
        where: {
          adminUserId: user.id,
        },
      });

      if (currentMembership === null) {
        await Membership.create({
          adminUserId: user.id,
          membershipLevel: membershipFound.id,
        });
      } else {
        currentMembership.isDeleted = 1;
        await currentMembership.save();
        await Membership.create({
          adminUserId: user.id,
          membershipLevel: membershipFound.id,
        });
      }

      return {
        message: `Membership tier (${membershipFound.name}) has been activated`,
        needToRedirect: false,
        activatedFree: true,
      };
    } else {
      //paid membership
      const paypalPay = new PayPalPayments(this.#getPayPalConstructorOptions());

      const subscriptionUrl = await paypalPay.getSubscriptionUrl(
        user.id,
        membershipFound.id == 3
          ? process.env.SOOG_STATUS == "production"
            ? process.env.SOOG_PRO_PLAN_ID
            : process.env.SOOG_PRO_PLAN_ID_TEST
          : process.env.SOOG_STATUS == "production"
          ? process.env.SOOG_STARTER_PLAN_ID
          : process.env.SOOG_STARTER_PLAN_ID_TEST,
        process.env.SOOG_STATUS == "production"
          ? process.env.PAYPAL_BASE_URL_LIVE
          : process.env.PAYPAL_BASE_URL_TEST,
        process.env.PAYPAL_SUBSCRIPTION_ENDPOINT,
        process.env.SOOG_STATUS == "production"
          ? process.env.SOOG_SUBSCRIPTION_RETURN_URL
          : process.env.SOOG_SUBSCRIPTION_RETURN_URL_TEST,
        process.env.SOOG_STATUS == "production"
          ? process.env.SOOG_SUBSCRIPTION_CANCEL_URL
          : process.env.SOOG_SUBSCRIPTION_CANCEL_URL_TEST
      );

      if (subscriptionUrl.success == true) {
        return {
          message: `Membership tier (${membershipFound.name}) will be activated once payment is made`,
          needToRedirect: true,
          redirectUrl: subscriptionUrl.url,
        };
      } else {
        throw new CustomError(subscriptionUrl.error, StatusCodes.BAD_REQUEST);
      }
    }
  }

  #getPayPalConstructorOptions() {
    return {
      clientId:
        process.env.SOOG_STATUS == "production"
          ? process.env.SOOG_PAYPAL_CLIENT_ID_LIVE
          : process.env.SOOG_PAYPAL_CLIENT_ID_TEST,
      secret:
        process.env.SOOG_STATUS == "production"
          ? process.env.SOOG_PAYPAL_SECRET_LIVE
          : process.env.SOOG_PAYPAL_SECRET_TEST,
      authUrl:
        process.env.SOOG_STATUS == "production"
          ? process.env.PAYPAL_BASE_URL_LIVE
          : process.env.PAYPAL_BASE_URL_TEST,
      authEndPoint: process.env.PAYPAL_AUTH_ENDPOINT,
    };
  }

  async paypalWebhook() {
    const id = this.req?.body?.id;
    const eventType = this.req?.body?.event_type;
    const resourceType = this.req?.body?.resource_type;
    const creationTime = this.req?.body?.create_time;

    const resource = this.req?.body?.resource;
    const customId = resource?.custom_id;
    const planId = resource.plan_id;
    const starterSub =
      process.env?.SOOG_STATUS == "production"
        ? process.env?.SOOG_STARTER_PLAN_ID
        : process.env?.SOOG_STARTER_PLAN_ID_TEST;
    const proPlan =
      process.env?.SOOG_STATUS == "production"
        ? process.env?.SOOG_PRO_PLAN_ID
        : process.env?.SOOG_PRO_PLAN_ID_TEST;

    let upgradedMemberShipId = 0;

    if (planId == starterSub) {
      upgradedMemberShipId = 2;
    }

    if (planId == proPlan) {
      upgradedMemberShipId = 3;
    }

    const currentMembership = await this.#getMembershipLocalById(customId);

    if (![2, 3].includes(upgradedMemberShipId)) {
      throw new CustomError("Invalid plan", StatusCodes.BAD_REQUEST);
    }

    if (typeof customId == "undefined") {
      throw new CustomError("Expecting a custom ID", StatusCodes.BAD_REQUEST);
    }

    //process and validate
    if (resourceType == "subscription") {
      if (eventType == "BILLING.SUBSCRIPTION.SUSPENDED") {
        //Action: Temporarily revoke access to subscription-based features or services until the issue is resolved.
        //You can also notify the user to update payment information if it's due to payment failure.

        await Membership.update(
          {
            status: "suspended",
          },
          {
            where: {
              id: currentMembership.id,
              adminUserId: customId,
            },
          }
        );
        return {
          message: "Subscription has been suspended",
          status: "success",
        };
      } else if (eventType == "BILLING.SUBSCRIPTION.RE-ACTIVATED") {
        //Action: Restore the user's access to the subscription features that were previously suspended.

        await Membership.update(
          {
            status: "active",
          },
          {
            where: {
              id: currentMembership.id,
              adminUserId: customId,
            },
          }
        );

        return {
          message: "Subscription has been reactivated",
          status: "success",
        };
      } else if (eventType == "BILLING.SUBSCRIPTION.CANCELLED") {
        //Action: Stop access to the subscription features and update the user's status. Depending on your business model,
        //you may offer a grace period or suggest alternative plans.

        await Membership.update(
          {
            isDeleted: 1,
          },
          {
            where: {
              id: currentMembership.id,
              adminUserId: customId,
            },
          }
        );

        return {
          message: "Subscription has been  deleted cancelled",
          status: "success",
        };
      } else if (eventType == "BILLING.SUBSCRIPTION.EXPIRED") {
        //Action: Revoke access to the subscription features once the subscription has expired, and notify the user about the expiration.
        //You can also offer them an option to renew or subscribe again.

        await Membership.update(
          {
            isDeleted: 1,
          },
          {
            where: {
              id: currentMembership.id,
              adminUserId: customId,
            },
          }
        );
        return {
          message: "Subscription has been deleted and expired",
          status: "success",
        };
      } else {
        throw new CustomError(
          "this webhook does not serve this event",
          StatusCodes.NOTFOUND
        );
      }
    } else {
      throw new CustomError(
        "this webhook is only for subscriptions",
        StatusCodes.NOTFOUND
      );
    }
  }

  async validateSubscriptionPayment() {
    const subscriptionId = this.req?.body?.subscriptionId;
    const paypal = new PayPalPayments(this.#getPayPalConstructorOptions());
    const subscription = await paypal.getSubscription(
      subscriptionId,
      process.env.SOOG_STATUS == "production"
        ? process.env.PAYPAL_BASE_URL_LIVE
        : process.env.PAYPAL_BASE_URL_TEST,
      process.env.PAYPAL_SUBSCRIPTION_ENDPOINT
    );

    if (!subscription.success) {
      throw new CustomError(subscription.error, StatusCodes.BAD_REQUEST);
    }

    const subData = subscription.subscription;

    if (subData.status != "ACTIVE") {
      throw new CustomError(
        "unable to activate subscription, payment not processed",
        StatusCodes.BAD_REQUEST
      );
    }

    const userId = subData.custom_id;

    if (userId != this.user.id) {
      throw new CustomError(
        "Invalid subscripton linking! You have been charged but subscription not activated. Please send us an email and we will sort it out",
        StatusCodes.BAD_REQUEST
      );
    }

    if (typeof userId == "undefined") {
      throw new CustomError(
        "unable to obtain user ID",
        StatusCodes.BAD_REQUEST
      );
    }

    const planId = subData.plan_id;
    const starterSub =
      process.env?.SOOG_STATUS == "production"
        ? process.env?.SOOG_STARTER_PLAN_ID
        : process.env?.SOOG_STARTER_PLAN_ID_TEST;
    const proPlan =
      process.env?.SOOG_STATUS == "production"
        ? process.env?.SOOG_PRO_PLAN_ID
        : process.env?.SOOG_PRO_PLAN_ID_TEST;

    let upgradedMemberShipId = 0;

    if (planId == starterSub) {
      upgradedMemberShipId = 2;
    }

    if (planId == proPlan) {
      upgradedMemberShipId = 3;
    }

    const currentMembership = await this.#getMembershipLocalById(userId);

    if (![2, 3].includes(upgradedMemberShipId)) {
      throw new CustomError("Invalid plan", StatusCodes.BAD_REQUEST);
    }

    if (currentMembership == null) {
      await Membership.create({
        adminUserId: userId,
        linkedMembershipId: subData.id,
        membershipLevel: upgradedMemberShipId,
      });

      return {
        message: "Thanks for your payment. Your membership has been activated!",
        status: "success",
      };
    } else {
      await Membership.update(
        {
          membershipLevel: upgradedMemberShipId,
          linkedMembershipId: subData.id,
          status: "active",
        },
        {
          where: {
            id: currentMembership.id,
            adminUserId: userId,
          },
        }
      );

      return {
        message: "Thanks for your payment. Your membership has been upgraded!",
        status: "success",
      };
    }
  }

  async getAllUsers() {
    const users = await User.findAll({
      where: {
        adminUserId: this.user.id,
      },
    });

    return {
      message: "Users loaded",
      users: users,
    };
  }

  async #isActionAllowed() {
    const currentMembership = await this.#getMembershipLocalById(this.user.id);
    const forbiddenMessage =
      "Your dont have correct permission for this action! please contact your admin.";

    //support tickets
    if (["getTickets", "addTicket", "getTicket"].includes(this.action)) {
      if (!currentMembership?.details?.supportAllowed == true) {
        throw new CustomError(
          "current membership does not allow for action",
          StatusCodes.FORBIDDEN
        );
      }
    }

    //from this point admins can do anything
    if (this.user.isAdmin == 1) {
      return;
    }

    if (["getTickets", "addTicket", "getTicket"].includes(this.action)) {
      if (this.user.canRequestSupport != 1) {
        throw new CustomError(forbiddenMessage, StatusCodes.FORBIDDEN);
      }
    }

    //files

    //tasks

    //projects

    //journal

    if (["addJournalPost"].includes(this.action)) {
      if (this.user.canCreateJournal != 1) {
        throw new CustomError(forbiddenMessage, StatusCodes.FORBIDDEN);
      }
    }

    if (["deleteJournalPost"].includes(this.action)) {
      if (this.user.canDeleteJournal != 1) {
        throw new CustomError(forbiddenMessage, StatusCodes.FORBIDDEN);
      }
    }

    if (["getUploadSignutre"].includes(this.action)) {
      //validate upload access
      if (this.user.canUploadFile != 1) {
        throw new CustomError(forbiddenMessage, StatusCodes.FORBIDDEN);
      }
    }

    if (["addProject"].includes(this.action)) {
      if (this.user.canCreateProject != 1) {
        throw new CustomError(forbiddenMessage, StatusCodes.FORBIDDEN);
      }
    }
  }

  async addTicket() {
    await this.#isActionAllowed();

    const user = this.user;

    const title = this.req.body.title;
    const content = this.req.body.description;
    const importance = this.req.body.importance;

    const ticket = await Ticket.create({
      createdByUserId: user.id,
      adminUserId: user.isAdmin ? user.id : user.adminUserId,
      title,
      content,
      importance,
    });

    const ticketObj = ticket.toJSON();

    delete ticketObj.content;

    return {
      message: "Ticket added",
      ticket: ticketObj,
    };
  }

  async getTickets() {
    const user = this.user;

    await this.#isActionAllowed();

    let allTickets = [];

    if (user.isAdmin == 1) {
      allTickets = await Ticket.findAll({
        where: {
          [Op.or]: [{ createdByUserId: user.id }, { adminUserId: user.id }],
        },
        order: [["id", "DESC"]], // Order by `id` in descending order
        limit: 100, // Limit the result set to 50 records
      });
    } else {
      allTickets = await Ticket.findAll({
        where: {
          createdByUserId: user.id,
        },
        order: [["id", "DESC"]], // Order by `id` in descending order
        limit: 50, // Limit the result set to 50 records
      });
    }

    return {
      message: "Ticket added",
      tickets: allTickets,
    };
  }

  async getUserById() {
    const userId = this.req?.query?.userId;

    const user = await User.findOne({
      where: {
        id: userId,
        adminUserId: this.user.id,
      },
    });

    if (user === null) {
      throw new CustomError("User not found", StatusCodes.NOTFOUND);
    }

    const userObj = user.toJSON();
    delete userObj.pass;

    return {
      message: "user loaded",
      user: userObj,
    };
  }

  async updateUser() {
    const userId = this.req?.body?.userId;

    if (
      (await User.count({
        where: {
          email: this.req?.body?.email.trim(),
          id: {
            [Op.ne]: userId,
          },
        },
      })) != 0
    ) {
      throw new CustomError(
        "User email already exists",
        StatusCodes.BAD_REQUEST
      );
    }
    const newUserObj = {
      name: this.req?.body?.name,
      email: this.req?.body?.email.trim(),
      canCreateProject: this.req?.body?.canCreateProject,
      canUpdateProject: this.req?.body?.canUpdateProject,
      canDeleteProject: this.req?.body?.canDeleteProject,
      canCreateTask: this.req?.body?.canCreateTask,
      canEditTask: this.req?.body?.canEditTask,
      canDeleteTask: this.req?.body?.canDeleteTask,
      canCreateJournal: this.req?.body?.canCreateJournal,
      canDeleteJournal: this.req?.body?.canDeleteJournal,
      canUploadFile: this.req?.body?.canUploadFile,
      canDeleteFile: this.req?.body?.canDeleteFile,
      canRequestSupport: this.req?.body?.canRequestSupport,
      canViewDashboard: this.req?.body?.canViewDashboard,
    };

    const [updatedRowsCount] = await User.update(newUserObj, {
      where: {
        id: userId,
        adminUserId: this.user.id,
      },
    });

    if (updatedRowsCount != 1) {
      throw new CustomError(
        "Error while updating user! please try again later",
        StatusCodes.BAD_REQUEST
      );
    }

    return {
      message: "User details have been updated!",
    };
  }

  async deleteUser() {
    const userId = this.req?.body.userId;

    const user = await User.findOne({
      where: {
        adminUserId: this.user.id,
        id: userId,
      },
    });

    if (null === user) {
      throw new CustomError("User not found", StatusCodes.NOTFOUND);
    }

    user.isDeleted = 1;
    user.email = `delete_${new Date().getTime()}_${user.email}`;

    await user.save();

    return {
      message: "Your has been deleted",
    };
  }

  run() {
    this.validate(getRoutes(this.req))
      .then(() => {
        const action = this[this.action].bind(this);

        action()
          .then((data) => {
            this.send(data, 200);
          })
          .catch((err) => this.sendError(err.message, err));
      })
      .catch((err) => this.sendError(err.message, err));
  }

  async getTicket() {
    await this.#isActionAllowed();

    const user = this.user.toJSON();
    const ticketId = this.req?.query?.ticketId;

    const ticket = await Ticket.findByPk(ticketId);

    if (ticket === null) {
      throw new CustomError("Ticket not found", StatusCodes.NOTFOUND);
    }

    const ticketObj = ticket.toJSON();
    ticketObj.actions = await Action.findAll({
      where: {
        originName: "ticket",
        actionType: "comment",
        originId: ticketObj.id,
      },
    });

    return {
      message: "ticket loaded",
      ticket: ticketObj,
    };
  }

  async addAction() {
    const user = this.user;
    let actionResource = null;
    const originId = this.req?.body?.originId;
    const originName = this.req?.body.originName;
    const actionType = this.req?.body?.actionType;
    const actionContent = this.req?.body?.actionContent;

    if (originName == "ticket") {
      actionResource = await Ticket.findOne({
        where: {
          adminUserId: user.isAdmin == 1 ? user.id : user.adminUserId,
        },
      });
    } else if (originName == "project") {
      actionResource = await Project.findOne({
        where: {
          adminUserId: user.isAdmin == 1 ? user.id : user.adminUserId,
        },
      });
    } else if (originName == "task") {
      actionResource = await Task.findOne({
        where: {
          adminUserId: user.isAdmin == 1 ? user.id : user.adminUserId,
        },
      });
    } else if (originName == "journal") {
      actionResource = await Journal.findOne({
        where: {
          adminUserId: user.isAdmin == 1 ? user.id : user.adminUserId,
        },
      });
    } else {
      throw new CustomError("Action not allowed", StatusCodes.BAD_REQUEST);
    }

    if (actionResource == null) {
      throw new CustomError(
        "you are not authorized for this resource",
        StatusCodes.FORBIDDEN
      );
    }

    const newAction = await Action.create({
      createdByUserId: user.id,
      actionType,
      actionContent,
      originId,
      originName,
    });

    return {
      message: `Your ${actionType} has been added`,
      action: newAction.toJSON(),
    };
  }

  async addJournalPost() {
    await this.#isActionAllowed();

    const content = this.req.body.description;
    const importance = this.req.body.importance;

    const post = await Journal.create({
      createdByUserId: this.user.id,
      adminUserId:
        this.user.isAdmin == 1 ? this.user.id : this.user.adminUserId,
      content: content,
      importance: importance,
    });

    let postObj = post.toJSON();
    postObj.author = this.user.name;

    return {
      message: "Journal post added",
      post: postObj,
    };
  }

  async deleteJournalPost() {
    await this.#isActionAllowed();

    const postId = this.req.body.postId;

    const whereAdmin = {
      adminUserId: this.user.id,
      id: postId,
    };

    const whereNonAdmin = {
      createdByUserId: this.user.id,
      adminUserId: this.user.adminUserId,
      id: postId,
    };

    const post = await Journal.findOne({
      where: this.user.isAdmin == 1 ? whereAdmin : whereNonAdmin,
    });

    if (post === null) {
      throw new CustomError("Post not found", StatusCodes.NOTFOUND);
    }

    post.isDeleted = 1;
    await post.save();

    return {
      message: "Journal post deleted",
    };
  }

  async getJournals() {
    await this.#isActionAllowed();
    const journals = await Journal.findAll({
      where: {
        adminUserId:
          this.user.isAdmin == 1 ? this.user.id : this.user.adminUserId,
      },
    });

    const postWithAuthors = await Promise.all(
      journals.map(async (post) => {
        const postObj = post.toJSON();
        const author = await User.findOne({
          attributes: ["name"],
          where: {
            id: postObj.createdByUserId,
          },
        });

        postObj.author = author === null ? "A User" : author.name;
        return postObj;
      })
    );

    return {
      message: "journals loaded",
      journals: postWithAuthors,
    };
  }
  

  async updateAdminDetails() {
    const name = this.req.body.name;
    const email = this.req.body.email;

    if ((await User.count({
      where: {
        id:  {
          [Op.ne]: this.user.id
        },
        email: email
      }
    })) != 0) {
      throw new CustomError("Email already exists", StatusCodes.BAD_REQUEST);
    }

    this.user.email = email;
    this.user.name = name;
    await this.user.save();

    return {
      message: "Your details have been updated"
    }

  }

  async deleteProject() {

  }

  async addProject() {
    await this.#isActionAllowed();
    const title = this.req.body.title;
    const description = this.req.body.description;
    const goLiveDate = this.req.body.goLiveDate;

    const project = await Project.create({
      title,
      description,
      goLiveDate
    });

    return {
      message: "Project added",
      project: project.toJSON()
    }
  }


}
