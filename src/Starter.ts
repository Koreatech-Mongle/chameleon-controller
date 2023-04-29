import SocketClient from './client/SocketClient';
import {DefaultSocketData} from './types/chameleon-controller';
import DefaultSocketManager from './client/impl/manager/DefaultSocketManager';
import DefaultSocketHandler from './client/impl/handler/DefaultSocketHandler';

const [host, port, rawModelPath] = process.argv.slice(2);
const modelPath = Buffer.from(rawModelPath, 'base64').toString('utf8');

const socketClient = new SocketClient<DefaultSocketData, DefaultSocketManager>({
    host,
    port: parseInt(port)
}, new DefaultSocketManager());

socketClient.addHandler(new DefaultSocketHandler(modelPath));