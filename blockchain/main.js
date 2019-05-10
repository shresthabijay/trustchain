const sha256 = require('js-sha256');

class Blockchain {
  constructor() {
    this.networkNodes = ['http://localhost:7000'];
    this.chain = [
      {
        timeStamp: Date.now(),
        index: 0,
        nonce: '0000',
        transactions: [],
        previousBlockHash: '',
        hash: ''
      }
    ];

    this.pendingTransactions = [];

    this.createNewBlock = (nonce, previousBlockHash, hash) => {
      const newBlock = {
        timeStamp: Date.now(),
        index: this.chain.length,
        nonce: nonce,
        transactions: this.pendingTransactions,
        previousBlockHash: previousBlockHash,
        hash: hash
      };
      this.pendingTransactions = [];
      this.chain.push(newBlock);
      return newBlock;
    };

    this.createNewTransaction = (amount, data, recipient, sender) => {
      const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        data: data
      };

      return newTransaction;
    };

    this.commitTransaction = transaction => {
      this.pendingTransactions.push(transaction);
      return this.getPreviousBlock().index + 1;
    };

    this.getPreviousBlock = () => {
      return this.chain[this.chain.length - 1];
    };

    this.hashBlock = (previousBlockHash, currentBlockData, nonce) => {
      const data =
        previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
      return sha256(data);
    };

    this.proofOFWork = (currentBlockHash, currentBlockData) => {
      let nonce = 0;
      let hash = this.hashBlock(currentBlockHash, currentBlockData, nonce);

      while (hash.substring(0, 4) !== '0000') {
        console.log(hash);
        nonce++;
        hash = this.hashBlock(currentBlockHash, currentBlockData, nonce);
      }

      return nonce;
    };
  }
}

module.exports = Blockchain;
