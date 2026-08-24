export const cookieParser = (req, _res, next) => {
  req.cookies = {};
  const raw = req.headers.cookie;
  if (raw) {
    raw.split(";").forEach((part) => {
      const separator = part.indexOf("=");
      if (separator > 0) req.cookies[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1));
    });
  }
  next();
};