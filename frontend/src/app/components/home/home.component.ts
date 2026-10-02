import { Component, HostListener } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';

type DashboardChart = 'members' | 'products' | 'genders' | 'income';

interface DashboardCard {
  title: string;
  subtitle: string;
  icon: string;
  chart: DashboardChart;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  readonly today: Date = new Date();

  readonly cards: DashboardCard[] = [
    {
      title: 'New members',
      subtitle: 'Members added per month',
      icon: 'person_add',
      chart: 'members',
    },
    {
      title: 'Monthly income',
      subtitle: 'Revenue from product sales',
      icon: 'payments',
      chart: 'income',
    },
    {
      title: 'Products sold',
      subtitle: 'Units sold per month',
      icon: 'shopping_bag',
      chart: 'products',
    },
    {
      title: 'Member genders',
      subtitle: 'Split of your current members',
      icon: 'pie_chart',
      chart: 'genders',
    },
  ];

  constructor(private authService: AuthenticationService) {}

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    if (this.authService.isAuthenticated()) {
      //TODO: find a better way
      event.preventDefault();
      window.history.forward();
    }
  }
}
