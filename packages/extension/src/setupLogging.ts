import * as fs from "fs";
import { Disposable } from "vscode-languageserver";

let logFileStream: fs.WriteStream | undefined;

export function setupLogging(logFilePath: string): Disposable {
  logFileStream = fs.createWriteStream(logFilePath, { flags: "a" });
  
  console.log = (...args: any[]) => {
    if (logFileStream) {
      logFileStream.write(args.join(" ") + "\n");
    }
  };

  console.warn = (...args: any[]) => {
    if (logFileStream) {
      logFileStream.write(`WARN: ${args.join(" ")}\n`);
    }
  };

  console.error = (...args: any[]) => {
    if (logFileStream) {
      logFileStream.write(`ERROR: ${args.join(" ")}\n`);
    }
  };

  return Disposable.create(() => {
    if (logFileStream) {
      logFileStream.end();
      logFileStream = undefined;
    }
  });
}
