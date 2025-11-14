export function errorRes(res, status = 400, message = 'error') {
  return res.status(status).json({ status: false, message });
}

export function okRes(res, data) {
  return res.status(200).json({ status: true, data });
}
