import {SocketHandler, DefaultSocket, DefaultSocketClient, SocketMessageType, SocketReceiveMode} from '../../../types/chameleon-controller';
import * as fs from 'fs';
import * as pty from 'node-pty-prebuilt-multiarch';

type Handle = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => void;
const handles: { [messageType: string]: Handle } = {};

handles[SocketMessageType.File] = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => {
    socket.data.fileSize = message.fileSize;
    if (socket.data.fileSize === 0) {
        return;
    }
    socket.data.receiveMode = SocketReceiveMode.FILE;
    socket.data.filePath = message.filePath;
    socket.data.receivedBytes = 0;

    const pathSplit = socket.data.filePath.split('/');
    pathSplit.pop();
    fs.mkdirSync(pathSplit.join('/'), {recursive: true});

    socket.data.writeStream = fs.createWriteStream(socket.data.filePath);
    client.manager.sendFileWait();
};

handles[SocketMessageType.FileReceiveEnd] = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => {
    /* empty */
};

handles[SocketMessageType.LaunchModel] = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => {
    const ptyProcess = pty.spawn('bash', [message.scriptPath], {
        name: 'xterm-color',
        cols: 181,
        rows: 14,
        cwd: process.env.HOME,
        env: process.env as { [key: string]: string }
    });
    // WARNING: Hard-coded cols, rows

    ptyProcess.onData((data) => {
        client.manager.sendTerminal(data);
    });

    ptyProcess.onExit((e) => {
        client.manager.sendProcessEnd();
    });
};

handles[SocketMessageType.TerminalResize] = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => {
    socket.data.ptyProcess.resize(message.cols, message.rows);
};

handles[SocketMessageType.RequestFile] = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => {
    const fileSize = fs.existsSync(message.filePath) ? fs.statSync(message.filePath).size : 0;
    if (fileSize !== 0) {
        socket.data.readStream = fs.createReadStream(message.filePath);
    }
    client.manager.sendFile(fileSize);
};

handles[SocketMessageType.WaitReceive] = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => {
    socket.data.readStream.pipe(socket, {end: false});
    socket.data.readStream.on('end', () => {
        socket.data.readStream?.close?.();
    });
};
export default class DefaultSocketHandler implements SocketHandler<DefaultSocketClient, DefaultSocket> {

    constructor(public modelPath: string) {
    }

    onReady(client: DefaultSocketClient, socket: DefaultSocket): void {
        socket.data.buffer = '';
        socket.data.receiveMode = SocketReceiveMode.JSON;
        client.manager.sendLaunch(this.modelPath);
    }

    onData(client: DefaultSocketClient, socket: DefaultSocket, data: Buffer): void {
        if (socket.data.receiveMode === SocketReceiveMode.JSON) {
            const dataString = socket.data.buffer + data.toString();
            const splitString = dataString.split('\0').filter(s => s.length > 0);
            const lastMessageString = splitString.pop() as string;
            for (const split of splitString) {
                let message;
                try {
                    message = JSON.parse(split);
                } catch (e) {
                    console.error(e);
                    console.error(`split.length=${split.length}, dataString.length=${dataString.length}`);
                    console.error(`split=${JSON.stringify(split)}, dataString=${JSON.stringify(dataString)}`);
                    process.exit(1);
                }
                handles[message.msg](client, socket, message);
            }
            let message;
            try {
                message = JSON.parse(lastMessageString);
                socket.data.buffer = '';
            } catch (e) {
                if (lastMessageString !== undefined) {
                    socket.data.buffer = lastMessageString;
                }
            }
            if (message) {
                handles[message.msg](client, socket, message);
            }
        } else {
            socket.data.receivedBytes += data.length;
            if (socket.data.receivedBytes >= socket.data.fileSize) {
                const delta = socket.data.receivedBytes - socket.data.fileSize;
                const fileBytes = data.length - delta;
                const fileData = data.subarray(0, fileBytes);
                const bufferData = data.subarray(fileBytes + 1, data.length);
                socket.data.buffer = bufferData.toString();
                socket.data.writeStream.write(fileData, function () {
                    socket.data.writeStream?.destroy?.();
                    socket.data.receiveMode = SocketReceiveMode.JSON;
                    client.manager.json({msg: SocketMessageType.FileReceiveEnd});
                });
            } else {
                socket.data.writeStream.write(data);
            }
        }
    }

    onClose(client: DefaultSocketClient, socket: DefaultSocket, hadError: boolean): void {
    }
}
