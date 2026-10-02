import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart, registerables } from 'node_modules/chart.js';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { ProductsService } from 'src/app/services/products-service/products.service';

@Component({
  selector: 'app-products-chart',
  templateUrl: './products-chart.component.html',
  styleUrls: ['./products-chart.component.css'],
})
export class ProductsChartComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(private productsService: ProductsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.productsService.getSoldProductsPeerMonth().subscribe((data) => {
        this.buildChart(data);
      })
    );
  }

  private buildChart = (soldPeerMonthArray: number[]): void => {
    let productChart = new Chart('productSalesChart', {
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
            label: 'Sold products',
            data: soldPeerMonthArray,
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
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
            text: 'Products Sales Chart',
          },
        },
      },
    });
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
