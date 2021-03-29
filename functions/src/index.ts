import * as functions from "firebase-functions";
import moment = require("moment");
import * as request from "request-promise";
import type { GetFunctionListResponse, GetProjectListResponse } from "./types";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

const LINE_MESSAGING_API = `https://api.line.me/v2/bot/message/`;
const TIMESHEET_API: string = functions.config().timesheet.url || "";
const CHANNAL_TOKEN: string =
  functions.config().timesheet.line_channel_secret || "";
const USER_ID: string = functions.config().timesheet.user_id || "";

const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${CHANNAL_TOKEN}`,
};

export const timesheet = functions.https.onRequest(async (req, res) => {
  try {
    functions.logger.info("Timesheet is called!");

    functions.logger.info("Req body");
    functions.logger.info(req.body);

    if (req.body.events.length < 1) {
      functions.logger.info("Checking...");

      return res.send("OK!");
    }

    const replyToken = req.body.events[0].replyToken as string;
    const message = req.body.events[0].message.text as string;
    const messageType = req.body.events[0].message.type as string;

    if (!TIMESHEET_API) {
      throw new Error("No api in configuration");
    }

    if (!CHANNAL_TOKEN) {
      throw new Error("No channal token in configuration");
    }

    if (!USER_ID) {
      throw new Error("No User ID in configuration");
    }

    if (messageType !== "text") {
      throw new Error("Data is not text");
    }

    if (message.toLowerCase().includes("projects")) {
      functions.logger.info("Getting Project list");

      const data = await getProjects();

      return await reply(replyToken, data.join("\n\r"));
    }

    if (message.toLowerCase().includes("functions")) {
      functions.logger.info("Getting Function list");

      const filteredMessage = message.replace("functions ", "");

      const data = await getFunctions(filteredMessage);

      return await reply(replyToken, JSON.stringify(data));
    }

    if (message.toLowerCase().includes("add_routine")) {
      functions.logger.info("Create Routine");

      const filteredMessage = message.replace("add_routine ", "");

      const query = filteredMessage.split("|");

      if (query.length !== 5) {
        throw new Error("Query length is not fullfiled");
      }

      await addRoutine(query);

      return await reply(replyToken, "Create timesheet success!");
    }

    throw new Error("No Data");
  } catch (error) {
    functions.logger.error("Has Error!");

    functions.logger.error(error);

    await reply(req.body.events[0].replyToken, `Fail!: ${error.message}`);
  }
});

async function getProjects() {
  const response: GetProjectListResponse = await request({
    method: `GET`,
    uri: `${TIMESHEET_API}/getEmployee-project-list?idUser=130`,
    json: true,
  });

  functions.logger.debug(response);

  return response.data.map((item) => item.lovCode_key0);
}

async function getFunctions(project: string) {
  const response: GetFunctionListResponse = await request({
    method: `GET`,
    uri: `${TIMESHEET_API}/function-project?projectCode=${project}&activeFlg=Y`,
    json: true,
  });

  functions.logger.debug(response);

  return response.data.map((item) => ({
    name: item.functionDesc,
    code: item.functionCode,
  }));
}

async function addRoutine(req: string[]) {
  const projectCode = req[0];
  const functionCode = req[1];
  const startTime = req[2].padStart(2, "0");
  const endTime = req[3].padStart(2, "0");
  const detail = req[4];

  // delete a hours because it's a lunch time
  const diff =
    moment(endTime, "HH:mm").diff(moment(startTime, "HH:mm"), "minutes") - 60;

  const payload = {
    message: [
      {
        idRoutine: "",
        projectCode,
        idUser: USER_ID,
        date: moment().format("DD-MM-YYYY"),
        startTime,
        endTime,
        detail,
        ot: false,
        otDetail: [],
        month: moment().format("MMMM"),
        time: diff,
        timesOt: "",
        monthOrder: "",
        year: "",
        c: "",
        functionCode,
        specialCaseCode: "",
        createBy: "SURASAK.C",
        createDate: new Date().toISOString(),
      },
    ],
  };

  await request({
    method: `POST`,
    uri: `${TIMESHEET_API}/postRoutine`,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function reply(replyToken: string, text: string) {
  return await request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: `text`,
          text,
        },
      ],
    }),
  });
}
