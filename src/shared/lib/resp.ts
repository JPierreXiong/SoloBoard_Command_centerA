export function respData(data: any) {
  return respJson(0, 'ok', data || []);
}

export function respOk() {
  return respJson(0, 'ok');
}

export function respErr(message: string, statusCode?: number) {
  const response = respJson(-1, message);
  if (statusCode) {
    return new Response(response.body, {
      status: statusCode,
      headers: response.headers,
    });
  }
  return response;
}

export function respJson(code: number, message: string, data?: any) {
  let json = {
    code: code,
    message: message,
    data: data,
  };
  if (data) {
    json['data'] = data;
  }

  return Response.json(json);
}
