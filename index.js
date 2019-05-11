const app = require('./app');
const BlockChain = require('./blockchain/main');
let trustchain = new BlockChain();
const axios = require('axios');
const ip = require('ip');
const myIP = ip.address();
let listenerEndpoints = [];
let centralServerIP = 'http://192.168.86.51:3000';

let port = 7003;

let myURL = 'http://' + myIP + ':' + port;

app.listen(port, () => {
  console.log('Listening on port ' + port + '!');
});

app.get('/trustchain', (req, res) => {
  res.json(trustchain.chain);
});

app.get('/pending', (req, res) => {
  res.json(trustchain.pendingTransactions);
});

app.get('/peers', (req, res) => {
  res.json(trustchain.networkNodes);
});

app.post('/transaction/broadcast', (req, res) => {
  const transaction = trustchain.createNewTransaction(
    req.body.amount,
    req.body.data,
    req.body.recipient,
    req.body.sender,
    req.body.signature
  );

  trustchain.networkNodes.forEach(nodeURL => {
    axios
      .post(nodeURL + '/transaction', {
        transaction
      })
      .catch(() => {});
  });

  res.json({
    transactionId: transaction.transactionId,
    nextBlockId: trustchain.getPreviousBlock().index + 1,
    msg: `Transaction was broadcasted.`
  });
});

app.post('/transaction', async (req, res) => {
  try {
    const blockIndex = await trustchain.commitTransaction(req.body.transaction);
    console.log(blockIndex);
    if (blockIndex == false) {
      res.status(400).json({
        msg: 'Transaction signature is invalid!'
      });

      return;
    }

    res.json({
      msg: `Transaction will be added to block ${blockIndex}.`
    });
  } catch (err) {
    res.status(400).json({
      msg: 'Transaction signature is invalid!'
    });
  }
});

app.get('/mine', (req, res) => {
  if (trustchain.pendingTransactions.length === 0) {
    res.json({
      msg: 'No pending transactions to mine!'
    });
    return;
  }

  let lastBlock = trustchain.getPreviousBlock();
  let previousHash = lastBlock.hash;
  let currentData = trustchain.pendingTransactions;
  let nonce = trustchain.proofOFWork(previousHash, currentData);
  let hash = trustchain.hashBlock(previousHash, currentData, nonce);
  let newBlock = trustchain.createNewBlock(nonce, previousHash, hash);

  let filteredTransactions = newBlock.transactions.map(data => {
    return { transactionId: data.transactionId, recipient: data.recipient };
  });

  console.log(newBlock.index);

  axios
    .post(centralServerIP + '/attach', {
      transactions: filteredTransactions,
      blockIndex: newBlock.index
    })
    .catch(err => {});

  trustchain.networkNodes.forEach(nodeURL => {
    axios
      .post(nodeURL + '/recieve-new-block', {
        newBlock
      })
      .catch(err => {
        console.log(err.data);
      });
  });

  //for mining rewards

  // trustchain.networkNodes.forEach(nodeURL => {
  //   axios.post(nodeURL + '/transaction/broadcast', {
  //     newBlock
  //   });
  // });

  res.status(200).json({
    message: 'New block successfully created!',
    block: newBlock
  });
});

app.post('/recieve-new-block', (req, res) => {
  let newBlock = req.body.newBlock;
  let previousBlock = trustchain.getPreviousBlock();
  let isHashCorrect = previousBlock.hash === newBlock.previousBlockHash;
  let isCorrectIndex = previousBlock.index + 1 === newBlock.index;

  if (isHashCorrect && isCorrectIndex) {
    trustchain.chain.push(newBlock);
    trustchain.pendingTransactions = [];
    res.status(200).json({
      msg: 'New block accepted and added to the chain!',
      newBlock,
      previousBlock
    });
  } else {
    res.status(400).json({
      msg: 'New block rejected!',
      newBlock,
      previousBlock
    });
  }
});

app.get('/consensus', async (req, res) => {
  let currentChainLength = trustchain.chain.length;
  let maxChainLength = currentChainLength;
  let newLongestChain = null;
  let newPendingTransactions = [];

  for (let i = 0; i < trustchain.networkNodes.length - 1; i++) {
    let nodeURL = trustchain.networkNodes[i];

    try {
      let { data: chain } = await axios.get(nodeURL + '/trustchain');

      if (chain.length > maxChainLength) {
        newLongestChain = chain;
        newPendingTransactions = chain.pendingTransactions;
      }
    } catch (err) {}
  }

  if (
    !newLongestChain ||
    (newLongestChain && !trustchain.isChainValid(newLongestChain))
  ) {
    res.json({
      msg: 'The chain has not been replaced!',
      chain: trustchain.chain
    });
  }

  if (newLongestChain && trustchain.isChainValid(newLongestChain)) {
    trustchain.chain = newLongestChain;
    trustchain.pendingTransactions = newPendingTransactions;
    res.json({
      msg: 'The chain has been replaced!',
      chain: trustchain.chain
    });
  }
});

app.post('/register-and-broadcast-node', (req, res) => {
  const newNodeURL = req.body.newNodeURL;

  let promises = [];

  if (trustchain.networkNodes.indexOf(newNodeURL) === -1) {
    trustchain.networkNodes.push(newNodeURL);
  }

  trustchain.networkNodes.forEach(nodeURL => {
    axios
      .post(nodeURL + '/register-node', {
        newNodeURL
      })
      .catch(err => {});
  });

  axios
    .post(newNodeURL + '/register-node-bulk', {
      networkNodes: trustchain.networkNodes
    })
    .then(data => {
      res.json({
        msg: `New Node ${newNodeURL} was added to the network.`
      });
    });
});

app.post('/register-node', (req, res) => {
  const newNodeURL = req.body.newNodeURL;

  if (trustchain.networkNodes.indexOf(newNodeURL) === -1) {
    trustchain.networkNodes.push(newNodeURL);
  }

  res.json({
    msg: `New Node ${newNodeURL} was added to the network.`
  });
});

app.post('/register-node-bulk', (req, res) => {
  trustchain.networkNodes = req.body.networkNodes;
  axios.get(myURL + '/consensus');
  res.json({
    msg: `New nodes were added to the network.`
  });
});

app.post('/getblock', async (req, res) => {
  let blockIndex = parseInt(rew.body.blockIndex);
  await axios.get(myURL + '/consensus');
  return trustchain.chain[blockIndex];
});

app.post('/addListner', (req, res) => {
  listenerEndpoints.push(rew.body.endpoint);
  res.json({
    msg: 'listener added'
  });
});

app.post('/getTransaction', (req, res) => {
  let blockIndex = parseInt(req.body.blockIndex);
  let transactionId = req.body.transactionId;

  try {
    let transaction = trustchain.chain[blockIndex].transactions.find(data => {
      return transactionId === data.transactionId;
    });
    if (transaction) {
      res.json({
        transaction,
        msg: 'Transacion Found'
      });
    } else {
      res.json({
        err: '1',
        msg: 'Transaction not found'
      });
    }
  } catch (err) {
    res.json({
      err: '1',
      msg: 'Transaction not found'
    });
  }
});

if (myURL != trustchain.networkNodes[0]) {
  axios
    .post(trustchain.networkNodes[0] + '/register-and-broadcast-node', {
      newNodeURL: myURL
    })
    .then(data => {});
}
