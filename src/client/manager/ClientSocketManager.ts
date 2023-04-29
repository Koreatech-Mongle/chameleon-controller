export default class ClientSocketManager<Client> {
    protected client?: Client;

    init(server: Client) {
        this.client = server;
    }
}