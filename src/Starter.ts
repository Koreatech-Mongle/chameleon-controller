import SocketClient from './client/SocketClient';
import {DefaultSocketData} from './types/chameleon-controller';
import DefaultSocketManager from './client/impl/manager/DefaultSocketManager';
import DefaultSocketHandler from './client/impl/handler/DefaultSocketHandler';
import path from 'path';
import * as fs from 'fs';
import {NetConnectOpts} from 'net';
import {ExecutionData} from './types/chameleon-platform.common';

const controllerDirectory = path.dirname(process.execPath);
const configPath = `${controllerDirectory}/config.json`;
let options: NetConnectOpts;
let historyId: number;
let executionData: ExecutionData | undefined = undefined;
const isConfigExist = fs.existsSync(configPath);
const rawHistoryId = process.argv?.[4];
if (!isConfigExist && rawHistoryId && !Number.isNaN(rawHistoryId)) {
    const [host, rawPort, rawHistoryId] = process.argv.slice(2);
    options = {
        host,
        port: parseInt(rawPort)
    };
    historyId = parseInt(rawHistoryId);
} else {
    const [modelIdentifier, inputPath, parametersPath, outputPath] = process.argv.slice(2);
    if (!modelIdentifier) {
        console.log('Use "chameleon [MODEL IDENTIFIER]" or "chameleon [MODEL IDENTIFIER] [PARAMETER PATH] [OUTPUT PATH]" or "chameleon [MODEL IDENTIFIER] [INPUT PATH] [PARAMETERS PATH] [OUTPUT PATH]"');
        process.exit(1);
    }
    const [username, uniqueName] = modelIdentifier.split('/');
    if (modelIdentifier && inputPath && parametersPath && outputPath) {
        if (!(fs.existsSync(inputPath) && fs.existsSync(parametersPath))) {
            console.log('The file does not exist at path.');
            process.exit(1);
        }
        executionData = {username, uniqueName, inputPath, parametersPath, outputPath};
    } else if (modelIdentifier && inputPath && parametersPath) {
        if (!(fs.existsSync(inputPath))) {
            console.log('The file does not exist at path.');
            process.exit(1);
        }
        fs.closeSync(fs.openSync(`${controllerDirectory}/empty`, 'w'));
        executionData = {username, uniqueName, inputPath: `${controllerDirectory}/empty`, parametersPath: inputPath, outputPath: parametersPath};
    } else {
        console.log('Use "chameleon [MODEL IDENTIFIER]" or "chameleon [MODEL IDENTIFIER] [PARAMETER PATH] [OUTPUT PATH]" or "chameleon [MODEL IDENTIFIER] [INPUT PATH] [PARAMETERS PATH] [OUTPUT PATH]"');
        process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    options = {host: config.host, port: config.port};
    historyId = config.historyId;
}

const socketClient = new SocketClient<DefaultSocketData, DefaultSocketManager>(options, new DefaultSocketManager());
socketClient.addHandler(new DefaultSocketHandler({
    config: {...options, historyId},
    path: configPath,
    isMainConnection: !isConfigExist,
    executionData
}));