import SocketClient from './client/SocketClient';
import {DefaultSocketData} from './types/chameleon-controller';
import DefaultSocketManager from './client/impl/manager/DefaultSocketManager';
import DefaultSocketHandler from './client/impl/handler/DefaultSocketHandler';

const [host, port, historyId] = process.argv.slice(2);

const socketClient = new SocketClient<DefaultSocketData, DefaultSocketManager>({
    host,
    port: parseInt(port)
}, new DefaultSocketManager());

socketClient.addHandler(new DefaultSocketHandler(parseInt(historyId)));