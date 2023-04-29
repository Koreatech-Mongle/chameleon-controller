import {Socket} from 'net';
import * as stream from 'stream';
import SocketClient from '../client/SocketClient';
import DefaultSocketManager from '../client/impl/manager/DefaultSocketManager';
import {IPty} from 'node-pty-prebuilt-multiarch';
import {SocketReceiveMode} from "./chameleon-controller.enum";

export interface SocketHandler<Client, Socket> {
    onReady?: (client: Client, socket: Socket) => void,
    onData?: (client: Client, socket: Socket, data: Buffer) => void,
    onClose?: (client: Client, socket: Socket, hadError: boolean) => void,
}

export type DefaultSocketClient = SocketClient<DefaultSocketData, DefaultSocketManager>;
type Resolver = (value?: unknown) => void;
type ReadStreamClose = (callback?: (err?: NodeJS.ErrnoException | null) => void) => void;
export type DefaultSocketData = {
    ptyProcess: IPty;
    filePath: string;
    buffer: string;
    receiveMode: SocketReceiveMode;
    receivedBytes: number;
    fileSize: number;
    writeStream: stream.Writable;
    readStream: stream.Readable & { close?: ReadStreamClose };
};

export type DefaultSocket = Socket & { data: DefaultSocketData };

