import { Component } from '@angular/core';

@Component({
  selector: 'app-data-binding',
  templateUrl: './app-data-binding.component.html',
  styleUrls: ['./app-data-binding.component.css']
})
export class AppDataBindingComponent {
  serverElements = [];
  newServerName = '';
  newServerContent = '';

  onAddServer() {
    this.serverElements.push({
      type: 'server',
      name: this.newServerName,
      content: this.newServerContent
    });
  }

  onAddBlueprint() {
    this.serverElements.push({
      type: 'blueprint',
      name: this.newServerName,
      content: this.newServerContent
    });
  }
}
