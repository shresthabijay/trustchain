const sha256 = require('js-sha256');
const uuid = require('uuid/v1');
const Wallet = require('../Wallet.js');
let wallet = new Wallet();

class Blockchain {
  constructor() {
    this.networkNodes = ['http://192.168.86.54:7000'];
    this.chain = [
      {
        timeStamp: Date.now(),
        index: 0,
        nonce: 200,
        transactions: [],
        previousBlockHash: '0000',
        hash: '0000'
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

    this.createNewTransaction = (
      amount,
      data,
      recipient,
      sender,
      signature
    ) => {
      const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        data: data,
        transactionId: uuid()
          .split('-')
          .join(''),
        signature: signature,
        timeStamp: Date.now()
      };

      return newTransaction;
    };

    this.commitTransaction = async transaction => {
      try {
        let data =
          typeof transaction.data == 'object'
            ? JSON.stringify(transaction.data)
            : transaction.data;

        console.log(transaction);
        let isValidSignature = await wallet.verifySignature(
          data,
          transaction.sender,
          transaction.signature
        );

        if (isValidSignature === true) {
          this.pendingTransactions.push(transaction);

          return this.getPreviousBlock().index + 1;
        } else {
          return false;
        }
      } catch (err) {
        return false;
      }
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

      while (hash.substring(0, 2) !== '00') {
        nonce++;
        hash = this.hashBlock(currentBlockHash, currentBlockData, nonce);
      }

      return nonce;
    };

    this.isChainValid = chain => {
      let validChain = false;

      for (let i = 1; i < chain.length - 1; i++) {
        const currentBlock = chain[i];
        const previousBlock = chain[i - 1];
        const blockhash = this.hashBlock(
          previousBlock.hash,
          currentBlock.transactions,
          currentBlock.nonce
        );
        if (!blockhash.substring(0, 2) == '00') {
          return false;
        }
        if (previousBlock.hash !== currentBlock.previousBlockHash) {
          return false;
        }
      }

      const genesisBlock = chain[0];
      const isGenesisNonceCorrect = genesisBlock.nonce === 200;
      const isGenisisPrevHashCorrect =
        genesisBlock.previousBlockHash === '0000';
      const isGenisisHashCorrect = genesisBlock.hash === '0000';
      const isGenesisTransactionsCorrect =
        genesisBlock.transactions.length === 0;

      if (
        isGenesisNonceCorrect &&
        isGenesisTransactionsCorrect &&
        isGenisisHashCorrect &&
        isGenisisPrevHashCorrect
      ) {
        return true;
      }
    };
  }
}

module.exports = Blockchain;
