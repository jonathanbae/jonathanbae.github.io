import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { AppDataBindingComponent } from './app-data-binding.component';

@NgModule({
  declarations: [
    AppDataBindingComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
  ],
  exports: [AppDataBindingComponent]
})
export class AppDataBindingModule { }
