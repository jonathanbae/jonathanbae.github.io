import { CourseProjectModule } from './course-project/course-project.module';
import { CourseProjectComponent } from './course-project/course-project.component';
import { ServerComponent } from './server/server.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ServersComponent } from './servers/servers.component';
import { WarningAlertComponent } from './warning-alert/warning-alert.component';
import { SuccessAlertComponent } from './success-alert/success-alert.component';
import { AppDataBindingComponent } from './data-binding/app-data-binding.component';
import { AppDataBindingModule } from './data-binding/app-data-binding.module';

@NgModule({
  declarations: [
    AppComponent,
    ServerComponent,
    ServersComponent,
    WarningAlertComponent,
    SuccessAlertComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    CourseProjectModule,
    AppDataBindingModule
  ],
  providers: [],
  bootstrap: [AppComponent, CourseProjectComponent, AppDataBindingComponent]
})
export class AppModule { }
