const app = require('./app');
const BlockChain = require('./blockchain/main');
let trustchain = new BlockChain();
const axios = require('axios');

let port = 7002;
app.listen(port, () => {
  console.log('Listening on port ' + port + '!');
});

app.get('/trustchain', (req, res) => {
  res.json(trustchain);
});

app.post('/transaction/broadcast', (req, res) => {
  const transaction = trustchain.createNewTransaction(
    req.body.amount,
    req.body.data,
    req.body.recipient,
    req.body.sender
  );

  trustchain.networkNodes.forEach(nodeURL => {
    axios.post(nodeURL + '/transaction', {
      transaction
    });
  });

  res.json({
    msg: `Transaction was broadcasted.`
  });
});

app.post('/transaction', (req, res) => {
  const blockIndex = trustchain.commitTransaction(req.body.transaction);

  res.json({
    msg: `Transaction will be added to block ${blockIndex}.`
  });
});

app.get('/mine', (req, res) => {
  let lastBlock = trustchain.getPreviousBlock();
  let previousHash = lastBlock.hash;
  let currentData = trustchain.pendingTransactions;
  let nonce = trustchain.proofOFWork(previousHash, currentData);
  let hash = trustchain.hashBlock(previousHash, currentData, nonce);

  let newBlock = trustchain.createNewBlock(nonce, previousHash, hash);

  res.status(200).json({
    message: 'New block successfully created!',
    block: newBlock
  });
});

app.post('/register-and-broadcast-node', (req, res) => {
  const newNodeURL = req.body.newNodeURL;

  let promises = [];

  if (trustchain.networkNodes.indexOf(newNodeURL) === -1) {
    trustchain.networkNodes.push(newNodeURL);
  }

  trustchain.networkNodes.forEach(nodeURL => {
    axios.post(nodeURL + '/register-node', {
      newNodeURL
    });
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

  res.json({
    msg: `New nodes were added to the network.`
  });
});

if (port != 7000) {
  axios
    .post(trustchain.networkNodes[0] + '/register-and-broadcast-node', {
      newNodeURL: 'http://localhost:' + port
    })
    .then(data => {
      console.log(data.data);
    });
}
