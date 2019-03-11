import * as fs from 'fs';
console.log('Hello world');
// import * as json from './../data/EURUSD.json';

const streamToJSON = stream =>
  new Promise((resolve, reject) => {
    const chunks = [];

    stream
      .on('data', chunk => {
        chunks.push(chunk.toString());
      })
      .on('error', reject)
      .on('end', () => {
        console.log(chunks);
        resolve(JSON.parse(chunks.join('')));
      });
  });

const main = async () => {
  const readStream = fs.createReadStream(`${__dirname}/../data/EURUSD.json`);
  const foo = await streamToJSON(readStream);
  console.log(foo);
};
main();
