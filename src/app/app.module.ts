import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { MatButtonModule } from '@angular/material/button';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LearnComponent } from './components/learn/learn.component';
import { PracticeComponent } from './components/practice/practice.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CategorySelectorComponent } from './components/common/category-selector/category-selector.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LearnComponent,
    PracticeComponent,
    CategorySelectorComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    MatButtonModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
