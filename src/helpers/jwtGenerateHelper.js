require("dotenv").config();
const JWT = require("jsonwebtoken");

const jwtGenerate =  (userDetails) => {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  const expiresIn = process.env.JWT_EXPIRES_IN;
  const token =  JWT.sign(userDetails, jwtSecretKey, {
    expiresIn: expiresIn,
  });
  console.log('token',token);
  return token;
};
module.exports = jwtGenerate;
