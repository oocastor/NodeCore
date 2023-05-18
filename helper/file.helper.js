import { createReadStream } from "fs";

function readFileWithMaxLines(filePath, maxLines) {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath, { encoding: 'utf8' });
      let linesRead = 0;
      let data = '';
  
      stream.on('data', (chunk) => {
        data += chunk;
        const lines = data.split('\n');
  
        if (lines.length > maxLines) {
          stream.destroy();
          const truncatedData = lines.slice(0, maxLines).join('\n');
          resolve(truncatedData);
        } else {
          linesRead += lines.length;
        }
      });
  
      stream.on('end', () => {
        resolve(data);
      });
  
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
  

export {
    readFileWithMaxLines
}