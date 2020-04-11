import { Component } from '@angular/core';

@Component({
  selector: 'app-data-binding',
  templateUrl: './app-data-binding.component.html',
  styleUrls: ['./app-data-binding.component.css']
})
export class AppDataBindingComponent {
  serverElements = [{ type: 'server', name: 'Testerver', content: 'Just a test' }];

  onServerAdded(serverData: {serverName: string, serverContent: string}) {
    this.serverElements.push({
      type: 'server',
      name: serverData.serverName,
      content: serverData.serverContent
    });
  }

  onBlueprintAdded(blueprintData: {serverName: string, serverContent: string}) {
    this.serverElements.push({
      type: 'blueprint',
      name: blueprintData.serverName,
      content: blueprintData.serverContent
    });
  }

}
