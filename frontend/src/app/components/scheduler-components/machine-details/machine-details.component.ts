import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Machine } from 'src/app/model/machine';

@Component({
  selector: 'app-machine-details',
  templateUrl: './machine-details.component.html',
  styleUrls: ['./machine-details.component.css'],
})
export class MachineDetailsComponent implements OnInit {
  machineToDesplay: Machine;

  constructor(@Inject(MAT_DIALOG_DATA) private machine: Machine) {
    this.machineToDesplay = this.machine;
  }

  ngOnInit(): void {}
}
