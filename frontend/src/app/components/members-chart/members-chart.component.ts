import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Chart, registerables } from 'node_modules/chart.js';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { MembersService } from 'src/app/services/members-service/members.service';
@Component({
  selector: 'app-members-chart',
  templateUrl: './members-chart.component.html',
  styleUrls: ['./members-chart.component.css'],
})
export class MembersChartComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(private membersService: MembersService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.membersService.getMembersGraphData().subscribe((data) => {
        var myChart = new Chart('membersChart', {
          type: 'bar',
          data: {
            labels: [
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
            ],
            datasets: [
              {
                label: 'Added members',
                data: data,
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
                ticks: {
                  stepSize: 1,
                },
              },
            },
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Added Members Chart',
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
