import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart, registerables } from 'node_modules/chart.js';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { ProductsService } from 'src/app/services/products-service/products.service';

@Component({
  selector: 'app-income-chart',
  templateUrl: './income-chart.component.html',
  styleUrls: ['./income-chart.component.css'],
})
export class IncomeChartComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(private productsService: ProductsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.productsService.getMonthlyIncome().subscribe((data) => {
        this.buildChart(data);
      })
    );
  }

  private buildChart = (soldPeerMonthArray: number[]): void => {
    let productChart = new Chart('incomeChart', {
      type: 'line',
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
            label: 'income',
            data: soldPeerMonthArray,
            backgroundColor: 'rgb(255, 0, 0)',
            borderColor: 'rgb(26, 233, 75)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Monthly Income Chart',
          },
        },
      },
    });
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
