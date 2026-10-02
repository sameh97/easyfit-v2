import { Member } from './../app/model/member';
import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'searchfilter',
})
export class SearchfilterPipe implements PipeTransform {
  transform(members$: Observable<Member[]>, searchValue: string): Observable<Member[]> {
    if (!members$ || !searchValue) {
      return members$;
    }

    return members$.pipe(
      map((members) =>
        members.filter((member) =>
          member.firstName
            .toLocaleLowerCase()
            .includes(searchValue.toLocaleLowerCase())
        )
      )
    );
  }
}
