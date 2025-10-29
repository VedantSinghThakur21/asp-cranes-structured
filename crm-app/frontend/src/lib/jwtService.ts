// Frontend stub for jwtService
// In production, JWT operations should be handled by the backend
export const sign = (payload: any, secret?: string) => {
  console.warn('JWT signing should be handled by backend');
  return '';
};

export const verify = (token: string, secret?: string) => {
  console.warn('JWT verification should be handled by backend');
  return true;
};

export const decode = (token: string) => {
  console.warn('JWT decoding should be handled by backend');
  return {};
};

export default {
  sign,
  verify,
  decode,
};
