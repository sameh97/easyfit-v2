import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { CoreUtil } from 'src/app/common/core-util';
import { Bill } from 'src/app/model/bill';
import { Product } from 'src/app/model/product';
import { AuthenticationService } from '../authentication.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly url = `${AppConsts.BASE_URL}/api`;
  private gymId: number;
  private productsSubject: BehaviorSubject<Product[]> = new BehaviorSubject<
    Product[]
  >([]);
  private billsSubject: BehaviorSubject<Bill[]> = new BehaviorSubject<Bill[]>(
    []
  );

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {
    this.authService.currentUser$
      .pipe(filter((user) => AppUtil.hasValue(user)))
      .subscribe((user) => {
        this.gymId = user.gymId;
        this.initGymID();
      });
  }

  public getAll(): Observable<Product[]> {
    const gymId = this.authService.getGymId();

    return this.http
      .get<Product[]>(`${this.url}/products?gymId=${gymId}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((products) => {
          this.productsSubject.next(products);
          return this.productsSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  }

  public getSoldProductsPeerMonth(): Observable<number[]> {
    return this.http.get<number[]>(
      `${this.url}/sold-products?gymId=${this.gymId}`,
      { headers: CoreUtil.createAuthorizationHeader() }
    );
  }

  public getMonthlyIncome(): Observable<number[]> {
    return this.http.get<number[]>(
      `${this.url}/monthly-income?gymId=${this.gymId}`,
      { headers: CoreUtil.createAuthorizationHeader() }
    );
  }

  public getAllBills(): Observable<Bill[]> {
    const gymId = this.authService.getGymId();

    return this.http
      .get<Bill[]>(`${this.url}/bills?gymId=${gymId}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        switchMap((bills) => {
          this.billsSubject.next(bills);
          return this.billsSubject.asObservable();
        })
      )
      .pipe(catchError(AppUtil.handleError));
  }

  // TODO: make it observable:
  private initGymID = (): void => {
    this.gymId = this.authService.getGymId();
  };

  public sell = (bill: Bill): Observable<Bill> => {
    return this.http
      .post<Bill>(`${this.url}/add-bill`, bill, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((bill: Bill) => {
          AppUtil.addToSubject(this.billsSubject, bill);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public create = (product: Product): Observable<Product> => {
    this.initGymID();
    product.gymId = this.gymId;

    return this.http
      .post<Product>(`${this.url}/add-product?gymId=${this.gymId}`, product, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((product: Product) => {
          AppUtil.addToSubject(this.productsSubject, product);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public update = (product: Product): Observable<Product> => {
    return this.http
      .put<Product>(`${this.url}/update-product`, product, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap((product: Product) => {
          AppUtil.updateInSubject(this.productsSubject, product);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public delete = (id: number): Observable<any> => {
    return this.http
      .delete(`${this.url}/delete-product?id=${id}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          AppUtil.removeFromSubject(this.productsSubject, id);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };

  public deleteBill = (id: number): Observable<any> => {
    return this.http
      .delete(`${this.url}/delete-bill?id=${id}`, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(
        tap(() => {
          AppUtil.removeFromSubject(this.billsSubject, id);
        })
      )
      .pipe(catchError(AppUtil.handleError));
  };
}
