
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { FileService } from '../../files/services/file.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { EndpointService } from '../../endpoints/services/endpoint.service';
import { Model } from '../../codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';

// CodeMirror options.
import hyperlambda from '../../codemirror/options/hyperlambda.json';

/*
 * Test model encapsulating a single test, and possibly its result.
 */
class TestModel {

  // Filename for test.
  filename: string;

  // Whether or not execution was a success or not.
  success?: boolean;

  // Content of test.
  content?: Model;
}

/**
 * Assumption/integration test runner for verifying integrity of system.
 */
@Component({
  selector: 'app-diagnostics-assumptions',
  templateUrl: './diagnostics-assumptions.component.html',
  styleUrls: ['./diagnostics-assumptions.component.scss']
})
export class DiagnosticsTestsComponent implements OnInit {

  // Filter for which items to display.
  private filter: string = '';

  /**
   * List of all tests in system.
   */
  public tests: TestModel[] = [];

  /**
   * What tests are currently being edited and viewed.
   */
  public selectedTests: string[] = [];

  /**
   * Filter form control for filtering users to display.
   */
  public filterFormControl: FormControl;

  /**
   * Creates an instance of your component.
   * 
   * @param fileService Needed to load test files from backend
   * @param feedbackService Needed to provide feedback to user
   * @param endpointService Used to retrieve list of all tests from backend
   */
  constructor(
    private fileService: FileService,
    private feedbackService: FeedbackService,
    private endpointService: EndpointService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Creating our filtering control.
    this.filterFormControl = new FormControl('');
    this.filterFormControl.setValue('');
    this.filterFormControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: string) => {
        this.filter = query;
      });

    // Retrieving all tests form backend.
    this.endpointService.tests().subscribe((tests: string[]) => {

      // Assigning result to model.
      this.tests = tests.filter(x => x.endsWith('.hl')).map(x => {
        return {
          filename: x,
          success: null,
          content: null,
        }
      });

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user wants to clear filter.
   */
  public clearFilter() {
    this.filterFormControl.setValue('');
  }

  /**
   * Returns tests that should be display due to matching filter condition.
   */
  public getFilteredTests() {
    return this.tests.filter(x => x.filename.indexOf(this.filter) !== -1);
  }

  /**
   * Returns test name, without its path parts.
   * 
   * @param path Complete path for test
   */
  public getName(path: string) {

    // Stripping away path parts, in addition to extension.
    const result = path.substr(path.lastIndexOf('/') + 1);
    return result.substr(0, result.length - 3);
  }

  /**
   * Toggles the details view for a single test.
   * 
   * @param test Test to toggle details for
   */
  public toggleDetails(test: TestModel) {

    // Checking if we're already displaying details for current item.
    const idx = this.selectedTests.indexOf(test.filename);
    if (idx !== -1) {

      // Hiding item.
      this.selectedTests.splice(idx, 1);

    } else {

      // Displaying item.
      this.selectedTests.push(test.filename);

      // Retrieving test file from backend.
      this.fileService.loadFile(test.filename).subscribe((file: string) => {
        test.content = {
          hyperlambda: file,
          options: hyperlambda,
        };
      });
    }
  }

  /**
   * Returns true if we should display the details view for specified user.
   * 
   * @param user User to check if we should display details for
   */
  public shouldDisplayDetails(user: TestModel) {

    // Returns true if we're currently displaying this particular item.
    return this.selectedTests.filter(x => x === user.filename).length > 0;
  }

  /**
   * Runs the specified test.
   * 
   * @param el Full path to test
   */
  public executeTest(test: TestModel) {

    // Invoking backend to execute the test.
    this.endpointService.executeTest(test.filename).subscribe((res: Response) => {

      // Assigning result of test execution to model.
      test.success = res.result === 'success';

      // Providing feedback to user.
      if (res.result === 'success') {
        this.feedbackService.showInfoShort('Assumption succeeded');
      } else {
        this.feedbackService.showError('Assumption failed, check your log to see why');
      }

    }, (error: any) => {

      // Oops, test raised an exception (or something).
      test.success = false;
      this.feedbackService.showError(error);
    });
  }

  /**
   * Deletes the specified assumption test.
   * 
   * @param test Test to delete
   */
  public deleteTest(test: TestModel) {

    // Asking user to confirm action.
    this.feedbackService.confirm(
      'Please confirm action',
      'Are you sure you want to delete the specified assumption?',
      () => {

        // Invoking backend to delete file.
        this.fileService.deleteFile(test.filename).subscribe(() => {

          // Showing user some feedback.
          this.feedbackService.showInfo('Assumption successfully deleted');

          // Making sure we no longer edit current test.
          this.toggleDetails(test);

          // Removing test from table's model.
          this.tests.splice(this.tests.indexOf(test), 1);

          // Ensuring table is re-rendered.
          this.tests = this.tests.filter(x => true);
        });
      }
    );
  }

  /**
   * Saves an assumption test.
   * 
   * @param filename Filename of test
   * @param content Content of test
   */
  public saveTest(filename: string, content: string) {

    // Invoking backend to save test.
    this.fileService.saveFile(filename, content).subscribe(() => {

      // Providing feedback to user.
      this.feedbackService.showInfoShort('Assumption successfully saved');
    });
  }

  /**
   * Invoked when user wants to execute all tests.
   */
  public executeAll() {

    // Invoking method that executes all tests sequentially, making sure we clone array in process.
    this.executeTopTest(this.tests.filter(x => true));
  }

  /*
   * Private helper methods.
   */

  private executeTopTest(tests: TestModel[]) {

    // Checking if we're done
    if (tests.length === 0) {

      // Done, filtering out successful tests.
      if (this.tests.filter(x => x.success === false).length === 0) {
        this.feedbackService.showInfo('All assumptions were successfully assumed');
      } else {
        this.feedbackService.showError('Oops, one or more tests failed!');
      }

    } else {

      // Invoking backend for top test.
      this.endpointService.executeTest(tests[0].filename).subscribe((result: Response) => {
        if (result.result === 'success') {
          tests[0].success = true;
        } else {
          tests[0].success = false;
        }

        // Removing top test and executing next in chain.
        tests.splice(0, 1);
        this.executeTopTest(tests);

      }, () =>  {

        // Oops, not a successful response from server!
        tests[0].success = false;

        // Removing top test and executing next in chain.
        tests.splice(0, 1);
        this.executeTopTest(tests);
      });
    }
  }
}
