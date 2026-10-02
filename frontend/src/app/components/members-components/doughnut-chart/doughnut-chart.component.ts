import { Input, OnDestroy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { MembersService } from 'src/app/services/members-service/members.service';

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html',
  styleUrls: ['./doughnut-chart.component.css'],
})
export class DoughnutChartComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private genders: number[] = [];

  constructor(private membersService: MembersService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.membersService.getGendersCount().subscribe((data) => {
        this.genders[0] = data[0];
        this.genders[1] = data[1];
        var myChart = new Chart('myChart', {
          type: 'doughnut',
          data: {
            labels: ['Males', 'Females'],
            datasets: [
              {
                label: '# of genders',
                data: [this.genders[0], this.genders[1]],
                backgroundColor: [
                  'rgb(255, 99, 132)',
                  'rgb(54, 162, 235)',
                  'rgb(255, 205, 86)',
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      })
    );
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
