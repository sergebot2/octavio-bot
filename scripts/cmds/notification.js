const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "4.0",
    author: "NTKhang & Dark Reforge",
    countDown: 5,
    role: 2,
    description: {
      vi: "Gửi thông báo từ admin đến all box",
      en: "Send an ultra-styled royal dark notification from admin to all groups"
    },
    category: "owner",
    guide: {
      en: "{pn} <message>"
    },
    envConfig: {
      delayPerGroup: 250,
      adminName: "Sîmøn" // ⚜️ Le nom de ton admin s’affiche ici
    }
  },

  langs: {
    en: {
      missingMessage: "☠️ Enter the message you wish to proclaim across the dominions...",
      notification:
`╔══════════════════════════════════════╗
║        ✧ 𝐃𝐀𝐑𝐊 𝐑𝐎𝐘𝐀𝐋𝐄 𝐃𝐄𝐂𝐑𝐄𝐄 ✧        ║
╠══════════════════════════════════════╣
║     The Supreme Voice of Shadows     ║
║         descends upon all realms.    ║
╚══════════════════════════════════════╝`,
      sendingNotification: "🌒 Shadows awaken... Sending decree to %1 dominions...",
      sentNotification: "✅ The decree has been delivered to %1 realms successfully.",
      errorSendingNotification: "⚠️ Some dominions resisted the decree (%1):\n%2"
    },

    vi: {
      missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi đến tất cả nhóm",
      notification:
`╔══════════════════════════════════════╗
║       ✧ 𝐓𝐇𝐎̂𝐍𝐆 𝐁𝐀́𝐎 𝐇𝐎𝐀̀𝐍 𝐆𝐈𝐀𝐎 ✧       ║
╠══════════════════════════════════════╣
║     𝐀𝐝𝐦𝐢𝐧 𝐁𝐨𝐭 đ𝐚̃ đ𝐚́𝐧𝐡 𝐭𝐡𝐮𝐜 𝐬𝐮̛̣ 𝐛𝐚́𝐨     ║
║     đ𝐞̂́𝐧 𝐭𝐚̂́𝐭 𝐜𝐚̉ 𝐧𝐡𝐨́𝐦 𝐭𝐫𝐨𝐧𝐠 𝐛𝐨́𝐧𝐠 𝐭𝐨̂́𝐢. ║
╚══════════════════════════════════════╝`,
      sendingNotification: "🌑 Đang lan truyền sắc lệnh đến %1 nhóm...",
      sentNotification: "✅ Đã gửi sắc lệnh thành công đến %1 nhóm.",
      errorSendingNotification: "⚠️ Lỗi khi gửi đến %1 nhóm:\n%2"
    }
  },

  onStart: async function ({
    message,
    api,
    event,
    args,
    commandName,
    envCommands,
    threadsData,
    getLang
  }) {
    const { delayPerGroup, adminName } = envCommands[commandName];
    if (!args[0]) return message.reply(getLang("missingMessage"));

    const content = args.join(" ");
    const formSend = {
      body:
`╔══════════════════════════════════════╗
║       ☬ 𝐃𝐄𝐂𝐑𝐄𝐄 𝐎𝐅 𝐓𝐇𝐄 𝐒𝐎𝐕𝐄𝐑𝐄𝐈𝐆𝐍 ☬       ║
╠══════════════════════════════════════╣
║ 🜂  ${content}  
╠══════════════════════════════════════╣
║   👑  Issued by: ${adminName}  
║   ⚔  𝕿𝖍𝖊 𝕮𝖔𝖉𝖊 𝖘𝖍𝖆𝖑𝖑 𝖇𝖊 𝖔𝖇𝖊𝖞𝖊𝖉.  
╚══════════════════════════════════════╝
⚝  𝕿𝖍𝖊 𝕶𝖎𝖓𝖌 𝖔𝖋 𝕭𝖞𝖙𝖊𝖘 𝖍𝖆𝖘 𝖘𝖕𝖔𝖐𝖊𝖓. ⚝`,
      attachment: await getStreamsFromAttachment(
        [
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ].filter(item =>
          ["photo", "png", "animated_image", "video", "audio"].includes(item.type)
        )
      )
    };

    const allThreadID = (await threadsData.getAll()).filter(
      t =>
        t.isGroup &&
        t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup
    );

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
      } catch (e) {
        sendError.push(tid);
      }
    }

    for (const sended of wattingSend) {
      try {
        await sended.pending;
        sendSucces++;
      } catch (e) {
        const { errorDescription } = e;
        if (!sendError.some(item => item.errorDescription == errorDescription))
          sendError.push({
            threadIDs: [sended.threadID],
            errorDescription
          });
        else
          sendError
            .find(item => item.errorDescription == errorDescription)
            .threadIDs.push(sended.threadID);
      }
    }

    let msg = "";
    if (sendSucces > 0)
      msg += getLang("sentNotification", sendSucces) + "\n";
    if (sendError.length > 0)
      msg += getLang(
        "errorSendingNotification",
        sendError.reduce((a, b) => a + b.threadIDs.length, 0),
        sendError.reduce(
          (a, b) =>
            a +
            `\n - ${b.errorDescription}\n + ${b.threadIDs.join("\n + ")}`,
          ""
        )
      );
    message.reply(msg);
  }
};
