import { CoreUtil } from './../common/core-util';
import { AppUtil } from './../common/app-util';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs';
import { AppNotificationMessage } from '../model/app-notification-message';

export class ClientDataService {
  constructor(public url: string, public http: HttpClient) {}

  public getAll = (gymId: number): Observable<AppNotificationMessage[]> => {
    return this.http
      .get<AppNotificationMessage[]>(
        `${this.url}/notifications?gymId=${gymId}`,
        {
          headers: CoreUtil.createAuthorizationHeader(),
        }
      )
      .pipe(catchError(AppUtil.handleError));
  };

  delete(id: string) {
    return this.http
      .delete(this.url + id, { headers: CoreUtil.createAuthorizationHeader() })
      .pipe(map((response: string) => JSON.parse(response)))
      .pipe(catchError(AppUtil.handleError));
  }

  create(resource) {
    return this.http
      .post(this.url, resource, {
        headers: CoreUtil.createAuthorizationHeader(),
      })
      .pipe(catchError(AppUtil.handleError));
  }

  get(id: string) {
    return this.http
      .get(this.url + id, { headers: CoreUtil.createAuthorizationHeader() })
      .pipe(catchError(AppUtil.handleError));
  }

  getAllByParameter(
    filterParamMap: Map<string, string>,
    page: number,
    size: number
  ) {
    let url = `${this.url}all`;
    const hasFilterParameters: boolean =
      filterParamMap && filterParamMap.size > 0;

    if (hasFilterParameters) {
      let firstIteration = true;

      filterParamMap.forEach((value: string, key: string) => {
        if (firstIteration) {
          url += `?${key}=${value}`;
          firstIteration = false;
        } else {
          url += `&${key}=${value}`;
        }
      });
    }

    if (page != null && typeof page !== undefined) {
      if (hasFilterParameters) {
        url += '&';
      } else {
        url += '?';
      }

      url += `page=${page}&size=${size}`;
    }

    return this.http
      .get(url, { headers: CoreUtil.createAuthorizationHeader() })
      .pipe(catchError(AppUtil.handleError));
  }

  getAllByCustomUrl(resourceUrl: string, page: number, size: number) {
    resourceUrl = this.url + resourceUrl;
    if (page != null && typeof page !== undefined) {
      resourceUrl += `?page=${page}&size=${size}`;
    }

    return this.http
      .get(resourceUrl, { headers: CoreUtil.createAuthorizationHeader() })
      .pipe(catchError(AppUtil.handleError));
  }
}
