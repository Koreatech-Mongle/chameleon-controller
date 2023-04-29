export enum SocketMessageType {
    Hello = 'Hello',
    Launch = 'Launch',
    FileWait = 'FileWait',
    FileReceiveEnd = 'FileReceiveEnd',
    Terminal = 'Terminal',
    ProcessEnd = 'ProcessEnd',
    File = 'File',
    RequestFile = 'RequestFile',
    LaunchModel = 'LaunchModel',
    TerminalResize = 'TerminalResize',
    WaitReceive = 'WaitReceive'
}


export enum SocketReceiveMode {
    JSON,
    FILE
}
