import SocketManager from '../../manager/SocketManager';
import {DefaultSocket} from '../../../types/chameleon-controller';
import {
    ExecutionData,
    SocketFileMessage, SocketFileReceiveEndMessage,
    SocketFileWaitMessage,
    SocketLaunchMessage,
    SocketMessageType, SocketProcessEndMessage,
    SocketTerminalMessage
} from '../../../types/chameleon-platform.common';

export default class DefaultSocketManager extends SocketManager {
    getClientSocket() {
        return this.client?.socket as DefaultSocket;
    }

    json(data: any) {
        this.getClientSocket().write(JSON.stringify(data) + '\0');
    }

    sendLaunch(historyId: number, isMainConnection: boolean, executionData?: ExecutionData) {
        this.json({msg: SocketMessageType.LAUNCH, historyId, isMainConnection, executionData} as SocketLaunchMessage);
    }

    sendFileWait() {
        this.json({msg: SocketMessageType.FILE_WAIT} as SocketFileWaitMessage);
    }

    sendTerminal(data: string) {
        this.json({msg: SocketMessageType.TERMINAL, data} as SocketTerminalMessage);
    }

    sendProcessEnd() {
        this.json({msg: SocketMessageType.PROCESS_END} as SocketProcessEndMessage);
    }

    sendFile(fileSize: number) {
        this.json({msg: SocketMessageType.FILE, fileSize} as SocketFileMessage);
    }

    sendFileReceiveEnd() {
        this.json({msg: SocketMessageType.FILE_RECEIVE_END} as SocketFileReceiveEndMessage);
    }
}