import net, {NetConnectOpts, Socket} from 'net';
import {SocketHandler} from '../types/chameleon-controller';
import SocketManager from './manager/SocketManager';

export default class SocketClient<SocketData, Manager extends SocketManager> {
    readonly socket: Socket & { data: SocketData };
    readonly manager: Manager;
    readonly handlers: SocketHandler<any, any>[] = [];

    constructor(options: NetConnectOpts, manager: Manager) {
        this.socket = net.connect(options) as Socket & { data: SocketData };
        this.socket.data = {} as SocketData;
        this.socket.on('connect', () => {
            this.handlers.forEach(h => h.onReady?.(this, this.socket));
        });

        this.socket.on('data', (data: Buffer) => {
            this.handlers.forEach(h => h.onData?.(this, this.socket, data));
        });

        this.socket.on('error', (error: Error) => {
            console.error('SocketClient Error: ', error);
            this.socket.destroy();
        });

        this.socket.on('close', (hadError: boolean) => {
            this.handlers.forEach(h => h.onClose?.(this, this.socket, hadError));
        });

        this.manager = manager;
        this.manager.init(this);
    }

    addHandler(handler: SocketHandler<any, any>) {
        this.handlers.push(handler);
    }

    removeHandler(handler: SocketHandler<any, any>) {
        const index = this.handlers.indexOf(handler);
        if (index > -1) {
            this.handlers.splice(index, 1);
        }
    }
}