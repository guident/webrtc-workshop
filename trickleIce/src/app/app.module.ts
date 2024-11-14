import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    declarations: [],
    imports: [
        BrowserModule,
        AppComponent,
        HttpClientModule,
    ],
    providers: [],
    // bootstrap: [AppComponent]
})
export class AppModule { }