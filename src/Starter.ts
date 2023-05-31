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
    const [arg0, arg1, arg2, arg3] = process.argv.slice(2);
    if (!arg0) {
        console.log('Use "chameleon [MODEL IDENTIFIER]" or "chameleon [MODEL IDENTIFIER] [PARAMETER PATH] [OUTPUT PATH]" or "chameleon [MODEL IDENTIFIER] [INPUT PATH] [PARAMETERS PATH] [OUTPUT PATH]"');
        process.exit(1);
    }
    const [username, uniqueName] = arg0.split('/');
    if (arg0 && arg1 && arg2 && arg3) {
        if (!(fs.existsSync(arg1) && fs.existsSync(arg2))) {
            console.log('The file does not exist at path.');
            process.exit(1);
        }
        executionData = {username, uniqueName, inputPath: arg1, parametersPath: arg2, outputPath: arg3};
    } else if (arg0 && arg1 && arg2) {
        if (!(fs.existsSync(arg1))) {
            console.log('The file does not exist at path.');
            process.exit(1);
        }
        fs.closeSync(fs.openSync(`${controllerDirectory}/empty`, 'w'));
        executionData = {username, uniqueName, inputPath: `${controllerDirectory}/empty`, parametersPath: arg1, outputPath: arg2};
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