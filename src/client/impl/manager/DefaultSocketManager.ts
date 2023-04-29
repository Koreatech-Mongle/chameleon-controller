import SocketManager from '../../manager/SocketManager';
import {DefaultSocket} from '../../../types/chameleon-controller';
import {SocketMessageType} from "../../../types/chameleon-controller.enum";

export default class DefaultSocketManager extends SocketManager {
    getClientSocket() {
        return this.client?.socket as DefaultSocket;
    }

    json(data: any) {
        this.getClientSocket().write(JSON.stringify(data) + '\0');
    }

    sendLaunch(modelPath: string) {
        this.json({msg: SocketMessageType.Launch, modelPath});
    }

    sendFileWait() {
        this.json({msg: SocketMessageType.FileWait});
    }

    sendTerminal(data: string) {
        this.json({msg: SocketMessageType.Terminal, data});
    }

    sendProcessEnd() {
        this.json({msg: SocketMessageType.ProcessEnd});
    }

    sendFile(fileSize: number) {
        this.json({msg: SocketMessageType.File, fileSize});
    }
}