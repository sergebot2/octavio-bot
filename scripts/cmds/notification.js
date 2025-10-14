const { getStreamsFromAttachment } = global.utils;

module.exports = {
config: {
name: "notification",
aliases: ["notify", "noti"],
version: "1.7",
author: "NTKhang",
countDown: 5,
role: 2,
description: {
vi: "Gửi thông báo từ admin đến all box",
en: "Send notification from admin to all box"
},
category: "owner",
guide: {
en: "{pn} <tin nhắn>"
},
envConfig: {
delayPerGroup: 250
}
},

langs: {
vi: {
missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi đến tất cả các nhóm",
notification: "Thông báo từ admin bot đến tất cả nhóm chat (không phản hồi tin nhắn này)",
sendingNotification: "Bắt đầu gửi thông báo từ admin bot đến ʭɸʬ Sîmøn ʬɸʭ nhóm chat",
sentNotification: "✅ Đã gửi thông báo đến ʭɸʬ Sîmøn ʬɸʭ nhóm thành công",
errorSendingNotification: "Có lỗi xảy ra khi gửi đến ʭɸʬ Sîmøn ʬɸʭ nhóm:\n%2"
},
en: {
missingMessage: "Please enter the message you want to send to all groups",
notification: "●═════❍═════●\n🔔ɴᴏᴛɪғɪᴄᴀᴛɪᴏɴ ᴅᴇ ᴍᴇs sᴜᴘÉʀɪᴇᴜʀs📢\n●═════❍═════●\n●═════❍═════●\n➠ 𝕻𝖔𝖚𝖗 𝖈𝖔𝖓𝖙𝖆𝖈𝖙𝖊𝖗 𝖒𝖊𝖘 𝖘𝖚𝖕é𝖗𝖎𝖊𝖚𝖗𝖘, é𝖈𝖗𝖎𝖛𝖊𝖟 ¥𝖈𝖆𝖑𝖑𝖆𝖉 + 𝖛𝖔𝖙𝖗𝖊 𝖒𝖊𝖘𝖘𝖆𝖌𝖊 ",
sendingNotification: "𝐂𝐨𝐦𝐦𝐞𝐧𝐜𝐞𝐳 à 𝐞𝐧𝐯𝐨𝐲𝐞𝐫 𝐮𝐧𝐞 𝐧𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧 𝐝𝐮 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐭𝐞𝐮𝐫 𝐚𝐮𝐱 𝐠𝐫𝐨𝐮𝐩𝐞𝐬 𝐝𝐞 𝐝𝐢𝐬𝐜𝐮𝐬𝐬𝐢𝐨𝐧 %1",
sentNotification: "✅ Sent notification to groups successfully",
errorSendingNotification: "An error occurred while sending to   groups:\n%2"
}
},

onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang }) {
const { delayPerGroup } = envCommands[commandName];
if (!args[0])
return message.reply(getLang("missingMessage"));
const formSend = {
body: ${getLang("notification")}\n●═════❍═════●ْ\nُ\n╰----➤☬ 『${args.join(" ")}』 •••\n❮⧠❯━━━━━━━━━━❮◆❯,
attachment: await getStreamsFromAttachment(
[
...event.attachments,
...(event.messageReply?.attachments || [])
].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
)
};

const allThreadID = (await threadsData.getAll()).filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);
message.reply(getLang("sendingNotification", allThreadID.length));

let sendSucces = 0;
const sendError = [];
const wattingSend = [];

for (const thread of allThreadID) {
const tid = thread.threadID;
try {
wattingSend.push({
threadID: tid,
pending: api.sendMessage(formSend, tid)
});
await new Promise(resolve => setTimeout(resolve, delayPerGroup));
}
catch (e) {
sendError.push(tid);
}
}

for (const sended of wattingSend) {
try {
await sended.pending;
sendSucces++;
}
catch (e) {
const { errorDescription } = e;
if (!sendError.some(item => item.errorDescription == errorDescription))
sendError.push({
threadIDs: [sended.threadID],
errorDescription
});
else
sendError.find(item => item.errorDescription == errorDescription).threadIDs.push(sended.threadID);
}
}

let msg = "";
if (sendSucces > 0)
msg += getLang("sentNotification", sendSucces) + "\n";
if (sendError.length > 0)
msg += getLang("errorSendingNotification", sendError.reduce((a, b) => a + b.threadIDs.length, 0), sendError.reduce((a, b) => a + \n - ${b.errorDescription}\n + ${b.threadIDs.join("\n + ")}, ""));
message.reply(msg
                  );
}
};
