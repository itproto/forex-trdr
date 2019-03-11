import { promisify } from 'util';
import * as path from 'path';
import { map } from 'async';
import * as fs from 'fs';
const { createReadStream, createWriteStream } = fs;

// const readFile = promisify(_readFile);

const glob = promisify(require('glob'));
const exists = promisify(fs.exists);
const csv = require('csvtojson');
const mkdirp = promisify(require('mkdirp'));
const toCamelCase = (src: string) => src.charAt(0).toLowerCase() + src.slice(1);
export const main = async () => {
  const srcPath = path.join(__dirname, 'temp/**/*.*');
  // const distPath = path.join(__dirname, 'temp/**/*');
  const files = await glob(srcPath);
  map(files, async (file: string) => {
    const relPath = path.relative(path.join(__dirname, 'temp'), file);
    const dist = 'out';
    let distPath = path.join(__dirname, dist, relPath);
    const ext = path.extname(distPath);
    distPath = distPath.replace(new RegExp(`^(.*)${ext}$`), '$1.json');

    const dirname = path.dirname(distPath);
    const exist = await exists(dirname);
    if (!exist) {
      await mkdirp(dirname);
    }

    const rs = createReadStream(file);
    const ws = createWriteStream(distPath);

    csv({
      colParser: {
        Ask: 'number',
        Bid: 'number',
        AskVolume: 'number',
        BidVolume: 'number',
        GmtTime: 'date'
      }
    })
      .fromStream(rs)
      .subscribe((obj, idx) => {
        if (idx == 0) {
          ws.write(`[\n`);
        } else {
          ws.write(',');
          ws.write('\n');
        }
        const modified: any = Object.keys(obj).reduce((res, key) => {
          res[toCamelCase(key)] = obj[key];
          return res;
        }, {});
        modified.gmtTime = new Date(Date.parse(modified.gmtTime));
        ws.write(`\t${JSON.stringify(modified)}`);
      })
      .then(() => {
        ws.write(`\n]`);
        ws.end();
      });
  });
};
// main();

const JSONStream = require('JSONStream');
export const foo = async () => {
  const pair = 'EURUSD';
  const path = __dirname + `/out/${pair}.json`;
  var stream = fs.createReadStream(path, { encoding: 'utf8' }),
    parser = JSONStream.parse();
  stream.pipe(parser);
  parser.on('data', obj => {
    console.log(obj.length);
    const dic = {}; // resolution 100ms
    const start = Date.parse('01.02.2019');
    obj.forEach((el: any) => {
      el.gmtTime.getTime() - start;
    });
  });
};

foo();

/*
https://gist.github.com/qwtel/fd82ab097cbe1db50ded9505f183ccb8
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
*/
