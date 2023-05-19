import { createReadStream } from "fs";

function readFileWithMaxLines(filePath, linesToRead) {
  return new Promise((resolve, reject) => {
    const readable = createReadStream(filePath, { encoding: 'utf8' });
    let remainingLines = linesToRead;
    let lines = [];

    readable.on('data', (chunk) => {
      const chunkLines = chunk.split('\n');
      const reversedLines = chunkLines.reverse();

      for (const line of reversedLines) {
        if (remainingLines > 0) {
          lines.push(line);
          remainingLines--;
        } else {
          break;
        }
      }
    });

    readable.on('end', () => {
      const result = lines.reverse().join('\n');
      resolve(result);
    });

    readable.on('error', (error) => {
      reject(error);
    });
  });
}


export {
  readFileWithMaxLines
}