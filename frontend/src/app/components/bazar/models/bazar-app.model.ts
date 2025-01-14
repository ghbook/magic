
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

/**
 * Meta information for a single Bazar app.
 */
export class BazarApp {

  /**
   * Bazar app's ID.
   */
  id: number;

  /**
   * Name of app.
   */
  name: string;

  /**
   * Description of app.
   */
  description: string;

  /**
   * Price of app, if the app is free this will be 0.
   */
  price: number;

  /**
   * Current version of app.
   */
  version: string;

  /**
   * Type of app, typically 'module', 'template', etc ...
   */
  type: string;

  /**
   * Name of folder where app should be installed.
   * 
   * Combines with type, this checks to see if we already have an (old?) version installed.
   */
  folder_name: string;

  /**
   * When the app was published.
   */
  created: Date;
}
