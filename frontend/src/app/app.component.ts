import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WebSocketService } from './services/web-socket.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {
  title = 'easyfit';

  constructor(private webSocketService: WebSocketService) {}
}
