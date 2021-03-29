interface Response {
  responseCode: string;
  responseMessage: string;
}

export interface GetProjectListResponse extends Response {
  data: {
    _id?: string;
    lovId_key3?: string;
    lovType_key2?: string;
    lovCode_key0?: string;
    lovName_data?: string;
    lovVal01_data?: string;
    lovVal02_data?: string;
    lovVal11_data?: string;
    lovVal12_data?: string;
    activeFlg_key1?: string;
    textDesc_data?: string;
    orderBy_data?: string;
    created_data?: string;
    createdBy_data?: string;
    lastUpd_data?: string;
    lastUpdBy_data?: string;
  }[];
}

export interface GetFunctionListResponse extends Response {
  data: {
    _id?: string;
    projectCode?: string;
    projectName?: string;
    functionCode?: string;
    functionDesc?: string;
    activeFlg?: string;
  }[];
}
