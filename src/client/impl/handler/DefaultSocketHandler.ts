import {DefaultSocket, DefaultSocketClient, LaunchData, SocketHandler} from '../../../types/chameleon-controller';
import * as fs from 'fs';
import * as pty from 'node-pty-prebuilt-multiarch';
import {
    SocketExitMessage,
    SocketFileMessage,
    SocketFileReceiveEndMessage,
    SocketLaunchModelMessage,
    SocketMessageType,
    SocketReceiveMode,
    SocketRequestFileMessage, SocketTerminalBufferMessage, SocketTerminalMessage,
    SocketTerminalResizeMessage,
    SocketWaitReceiveMessage
} from '../../../types/chameleon-platform.common';

type Handle = (client: DefaultSocketClient, socket: DefaultSocket, message: any) => void;
const handles: { [messageType: string]: Handle } = {};

handles[SocketMessageType.FILE] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketFileMessage) => {
    socket.data.fileSize = message.fileSize;
    if (socket.data.fileSize === 0) {
        fs.closeSync(fs.openSync(message.filePath as string, 'w'));
        client.manager.sendFileReceiveEnd();
        return;
    }
    socket.data.receiveMode = SocketReceiveMode.FILE;
    socket.data.filePath = message.filePath as string;
    socket.data.receivedBytes = 0;

    const pathSplit = socket.data.filePath.split('/');
    pathSplit.pop();
    fs.mkdirSync(pathSplit.join('/'), {recursive: true});

    socket.data.writeStream = fs.createWriteStream(socket.data.filePath);
    client.manager.sendFileWait();
};

handles[SocketMessageType.FILE_RECEIVE_END] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketFileReceiveEndMessage) => {
    /* empty */
};

handles[SocketMessageType.LAUNCH_MODEL] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketLaunchModelMessage) => {
    const ptyProcess = pty.spawn('sh', [message.scriptPath], {
        name: 'xterm-color',
        cols: 181,
        rows: 14,
        cwd: process.env.HOME,
        env: process.env as { [key: string]: string }, ...message.options
    });

    ptyProcess.onData((data) => {
        client.manager.sendTerminal(data);
    });

    ptyProcess.onExit((e) => {
        client.manager.sendProcessEnd();
    });

    socket.data.ptyProcess = ptyProcess;
};

handles[SocketMessageType.TERMINAL_RESIZE] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketTerminalResizeMessage) => {
    socket.data.ptyProcess.resize(message.cols, message.rows);
};

handles[SocketMessageType.REQUEST_FILE] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketRequestFileMessage) => {
    const fileSize = fs.existsSync(message.filePath) ? fs.statSync(message.filePath).size : 0;
    if (fileSize !== 0) {
        socket.data.readStream = fs.createReadStream(message.filePath);
    }
    client.manager.sendFile(fileSize);
};

handles[SocketMessageType.WAIT_RECEIVE] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketWaitReceiveMessage) => {
    socket.data.readStream.pipe(socket, {end: false});
    socket.data.readStream.on('end', () => {
        socket.data.readStream?.close?.();
    });
};

handles[SocketMessageType.EXIT] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketExitMessage) => {
    if (message.message) {
        console.log(message.message);
    }
    process.exit(message.code);
};

handles[SocketMessageType.TERMINAL_BUFFER] = (client: DefaultSocketClient, socket: DefaultSocket, message: SocketTerminalBufferMessage) => {
    for (const terminal of message.data) {
        process.stdout.write(terminal);
    }
};

export default class DefaultSocketHandler implements SocketHandler<DefaultSocketClient, DefaultSocket> {

    constructor(public launchData: LaunchData) {
    }

    onReady(client: DefaultSocketClient, socket: DefaultSocket): void {
        socket.data.buffer = '';
        socket.data.receiveMode = SocketReceiveMode.JSON;
        if (this.launchData.isMainConnection) {
            fs.writeFileSync(this.launchData.path, JSON.stringify(this.launchData.config), 'utf-8');
        }
        client.manager.sendLaunch(this.launchData.config.historyId, this.launchData.isMainConnection, this.launchData.executionData);
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
                    console.error(`split.length=${split.length}, split=${split}`);
                    console.error(`dataString.length=${dataString.length}, dataString=${dataString}`);
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
                    client.manager.sendFileReceiveEnd();
                });
            } else {
                socket.data.writeStream.write(data);
            }
        }
    }

    onClose(client: DefaultSocketClient, socket: DefaultSocket, hadError: boolean): void {
        if (this.launchData.isMainConnection) {
            fs.unlinkSync(this.launchData.path);
        }
    }
}