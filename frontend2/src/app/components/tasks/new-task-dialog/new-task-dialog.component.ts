
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, Inject, Injector } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { TaskService } from 'src/app/services/task.service';
import { BaseComponent } from 'src/app/components/base.component';
import { MessageService } from 'src/app/services/message.service';

/**
 * Modal dialog used to allow user to create a new role in the system.
 */
@Component({
  selector: 'app-new-task-dialog',
  templateUrl: './new-task-dialog.component.html',
  styleUrls: ['./new-task-dialog.component.scss']
})
export class NewTaskDialogComponent extends BaseComponent {

  /**
   * Name of new task to create.
   */
  public name = '';

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog when user clicks create button
   * @param taskService Needed to be able to create our task
   * @param data If updating role, this is the role we're updating
   */
  constructor(
    private dialogRef: MatDialogRef<NewTaskDialogComponent>,
    private taskService: TaskService,
    protected injector: Injector,
    @Inject(MAT_DIALOG_DATA) public data: string) {
    super(injector);
    if (this.data) {
      this.name = data;
    }
  }

  /**
   * Invoked when user clicks the create button to create a new role.
   */
  public create() {

    // Invoking backend to create a new task.
    this.taskService.create(this.name, '.your-task-hyperlambda-here').subscribe(() => {

      // Success! Closing dialog and informing the caller of the name of the new task.
      this.dialogRef.close(this.name);

    }, (error: any) => this.showError(error));
  }
}
