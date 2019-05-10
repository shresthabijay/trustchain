const crypto2 = require('crypto2');

class Wallet {
  generateKey() {
    return crypto2.createKeyPair();
  }

  createSignature(data, privateKey) {
    return crypto2.sign(data, privateKey);
  }

  verifySignature(data, publickey, signature) {
    return crypto2.verify(data, publickey, signature);
  }
}

// const wallet = new Wallet();

// wallet
//   .generateKey()
//   .then(data => {
//     console.log(data.privateKey, data.publicKey);
//     return data;
//   })
//   .then(data => {
//     return wallet.createSignature('hello world', data.privateKey);
//   })
//   .then(signature => {
//     console.log(signature);
//   });

module.exports = Wallet;
