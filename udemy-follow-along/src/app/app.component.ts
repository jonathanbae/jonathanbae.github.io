import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'udemy-follow-along';
  username = '';
  log = [];
  secretShown = false;

  resetUsername() {
    this.username = '';
  }

  showSecret() {
    this.secretShown = true;
    this.log.push(new Date().toLocaleString());
  }

  moreThanFiveClicks(i: any) {
    if (i >= 5) {
      return 'blue';
    } else {
      return 'transparent';
    }
  }
}
