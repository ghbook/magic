
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Subscription } from 'rxjs';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

// Application specific imports.
import { Router } from '@angular/router';
import { Status } from 'src/app/models/status.model';
import { BaseComponent } from '../../base.component';
import { ConfigService } from 'src/app/services/config.service';
import { Message, Messages } from 'src/app/models/message.model';
import { MessageService } from 'src/app/services/message.service';
import { LoaderInterceptor } from 'src/app/services/interceptors/loader.interceptor';

/**
 * Component responsible for allowing user to setup system.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent extends BaseComponent implements OnInit, OnDestroy {

  // Used to subscribe to setup status changed messages.
  private subscriber: Subscription;

  /**
   * CSS class for configuration component.
   */
  public configurationCssClass = 'setup-component';

  /**
   * CSS class for magic crudify component.
   */
  public databaseCssClass = 'setup-component';

  /**
   * CSS class for crypto component.
   */
  public cryptoCssClass = 'setup-component';

  /**
   * Where we are in the setup process.
   */
  public process: string = null;

  /**
   * Provided by parent component during creation of component.
   * Contains the status of setup process.
   */
  @Input() public status: Status;

  /**
   * Creates an instance of your component.
   * 
   * @param router Router service used to redirect user when setup process is finished
   * @param configService Service used to retrieve and save configuration settings, etc
   * @param loaderInterceptor Used to explicitly turn on and off loader spinner animation
   * @param messageService Service used to publish messages to other components in the system
   */
  constructor(
    private router: Router,
    private configService: ConfigService,
    private loaderInterceptor: LoaderInterceptor,
    protected messageService: MessageService) {
      super(messageService);
    }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

    /*
     * Checking where we are in the setup process,
     * and making sure we display the correct text to user.
     */
    if (!this.status.setup_done) {
      this.process = 'configuration';
    } else if (!this.status.magic_crudified) {
      this.process = 'endpoints';
    } else if (!this.status.server_keypair) {
      this.process = 'cryptography key pair';
    }

    // Subscribing to messages sent by other components.
    this.subscriber = this.messageService.subscriber().subscribe((msg: Message) => {

      // Checking if we're interested in this message.
      switch(msg.name) {

        /*
         * Making sure we subscribe to the setup state changed event,
         * such that we can change which setup component to currently
         * display to user.
         */
        case Messages.SETUP_STATE_CHANGED:

          // Checking which component triggered a state change.
          switch (msg.content) {

            // Triggered when setup of configuration is done.
            case 'config':

              // Animating component out of view.
              this.configurationCssClass = 'setup-component animate-out';
              setTimeout(() => {
                this.configService.status().subscribe((res: Status) => {
                  this.status = res;
                  this.process = 'endpoints';
                }, (error: any) => this.showError(error));
              }, 500);
              break;

            // Triggered when crudification of magic database is done.
            case 'database':

              // Animating component out of view.
              this.databaseCssClass = 'setup-component animate-out';
              setTimeout(() => {
                this.configService.status().subscribe((res: Status) => {
                  this.status = res;
                  this.process = 'cryptography key pair';
                }, (error: any) => this.showError(error));
              }, 500);
              break;

            // Triggered when user has generated a cryptography key pair.
            case 'crypto':

              // Animating component out of view.
              this.cryptoCssClass = 'setup-component animate-out';
              setTimeout(() => {
                this.configService.status().subscribe((res: Status) => {
                  this.status = res;
                  this.process = 'done';
                  setTimeout(() => {
                    this.router.navigate(['/']);
                    this.loaderInterceptor.decrement();
                  }, 500);
                }, (error: any) => this.showError(error));
              }, 500);
              break;
          }
      }
    });
  }

  /**
   * Implementation of OnDestroy.
   */
  public ngOnDestroy() {
    this.subscriber.unsubscribe();
  }

  /**
   * Returns the percentage of how much more work needs to be
   * done in order to finish the setup process of the system.
   */
  public getSetupProgress() {
    let percentage = 0;
    if (this.status.setup_done) {
      percentage += 33;
    }
    if (this.status.magic_crudified) {
      percentage += 33;
    }
    if (this.status.server_keypair) {
      percentage += 33;
    }
    return percentage === 99 ? 100 : percentage;
  }
}