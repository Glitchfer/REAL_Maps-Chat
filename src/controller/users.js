const {
  postLogin,
  registerUser,
  checkUser,
  checkUserName,
  checkUserPhone,
  getUser,
  getUserById,
  patchUser,
  patchLogout,
} = require("../model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helper = require("../helper/index");
const redis = require("redis");
const client = redis.createClient();
const fs = require("fs");

module.exports = {
  loginUser: async (request, response) => {
    try {
      const { user_email, user_password } = request.body;
      const checkDataUsers = await checkUser(user_email);
      if (checkDataUsers.length >= 1) {
        const checkPassword = bcrypt.compareSync(
          user_password,
          checkDataUsers[0].user_password
        );
        if (checkPassword === true) {
          const {
            user_id,
            user_email,
            user_name,
            user_phone,
            user_address,
            user_login_status,
            user_account_status,
          } = checkDataUsers[0];
          let payload = {
            user_id,
            user_email,
            user_name,
            user_phone,
            user_address,
            user_login_status,
            user_account_status,
          };
          const token = jwt.sign(payload, "RAHASIA", { expiresIn: "1h" });
          payload = { ...payload, token };
          console.log(payload);

          const loginInfo = {
            user_id: checkDataUsers[0].user_id,
            name: checkDataUsers[0].user_name,
            email: checkDataUsers[0].user_email,
            phone: checkDataUsers[0].user_phone,
            login: new Date(),
          };
          const result = await postLogin(loginInfo);
          return helper.response(
            response,
            200,
            "Login success",
            payload,
            result
          );
        } else {
          return helper.response(response, 400, "Invalid password");
        }
      } else {
        return helper.response(response, 400, "Email not registered");
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  registerUser: async (request, response) => {
    const { register } = request.params;
    const { user_name, user_email, user_phone, user_password } = request.body;
    const requirement = (user_password) => {
      let decimal = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
      if (user_password.match(decimal)) {
        return true;
      } else {
        return false;
      }
    };
    const salt = bcrypt.genSaltSync(10);
    const encryptPassword = bcrypt.hashSync(user_password, salt);
    const setData = {
      user_name,
      user_email,
      user_phone,
      user_password: encryptPassword,
      user_login_status: 0,
      user_account_status: 0,
      user_created: new Date(),
    };
    try {
      const checkPassword = bcrypt.compareSync(
        user_password,
        "$2b$10$N0X3QRtZ7vMgZLVjHKKvrunzJJ4HILSnopuziHM517ewSnOr3Ugx6"
      );
      if (
        user_email === "" ||
        user_name === "" ||
        user_phone === "" ||
        checkPassword === true
      ) {
        return helper.response(
          response,
          400,
          "Invalid Input, All Of Data Must Be Filled"
        );
      } else {
        if (requirement(user_password) === false) {
          return helper.response(
            response,
            400,
            `Password must be at least has minimum 8 character length, with one lowercase, one uppercase, one number and one special character`
          );
        } else {
          const checkPhone = await checkUserPhone(user_phone);
          if (checkPhone.length > 0) {
            return helper.response(
              response,
              400,
              `Same name detected, please use other name`
            );
          } else {
            const checkDataUsers = await checkUser(user_email);
            if (checkDataUsers.length < 1) {
              const result = await registerUser(setData);
              return helper.response(response, 200, "Register Success", result);
            } else {
              return helper.response(response, 400, `Email already registered`);
            }
          }
        }
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
      console.log(error);
    }
  },
  activationUser: async (request, response) => {
    try {
      const { id } = request.params;
      const { user_password, user_account_status } = request.body;
      const requirement = (user_password) => {
        let decimal = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
        if (user_password.match(decimal)) {
          return true;
        } else {
          return false;
        }
      };
      const salt = bcrypt.genSaltSync(10);
      const encryptPassword = bcrypt.hashSync(user_password, salt);
      const checkId = await getUserById(id);
      if (user_password.length > 0 && requirement(user_password) === false) {
        return helper.response(
          response,
          400,
          `Password must be at least has minimum 8 character length, with one lowercase, one uppercase, one number and one special character`
        );
      } else {
        if (user_account_status === "") {
          return helper.response(
            response,
            404,
            `User account status must be filled`
          );
        } else {
          if (checkId.length > 0) {
            const setData = {
              user_password:
                user_password.length < 1
                  ? checkId[0].user_password
                  : encryptPassword,
              user_account_status,
              user_updated: new Date(),
            };
            console.log(user_password);
            console.log(setData);
            const result = await patchUser(setData, id);
            return helper.response(response, 201, "User Updated", result);
          } else {
            return helper.response(
              response,
              404,
              `User By Id: ${id} Not Found`
            );
          }
        }
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
      console.log(error);
    }
  },
  patchLogout: async (request, response) => {
    let { activity_id, user_id } = request.query;
    const setData = {
      logout: new Date(),
    };
    const checkId = await getUserById(user_id);
    console.log(checkId);
    try {
      if (checkId.length > 0) {
        const result = await patchLogout(setData, activity_id);
        return helper.response(response, 201, "Logout Success", result);
      } else {
        return helper.response(
          response,
          404,
          `User By Id: ${user_id} Not Found`
        );
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
      console.log(error);
    }
  },
  getUser: async (request, response) => {
    try {
      client.setex(`user`, 120, JSON.stringify(result));
      const result = await getUser();
      return helper.response(response, 200, "Get Success", result);
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  getUserById: async (request, response) => {
    try {
      const { id } = request.params;
      const result = await getUserById(id);
      if (result.length > 0) {
        client.setex(`userbyid:${id}`, 120, JSON.stringify(result));
        return helper.response(response, 200, "Get User By Id Success", result);
      } else {
        return helper.response(response, 404, `User By Id: ${id} Not Found`);
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  getUserByName: async (request, response) => {
    try {
      const { name } = request.params;
      const result = await getUserByName(name);
      if (result.length > 0) {
        client.setex(`userbyname:${name}`, 120, JSON.stringify(result));
        return helper.response(
          response,
          200,
          "Get User By Name Success",
          result
        );
      } else {
        return helper.response(
          response,
          404,
          `User By Name: ${name} Not Found`
        );
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  getUserByPhone: async (request, response) => {
    try {
      const { phone } = request.params;
      const result = await getUserByPhone(phone);
      if (result.length > 0) {
        client.setex(`userbyphone:${phone}`, 120, JSON.stringify(result));
        return helper.response(
          response,
          200,
          "Get User By Phone Success",
          result
        );
      } else {
        return helper.response(
          response,
          404,
          `User By Phone: ${phone} Not Found`
        );
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
};
