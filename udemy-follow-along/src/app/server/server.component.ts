import { Component } from '@angular/core';

@Component({
    selector: 'app-server',
    templateUrl: './server.component.html',
    styles: [`
    .online {
        color:white;
     }
    `]
})
export class ServerComponent {
    serverId = 10;
    serverStatus = 'offline';

    constructor() {
        this.serverStatus = Math.random() > 0.5 ? 'online' : 'offline';
    }

    getServerStatus() {
        return this.serverStatus;
    }

    styleServer() {
        if (this.serverStatus === 'online') {
            return { 'background-color': 'darkGreen', border: '1px solid green' };
        } else {
            return { 'background-color': 'mistyrose', border: '1px solid red' };
        }
    }
}
