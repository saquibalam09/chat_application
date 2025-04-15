export const DB_NAME = "freeapi";

/**
 * @type {{ ADMIN: "ADMIN"; USER: "USER"} as const}
 */
export const UserRolesEnum = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes
/**
 * @type {{ GOOGLE: "GOOGLE"; GITHUB: "GITHUB"; EMAIL_PASSWORD: "EMAIL_PASSWORD"} as const}
 */
export const UserLoginType = {
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);
/**
 * @description set of events that we are using in chat app. more to be added as we develop the chat app
 */
export const ChatEventEnum = Object.freeze({
  // ? once user is ready to go
  CONNECTED_EVENT: "connected",
  // ? when user gets disconnected
  DISCONNECT_EVENT: "disconnect",
  // ? when user joins a socket room
  JOIN_CHAT_EVENT: "joinChat",
  // ? when participant gets removed from group, chat gets deleted or leaves a group
  LEAVE_CHAT_EVENT: "leaveChat",
  // ? when admin updates a group name
  UPDATE_GROUP_NAME_EVENT: "updateGroupName",
  // ? when new message is received
  MESSAGE_RECEIVED_EVENT: "messageReceived",
  // ? when there is new one on one chat, new group chat or user gets added in the group
  NEW_CHAT_EVENT: "newChat",
  // ? when there is an error in socket
  SOCKET_ERROR_EVENT: "socketError",
  // ? when participant stops typing
  STOP_TYPING_EVENT: "stopTyping",
  // ? when participant starts typing
  TYPING_EVENT: "typing",
  // ? when message is deleted
  MESSAGE_DELETE_EVENT: "messageDeleted",
});

// Object.freeze({}) is a method in JavaScript that prevents modification of an object. When you freeze an object, you make it immutable, meaning that you cannot add, delete, or change any of its properties.

// In your example, the object contains constants related to events in a chat application. By using Object.freeze, you're ensuring that these event names remain constant and can't be accidentally modified elsewhere in your code, which helps maintain consistency and avoid bugs.

// Here's a brief breakdown of what Object.freeze does:

// Prevents Addition of Properties: You can't add new properties to the frozen object.
// Prevents Deletion of Properties: You can't delete existing properties from the frozen object.
// Prevents Modification of Properties: You can't change the values of existing properties.
// Attempting to modify a frozen object will not throw an error in non-strict mode, but it will silently fail. In strict mode, it will throw a TypeError.

export const AvailableChatEvents = Object.keys(ChatEventEnum);
// console.log(AvailableChatEvents);

export const AvailableSocialLogins = Object.values(UserLoginType);
