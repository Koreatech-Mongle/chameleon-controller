import SocketManager from '../../manager/SocketManager';
import {DefaultSocket} from '../../../types/chameleon-controller';
import {SocketMessageType} from '../../../types/chameleon-platform.common';

export default class DefaultSocketManager extends SocketManager {
    getClientSocket() {
        return this.client?.socket as DefaultSocket;
    }

    json(data: any) {
        this.getClientSocket().write(JSON.stringify(data) + '\0');
    }

    sendLaunch(historyId: number) {
        this.json({msg: SocketMessageType.LAUNCH, historyId});
    }

    sendFileWait() {
        this.json({msg: SocketMessageType.FILE_WAIT});
    }

    sendTerminal(data: string) {
        this.json({msg: SocketMessageType.TERMINAL, data});
    }

    sendProcessEnd() {
        this.json({msg: SocketMessageType.PROCESS_END});
    }

    sendFile(fileSize: number) {
        this.json({msg: SocketMessageType.FILE, fileSize});
    }
}