import Hasher from "./Hasher.js";
import randomstring from "randomstring";
import { StatusCodes } from "./StatusCodes.js";
import ValidationRules from "./ValidationRules.js";
import Validator from "./Validator.js";
import { Op } from "sequelize";
import Token from "../db/models/Token.js";
import User from "../db/models/User.js";
import CustomError from "./CustomError.js";
import { tokenIsValid } from "./functions/validation_helpers.js";
import getDefaultRoutes from "./DefaultRoutes.js";

import Messages from "./Messages.js";

export default class AppResponser {
  constructor(
    res,
    req,
    messages,
    UserAndTokenModels,
    mailer,
    activationLink,
    resetLink,
    resetSubject = "Reset Password",
    activattionSubject = "Account Activation"
  ) {
    this.user = null;
    this.resetSubject = resetSubject;
    this.activattionSubject = activattionSubject;
    this.activationLink = activationLink;
    this.resetLink = resetLink;
    this.res = res;
    this.req = req;
    this.params = req.params;
    this.action = this.params.action;

    if (!Array.isArray(UserAndTokenModels) || UserAndTokenModels.length != 2) {
      this.userModel = User;
      this.tokenModel = Token;
    } else {
      const [userModel, tokenModel] = UserAndTokenModels;
      this.userModel = userModel;
      this.tokenModel = tokenModel;
    }

    this.mailer = mailer;
    this.messages = messages;
  }

  async validate(appActionsMapping) {
    if (!Array.isArray(appActionsMapping)) {
      throw new CustomError(
        "App actions mapping must be an array",
        StatusCodes.SERVER_ERROR
      );
    }
    const appActions = [...appActionsMapping, ...this.getSharedActions()];

    const actionFound = appActions.find((a) => a.name == this.action);

    if (typeof actionFound == "undefined") {
      throw new CustomError("App action not found", StatusCodes.NOTFOUND);
    }

    const requestMethod = this.req?.method;

    if (actionFound.httpMethod != requestMethod) {
      throw new CustomError("Invalid request method", StatusCodes.NOTFOUND);
    }

    new Validator(
      actionFound.validationRules(),
      actionFound.validationDataSource
    );

    if (actionFound.isProtected) {
      this.user = await this.getUserBySessionToken();

      if (actionFound.isAdminOnly) {
        if (this.user.isAdmin != 1) {
          throw new CustomError(
            "Forbidden access admin only",
            StatusCodes.FORBIDDEN
          );
        }
      }
    }
  }

  async getUserBySessionToken(validateUser = true) {
    const sessionToken = this.req?.get("Session-Token");

    if (typeof sessionToken == "undefined") {
      throw new CustomError(
        "Protected actions require authentication",
        StatusCodes.UNAUTHORIZED
      );
    }

    const token = await this.tokenModel.findOne({
      where: {
        token: {
          [Op.eq]: sessionToken,
        },
        for: {
          [Op.in]: ["sessionToken", "longSessionToken"],
        },
      },
    });

    if (token === null) {
      throw new CustomError(
        "Invalid session token expired",
        StatusCodes.UNAUTHORIZED
      );
    }

    if (!tokenIsValid(token)) {
      token.isDeleted = 1;
      await token.save();
      throw new CustomError(
        "invalid or expired session",
        StatusCodes.UNAUTHORIZED
      );
    }

    const user = await this.userModel.findOne({
      where: {
        id: {
          [Op.eq]: Number(token.value),
        },
      },
    });

    if (validateUser) {
      if (user === null) {
        throw new CustomError(
          "Invalid session token expired",
          StatusCodes.UNAUTHORIZED
        );
      }
    }

    return user;
  }

  send(data, statusCode = 200) {
    // await this.db.closeConnection();
    data["status"] = "success";
    this.res.status(statusCode || 200).json(data);
  }

  sendError(msg, statusCode) {
    // await this.db.closeConnection();
    // console.log(statusCode);
    this.res.status(statusCode.errCode ?? 400).json({
      status: "error",
      message: msg,
    });
  }

  async getUser(cb = null) {
    const user = this.user;

    const cleanUser = user.toJSON();

    delete cleanUser.pass;
    delete cleanUser.isDeleted;

    if (typeof cb == "function") {
      return await cb(cleanUser);
    }

    return {
      user: cleanUser,
    };
  }

  async login() {
    const email = this.req?.body?.email;

    const pass = this.req?.body?.pass;

    const longToken = this.req?.body?.longSession === "y" ? true : false;

    let user = null;

    user = await this.userModel.findOne({
      where: {
        email: {
          [Op.eq]: email.trim(),
        },
      },
    });

    if (user === null) {
      throw new CustomError(
        "Invalid login details, please check your email and password",
        StatusCodes.UNAUTHORIZED
      );
    }

    const hasher = new Hasher(pass, false);

    if (!hasher.validateHashMatch(user.pass)) {
      throw new CustomError("invalid login details", StatusCodes.BAD_REQUEST);
    }

    if (user.isActivated != 1) {
      throw new CustomError(
        "Account not activated, please request a password reset email to recieve your activation email",
        StatusCodes.UNAUTHORIZED
      );
    }

    //create session token
    //

    var sessionToken = randomstring.generate();

    while (
      (await this.tokenModel.count({
        where: {
          token: {
            [Op.eq]: sessionToken,
          },
        },
      })) != 0
    ) {
      sessionToken = randomstring.generate();
    }

    await this.tokenModel.create({
      token: sessionToken,
      for: longToken ? "longSessionToken" : "sessionToken",
      value: user.id,
    });

    return {
      message: "loggedin",
      sessionToken: sessionToken,
    };
  }

  async register() {
    const email = this.req?.body?.email;
    const pass = this.req?.body?.pass;
    const name = this.req?.body?.name;

    if (
      (await this.userModel.count({
        where: {
          email: {
            [Op.eq]: email.trim(),
          },
        },
      })) >= 1
    ) {
      throw new CustomError("Email already exists", StatusCodes.BAD_REQUEST);
    }

    const hashedPass = new Hasher(pass);
    const hash = hashedPass.getHash();

    const newUser = await this.userModel.create({
      name: name,
      email: email,
      pass: hash,
    });

    var activationToken = randomstring.generate();

    while (
      (await this.tokenModel.count({
        where: {
          token: {
            [Op.eq]: activationToken,
          },
        },
      })) != 0
    ) {
      activationToken = randomstring.generate();
    }

    await this.tokenModel.create({
      token: activationToken,
      for: "userActivation",
      value: newUser.id,
    });

    try {
      var htmlWelcomeMessage = this.messages.welcomeEmail(
        `${this.activationLink}${activationToken}`
      );
      await this.mailer
        .setToEmail(email)
        .setSubjct(this.activattionSubject)
        .setHtml(htmlWelcomeMessage)
        .send();
    } catch (err) {
      throw new CustomError(
        `Failed sending activation email, please try to reset password to get a new email`,
        StatusCodes.BAD_REQUEST
      );
    }

    return {
      message:
        "You have registered successfully, please click the link in your email to activate your account",
      registered: true,
    };
  }

  getSharedActions() {
    return getDefaultRoutes(this.req);
  }

  async getRefreshToken() {
    const sessionToken = this.req?.body?.sessionToken;

    const now = new Date();

    const token = await Token.findOne({
      where: {
        createdAt: {
          [Op.gte]: new Date(now.setDate(now.getDate() - 29)), // Greater than or equal to 29 days ago
        },
        token: sessionToken,
      },
    });

    if (token === null) {
      throw new CustomError(
        "session has offically expired",
        StatusCodes.NOTFOUND
      );
    }

    const user = await User.findOne({
      where: {
        id: token.value,
      },
    });

    if (user === null) {
      throw new CustomError(
        "session has offically expired",
        StatusCodes.NOTFOUND
      );
    }

    var newToken = randomstring.generate();

    while (
      (await this.tokenModel.count({
        where: {
          token: {
            [Op.eq]: newToken,
          },
        },
      })) != 0
    ) {
      newToken = randomstring.generate();
    }

    await this.tokenModel.create({
      token: newToken,
      for: "sessionToken",
      value: user.id,
    });

    return {
      message: "Token has been refreshed",
      refreshToken: sessionToken,
      user: user,
    };
  }

  async activateAccount() {
    const token = this.req?.body?.activationToken;

    const activationToken = await this.tokenModel.findOne({
      where: {
        token: {
          [Op.eq]: token.trim(),
        },
        for: {
          [Op.eq]: "userActivation",
        },
      },
    });

    if (activationToken === null) {
      throw new CustomError("Invalid token", StatusCodes.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({
      where: {
        id: Number(activationToken.value),
      },
    });

    if (user === null) {
      throw new CustomError("Invalid token", StatusCodes.BAD_REQUEST);
    }

    if (user.isActivated == 1) {
      throw new CustomError("User already activateed", StatusCodes.BAD_REQUEST);
    }

    activationToken.isDeleted = 1;

    await activationToken.save();

    user.isActivated = 1;

    await user.save();

    return {
      message: "Account has been activated",
    };
  }

  async closeAccount() {
    const user = this.user;

    if (user.isDeleted == 1) {
      throw new CustomError(
        "Not found or closed account",
        StatusCodes.NOTFOUND
      );
    }

    user.isDeleted = 1;

    await user.save();

    return {
      message: "Account deleted",
    };
  }

  async requestPasswordReset() {
    const email = this.req?.body?.email;

    const user = await this.userModel.findOne({
      where: {
        email: {
          [Op.eq]: email.trim(),
        },
      },
    });

    if (user === null) {
      throw new CustomError("User not found", StatusCodes.NOTFOUND);
    }

    if (user.isActivated != 1) {
      //send validation email
      try {
        var activationToken = randomstring.generate();

        while (
          (await this.tokenModel.count({
            where: {
              token: activationToken,
            },
          })) != 0
        ) {
          activationToken = randomstring.generate();
        }

        await this.tokenModel.create({
          token: activationToken,
          for: "userActivation",
          value: user.id,
        });

        var htmlWelcomeMessage = this.messages.welcomeEmail(
          `${this.activationLink}${activationToken}`
        );
        await this.mailer
          .setToEmail(email)
          .setSubjct(this.activattionSubject)
          .setHtml(htmlWelcomeMessage)
          .send();
        return {
          message:
            "You can not reset password for not activated accounts, please check your email we have sent you a new activation email",
        };
      } catch (err) {
        throw new CustomError(
          `Failed sending activation email, please try to reset password to get a new email`,
          StatusCodes.BAD_REQUEST
        );
      }
    }

    //password reset token
    var resetToken = randomstring.generate();

    while (
      (await this.tokenModel.count({
        where: {
          token: resetToken,
        },
      })) != 0
    ) {
      resetToken = randomstring.generate();
    }

    await this.tokenModel.create({
      token: resetToken,
      for: "resetToken",
      value: user.id,
    });

    var htmlResetPasswordMessage = this.messages.resetEmail(
      `${this.resetLink}${resetToken}`
    );
    await this.mailer
      .setToEmail(user.email)
      .setSubjct(this.resetSubject)
      .setHtml(htmlResetPasswordMessage)
      .send();
    return {
      message: "Password reset instruction has been sent to your email",
    };
  }

  async updatePasswordWithToken() {
    const resetToken = this.req?.body?.resetToken;
    const pass = this.req?.body?.pass;

    const token = await this.tokenModel.findOne({
      where: {
        token: {
          [Op.eq]: resetToken.trim(),
        },
        for: {
          [Op.eq]: "resetToken",
        },
      },
    });

    if (token === null) {
      throw new CustomError("invalid token", StatusCodes.NOTFOUND);
    }

    const user = await this.userModel.findOne({
      where: {
        id: Number(token.value),
      },
    });

    if (user === null) {
      throw new CustomError("invalid token", StatusCodes.NOTFOUND);
    }

    const hasher = new Hasher(pass);
    const hashedPass = hasher.getHash();

    user.pass = hashedPass;

    await user.save();

    token.isDeleted = 1;

    await token.save();

    return {
      message: "Your password has been updated",
    };
  }
}
