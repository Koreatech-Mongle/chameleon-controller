import ClientSocketManager from './ClientSocketManager';
import SocketServer from '../SocketClient';

export default abstract class SocketManager extends ClientSocketManager<SocketServer<any, SocketManager>> {
}