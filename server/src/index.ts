import * as express from 'express';
import { AddressInfo } from 'net';
const app = express();

app.get('/', (_req, res) => {
  res.send('Hello World Final!');
});

const server = app.listen(8080, () => {
  const addr = server.address() as AddressInfo;
  const { address, port } = addr;

  console.log(`Example app listening at http://${address}:${port}`);
});