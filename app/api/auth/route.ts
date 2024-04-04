const fs = require("fs");
const jwt = require("jsonwebtoken");

function generateJWT(sender: string) {
  // Read the private key from our 'private_key.pem' file
  const privateKey = fs.readFileSync(process.cwd() + "/private_key.pem");
  const signOptions = {
    algorithm: "RS256",
  };

  const token = jwt.sign(
    {
      // issuer name
      iss: "test",
      // issue at, timestamp in second
      iat: 1711496471,
      // expire at, timestamp in second
      exp: 2058565271,
      // app id from CyberConnect dev center
      aid: "6c6e8152-5343-4505-81a3-cf97cf5873ca",
      // CyberAccount address
      sender,
    },
    privateKey,
    signOptions,
  );

  return token;
}

export async function POST(request: Request) {
  const res = await request.json();
  const token = generateJWT(res.sender);
  return Response.json({ token });
}
