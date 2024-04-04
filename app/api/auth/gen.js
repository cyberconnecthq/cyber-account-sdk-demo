// Import the built-in crypto module for generating keys
const crypto = require("crypto");

// Import the built-in fs module for writing keys to files
const fs = require("fs");

// Define a function to generate the key pair
function generateKeyPair() {
  // Generate a new key pair using RSA algorithm with a modulus length of 2048 bits ( size of the key )
  // RSA is related to the RS256, RS384, RS512 algorithms. We support the following algorithms: RS256, RS384, RS512, ECDSA256, ECDSA384, ECDSA512.
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  // Write the private key to a file named 'private_key.pem'
  // The export function exports the key in the specified format (in this case, PKCS #1)
  // PKCS#1 is a standard format that represents an RSA private key. It is widely used and compatible with many libraries and services.
  fs.writeFileSync(
    "private_key.pem",
    privateKey.export({
      type: "pkcs1",
      format: "pem",
    }),
  );

  // Write the public key to a file named 'public_key.pem'
  // The export function exports the key in the specified format (in this case, SPKI)
  // We require the public key in 'spki' (Subject Public Key Info) format, as it's a standard format that
  // includes the algorithm identifier along with the key data , which is important for properly reading and using the key.
  fs.writeFileSync(
    "public_key.pem",
    publicKey.export({
      type: "spki",
      format: "pem",
    }),
  );

  // Log that the key pair was generated and saved to files
  console.log(
    'Key pair generated and saved to files "private_key.pem" and "public_key.pem".',
  );
}

// Execute the function to generate the key pair
generateKeyPair();
