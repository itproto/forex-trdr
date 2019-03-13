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
  let len = 0;
  parser.on('data', obj => {
    const ds = obj.reduce((ds: any, el: any) => {
      const date = new Date(el.gmtTime);
      const [hour, min, sec, ms] = [
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
      ];
      const todayDate = new Date();
      todayDate.setHours(hour, min, sec, ms);
      const ts = (min * 60 + sec) * 1000 + ms;
      const item = { ...el, date: todayDate, ts };
      const dsPair = (ds[pair] = ds[pair] || {});
      const dsHour = (dsPair[hour] = dsPair[hour] || []);
      dsHour[min] = dsHour[min] ? [...dsHour[min], item] : [item];
      const { length } = dsHour[min];
      if (length > len) {
        len = length;
      }
      return ds;
    }, []);

    const getMidnight = () => new Date(new Date().setHours(0, 0, 0));

    function* makeDsIterator(ds: any, pair = 'EURUSD', rewindToDate?: Date) {
      if (!ds) {
        return;
      }

      const dsPair = ds[pair];
      if (!dsPair || dsPair.length < 1) {
        return;
      }

      const date = rewindToDate || getMidnight();
      const [hour, min, sec, ms] = [
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
      ];
      // const ts = (min * 60 + sec) * 1000 + ms;

      let targetMin = min;

      let dsHour = dsPair[hour];
      if (!dsHour) {
        let targetHour = hour;
        while (dsPair[targetHour] === undefined) {
          if (targetHour === 0) {
            return;
          }
          targetHour--;
        }
      }

      //4 7
      // 6

      /*
        for (let i = start; i < end; i += step) {
            iterationCount++;
            yield i;
        }
        return iterationCount;
        */
    }
    /*
    const makeDsIterator(ds:any, start = new Date) => {
        const [hour, min] = [
            date.getHours(),
            date.getMinutes()
            // date.getSeconds()
            // date.getMilliseconds()
          ];

        let nextIndex = start;
        let iterationCount = 0;
    
        const rangeIterator = {
           next: function() {
               let result;
               if (nextIndex <= end) {
                   result = { value: nextIndex, done: false }
                   nextIndex += step;
                   iterationCount++;
                   return result;
               }
               return { value: iterationCount, done: true }
           }
        };
        return rangeIterator;
    }
    */
    console.log(ds[pair][0][29]);
  });
};

foo();

/*
https://gist.github.com/qwtel/fd82ab097cbe1db50ded9505f183ccb8
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
*/
