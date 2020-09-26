const {
  getChatList,
  postChatList,
  postChat,
  patchChatList,
  getChatHistory,
  getChatHistoryLanjutan,
} = require("../model/chat");
const helper = require("../helper/index");
module.exports = {
  getChatList: async (request, response) => {
    const { id } = request.params;

    try {
      const result = await getChatList(id);
      if (result.length >= 1) {
        return helper.response(response, 200, "Get Success", result);
      } else {
        return helper.response(response, 400, "You dont have any chat yet");
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  getChatRoom: async (request, response) => {
    const { chat_history } = request.params;
    let { user_id, friend_id } = request.body;
    try {
      const result = await getChatHistory(user_id, friend_id);
      if (result.length >= 1) {
        return helper.response(response, 200, "Get Success", result);
      } else {
        return helper.response(response, 400, "You dont have any chat yet");
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  getChatRoomLanjutan: async (request, response) => {
    const { room } = request.params;
    let { room_id } = request.body;
    try {
      const result = await getChatHistoryLanjutan(room_id);
      if (result.length >= 1) {
        return helper.response(response, 200, "Get Success", result);
      } else {
        return helper.response(response, 400, "You dont have any chat yet");
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  postChatList: async (request, response) => {
    const { sender_id, friend_id, message } = request.body;
    const chat_id = Math.floor(Math.random() * 10000);
    const setData = {
      sender_id,
      friend_id,
      room_id: chat_id,
      status: 2,
    };

    const setData2 = {
      room_id: chat_id,
      sender_id,
      receiver_id: friend_id,
      message,
      created: new Date(),
      chat_status: 0,
    };
    try {
      const checkRoom = await getChatHistory(sender_id, friend_id);

      if (checkRoom.length < 1) {
        console.log("anda akan membuat chat room baru!");
        const result = await postChatList(setData);
        const result2 = await postChat(setData2);
        return helper.response(
          response,
          200,
          "Create message success",
          result,
          result2
        );
      } else {
        const setData3 = {
          room_id: checkRoom[0].room_id,
          sender_id,
          receiver_id: friend_id,
          message,
          created: new Date(),
          chat_status: 0,
        };
        console.log(setData3);
        const result3 = await postChat(setData3);
        return helper.response(
          response,
          200,
          "Create message success",
          result3
        );
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
    }
  },
  patchChatList: async (request, response) => {
    const { invitation } = request.params;
    let { user_id, sender_id, response_status } = request.body;
    const setData = {
      created: new Date(),
      invite_status: 1,
      response_status,
    };
    const setData2 = {
      response_status,
      friend_created: new Date(),
    };
    const setData3 = {
      user_id,
      friend_id: sender_id,
      response_status,
      friend_created: new Date(),
    };
    try {
      const checkFriend = await checkFriendConnection(user_id, sender_id);
      if (checkFriend.length > 0) {
        return helper.response(
          response,
          400,
          "Both of you are friend",
          checkFriend
        );
      } else {
        if (response_status === 0) {
          const result = await patchInvitation(setData, user_id, sender_id);
          const result2 = await patchFriend(setData2, user_id, sender_id);
          return helper.response(
            response,
            201,
            "Patch Success",
            result,
            result2
          );
        } else {
          const result = await patchInvitation(setData, user_id, sender_id);
          const result2 = await patchFriend(setData2, user_id, sender_id);
          const result3 = await postNewFriend(setData3);
          return helper.response(
            response,
            201,
            "Patch Success",
            result,
            result2,
            result3
          );
        }
      }
    } catch (error) {
      return helper.response(response, 400, "Bad Request", error);
      console.log(error);
    }
  },
};
