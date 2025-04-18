import { use, useEffect, useRef, useState } from "react";
import AddChatModal from "../components/chat/AddChatModal";
import { getChatObjectMetadata, LocalStorage, requestHandler } from "../utils";
import { getChatMessages, getUserChats } from "../api";
import {
  ChatListItemInterface,
  ChatMessageInterface,
} from "../interfaces/chat";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Typing from "../components/chat/Typing";
import ChatItem from "../components/chat/ChatItem";
import { useSocket } from "../context/SocketContext";

const CONNECTED_EVENT = "connected";
const DISCONNECT_EVENT = "disconnect";
const JOIN_CHAT_EVENT = "joinChat";
const NEW_CHAT_EVENT = "newChat";
const TYPING_EVENT = "typing";
const STOP_TYPING_EVENT = "stopTyping";
const MESSAGE_RECEIVED_EVENT = "messageReceived";
const LEAVE_CHAT_EVENT = "leaveChat";
const UPDATE_GROUP_NAME_EVENT = "updateGroupName";
const MESSAGE_DELETE_EVENT = "messageDeleted";

const ChatPage = () => {
  const { user, logout } = useAuth();

  const { socket } = useSocket(); // Get the socket instance from the context

  const [messages, setMessages] = useState<ChatMessageInterface[]>([]); // To manage the message input

  const [loadingMessages, setLoadingMessages] = useState(false); // To indicate loading of messages

  const [message, setMessage] = useState<string>(""); // To manage the message input

  const [openAddChat, setOpenAddChat] = useState(false); // To control the 'Add Chat' modal

  const [loadingChats, setLoadingChats] = useState(false); // To indicate loading of chats

  const [chats, setChats] = useState<ChatListItemInterface[]>([]); // To store user's chats

  const [localSearchQuery, setLocalSearchQuery] = useState<string>(""); // To manage local search query

  const currentChat = useRef<ChatListItemInterface | null>(null);

  const [isConnected, setIsConnected] = useState(false); // To track socket connection status
  const [isTyping, setIsTyping] = useState(false); // To track typing status
  const [loading, setLoading] = useState(false); // To manage loading state

  const [unreadMessages, setUnreadMessages] = useState<ChatMessageInterface[]>(
    []
  ); // To track unread messages

  /**
   *  A  function to update the last message of a specified chat to update the chat list
   */
  const updateChatLastMessage = (
    chatToUpdateId: string,
    message: ChatMessageInterface // The new message to be set as the last message
  ) => {
    // Search for the chat with the given ID in the chats array
    const chatToUpdate = chats.find((chat) => chat._id === chatToUpdateId)!;

    // Update the 'lastMessage' field of the found chat with the new message
    chatToUpdate.lastMessage = message;

    // Update the 'updatedAt' field of the chat with the 'updatedAt' field from the message
    chatToUpdate.updatedAt = message?.updatedAt;

    // Update the state of chats, placing the updated chat at the beginning of the array
    setChats([
      chatToUpdate, // Place the updated chat first
      ...chats.filter((chat) => chat._id !== chatToUpdateId), // Include all other chats except the updated one
    ]);
  };

  const onConnect = () => {
    setIsConnected(true);
  };

  const onDisconnect = () => {
    setIsConnected(false);
  };

  /**
   *A function to update the chats last message specifically in case of deletion of message *
   **/

  const updateChatLastMessageOnDeletion = (
    chatToUpdateId: string, //ChatId to find the chat
    message: ChatMessageInterface //The deleted message
  ) => {
    // Search for the chat with the given ID in the chats array
    const chatToUpdate = chats.find((chat) => chat._id === chatToUpdateId)!;

    //Updating the last message of chat only in case of deleted message and chats last message is same
    if (chatToUpdate.lastMessage?._id === message._id) {
      requestHandler(
        async () => getChatMessages(chatToUpdateId),
        null,
        (req) => {
          const { data } = req;

          chatToUpdate.lastMessage = data[0];
          setChats([...chats]);
        },
        alert
      );
    }
  };

  /**
   * Handles the "typing" event on the socket.
   */
  const handleOnSocketTyping = (chatId: string) => {
    // Check if the typing event is for the currently active chat.
    if (chatId !== currentChat.current?._id) return;

    // Set the typing state to true for the current chat.
    setIsTyping(true);
  };

  const onMessageDelete = (message: ChatMessageInterface) => {
    if (message?.chat !== currentChat.current?._id) {
      setUnreadMessages((prev) =>
        prev.filter((msg) => msg._id !== message._id)
      );
    } else {
      setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
    }

    updateChatLastMessageOnDeletion(message.chat, message);
  };

  /**
   * Handles the event when a new message is received.
   */
  const onMessageReceived = (message: ChatMessageInterface) => {
    // Check if the received message belongs to the currently active chat
    if (message?.chat !== currentChat.current?._id) {
      // If not, update the list of unread messages
      setUnreadMessages((prev) => [message, ...prev]);
    } else {
      // If it belongs to the current chat, update the messages list for the active chat
      setMessages((prev) => [message, ...prev]);
    }

    // Update the last message for the chat to which the received message belongs
    updateChatLastMessage(message.chat || "", message);
  };
  /**
   * Handles the "stop typing" event on the socket.
   */
  const handleOnSocketStopTyping = (chatId: string) => {
    // Check if the stop typing event is for the currently active chat.
    if (chatId !== currentChat.current?._id) return;

    // Set the typing state to false for the current chat.
    setIsTyping(false);
  };

  const getChats = async () => {
    requestHandler(
      async () => await getUserChats(),
      setLoadingChats,
      (res) => {
        const { data } = res;
        setChats(data || []);
      },
      alert
    );
  };

  const onNewChat = (chat: ChatListItemInterface) => {
    setChats((prev) => [chat, ...prev]);
  };

  // This function handles the event when a user leaves a chat.
  const onChatLeave = (chat: ChatListItemInterface) => {
    // Check if the chat the user is leaving is the current active chat.
    if (chat._id === currentChat.current?._id) {
      // If the user is in the group chat they're leaving, close the chat window.
      currentChat.current = null;
      // Remove the currentChat from local storage.
      LocalStorage.remove("currentChat");
    }
    // Update the chats by removing the chat that the user left.
    setChats((prev) => prev.filter((c) => c._id !== chat._id));
  };

  const getMessages = async () => {
    // Check if a chat is selected, if not, show an alert
    if (!currentChat.current?._id) return alert("No chat is selected");

    // Check if socket is available, if not, show an alert
    if (!socket) return alert("Socket not available");

    // Emit an event to join the current chat
    socket.emit(JOIN_CHAT_EVENT, currentChat.current?._id);

    // Filter out unread messages from the current chat as those will be read
    setUnreadMessages(
      unreadMessages.filter((msg) => msg.chat !== currentChat.current?._id)
    );

    // Make an async request to fetch chat messages for the current chat
    requestHandler(
      // Fetching messages for the current chat
      async () => await getChatMessages(currentChat.current?._id || ""),
      // Set the state to loading while fetching the messages
      setLoadingMessages,
      // After fetching, set the chat messages to the state if available
      (res) => {
        const { data } = res;
        setMessages(data || []);
      },
      // Display any error alerts if they occur during the fetch
      alert
    );
  };

  // Function to handle changes in group name
  const onGroupNameChange = (chat: ChatListItemInterface) => {
    // Check if the chat being changed is the currently active chat
    if (chat._id === currentChat.current?._id) {
      // Update the current chat with the new details
      currentChat.current = chat;

      // Save the updated chat details to local storage
      LocalStorage.set("currentChat", chat);
    }

    // Update the list of chats with the new chat details
    setChats((prev) => [
      // Map through the previous chats
      ...prev.map((c) => {
        // If the current chat in the map matches the chat being changed, return the updated chat
        if (c._id === chat._id) {
          return chat;
        }
        // Otherwise, return the chat as-is without any changes
        return c;
      }),
    ]);
  };

  useEffect(() => {
    // Fetch the chat list from the server.
    getChats();

    // Retrieve the current chat details from local storage.
    const _currentChat = LocalStorage.get("currentChat");

    // If there's a current chat saved in local storage:
    if (_currentChat) {
      // Set the current chat reference to the one from local storage.
      currentChat.current = _currentChat;
      // If the socket connection exists, emit an event to join the specific chat using its ID.
      socket?.emit(JOIN_CHAT_EVENT, _currentChat.current?._id);
      // Fetch the messages for the current chat.
      getMessages();
    }
    // An empty dependency array ensures this useEffect runs only once, similar to componentDidMount.
  }, []);

  // This useEffect handles the setting up and tearing down of socket event listeners.
  useEffect(() => {
    // If the socket isn't initialized, we don't set up listeners.
    if (!socket) return;

    // Set up event listeners for various socket events:
    // Listener for when the socket connects.
    socket.on(CONNECTED_EVENT, onConnect);
    // Listener for when the socket disconnects.
    socket.on(DISCONNECT_EVENT, onDisconnect);
    // Listener for when a user is typing.
    socket.on(TYPING_EVENT, handleOnSocketTyping);
    // Listener for when a user stops typing.
    socket.on(STOP_TYPING_EVENT, handleOnSocketStopTyping);
    // Listener for when a new message is received.
    socket.on(MESSAGE_RECEIVED_EVENT, onMessageReceived);
    // Listener for the initiation of a new chat.
    socket.on(NEW_CHAT_EVENT, onNewChat);
    // Listener for when a user leaves a chat.
    socket.on(LEAVE_CHAT_EVENT, onChatLeave);
    // Listener for when a group's name is updated.
    socket.on(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
    //Listener for when a message is deleted
    socket.on(MESSAGE_DELETE_EVENT, onMessageDelete);
    // When the component using this hook unmounts or if `socket` or `chats` change:
    return () => {
      // Remove all the event listeners we set up to avoid memory leaks and unintended behaviors.
      socket.off(CONNECTED_EVENT, onConnect);
      socket.off(DISCONNECT_EVENT, onDisconnect);
      socket.off(TYPING_EVENT, handleOnSocketTyping);
      socket.off(STOP_TYPING_EVENT, handleOnSocketStopTyping);
      socket.off(MESSAGE_RECEIVED_EVENT, onMessageReceived);
      socket.off(NEW_CHAT_EVENT, onNewChat);
      socket.off(LEAVE_CHAT_EVENT, onChatLeave);
      socket.off(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
      socket.off(MESSAGE_DELETE_EVENT, onMessageDelete);
    };

    // Note:
    // The `chats` array is used in the `onMessageReceived` function.
    // We need the latest state value of `chats`. If we don't pass `chats` in the dependency array,
    // the `onMessageReceived` will consider the initial value of the `chats` array, which is empty.
    // This will not cause infinite renders because the functions in the socket are getting mounted and not executed.
    // So, even if some socket callbacks are updating the `chats` state, it's not
    // updating on each `useEffect` call but on each socket call.
  }, [socket, chats]);

  return (
    <div>
      <AddChatModal
        open={openAddChat}
        onClose={() => {
          setOpenAddChat(false);
        }}
        onSuccess={() => {
          getChats();
        }}
      />

      <div className="w-full justify-between items-stretch h-screen flex flex-shrink-0">
        <div className="w-1/3 relative ring-white overflow-y-auto px-4">
          <div className="z-10 w-full sticky top-0 bg-dark py-4 flex justify-between items-center gap-4">
            <button
              type="button"
              className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-xl text-sm px-5 py-4 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 flex-shrink-0"
              onClick={logout}
            >
              Log Out
            </button>

            <Input
              placeholder="Search user or group..."
              value={localSearchQuery}
              onChange={(e) =>
                setLocalSearchQuery(e.target.value.toLowerCase())
              }
            />
            <button
              type="button"
              onClick={() => setOpenAddChat(true)}
              className="rounded-xl border-none bg-primary text-white py-4 px-5 flex flex-shrink-0"
            >
              + Add chat
            </button>

            {loadingChats ? (
              <div className="flex justify-center items-center h-[calc(100%-88px)]">
                <Typing />
              </div>
            ) : (
              [...chats]
                // Filtering chats based on a local search query
                .filter((chat) =>
                  // If there's a localSearchQuery, filter chats that contain the query in their metadata title
                  localSearchQuery
                    ? getChatObjectMetadata(chat, user!)
                        .title?.toLocaleLowerCase()
                        ?.includes(localSearchQuery)
                    : // If there's no localSearchQuery, include all chats
                      true
                )
                .map((chat) => {
                  return (
                    <ChatItem
                      chat={chat}
                      isActive={chat._id === currentChat.current?._id}
                      unreadCount={
                        unreadMessages.filter((n) => n.chat === chat._id).length
                      }
                      onClick={(chat) => {
                        if (
                          currentChat.current?._id &&
                          currentChat.current?._id === chat._id
                        )
                          return;
                        LocalStorage.set("currentChat", chat);
                        currentChat.current = chat;
                        setMessage("");
                        getMessages();
                      }}
                      key={chat._id}
                      onChatDelete={(chatId) => {
                        setChats((prev) =>
                          prev.filter((chat) => chat._id !== chatId)
                        );
                        if (currentChat.current?._id === chatId) {
                          currentChat.current = null;
                          LocalStorage.remove("currentChat");
                        }
                      }}
                    />
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
