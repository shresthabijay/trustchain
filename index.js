const app = require('./app');
const BlockChain = require('./blockchain/main');
let trustchain = new BlockChain();

app.listen(7000, () => {
  console.log('Listening on port 7000!');
});

app.get('/blockchain', (req, res) => {
  res.json(trustchain);
});

app.post('/transaction', (req, res) => {
  const blockIndex = trustchain.createNewTransaction(
    req.body.amount,
    req.body.data,
    req.body.recipient,
    req.body.sender
  );

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

console.log(trustchain.chain);
